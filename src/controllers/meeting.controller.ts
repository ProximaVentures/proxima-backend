import type { Response } from 'express';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';
import type { AuthRequest } from '../interfaces/auth.interface.js';
import prisma from '../utils/prisma.js';
import { sendMeetingEmail } from '../utils/email.js';
import SocketService from '../socket/socket.service.js';
import { SocketEvents } from '../socket/events.js';
import { queueNotification } from '../utils/qstash.js';

/**
 * Schedule a new meeting for a conversation
 */
export const scheduleMeeting = asyncHandler(async (req: AuthRequest, res: Response) => {
    const conversationId = req.params.conversationId as string;
    const { title, startTime, meetingLink } = req.body;
    const userId = req.user?.id;

    if (!userId) throw new AppError('Unauthorized', 401);
    if (!title || !startTime) throw new AppError('Title and start time are required', 400);

    // 1. Validate Conversation & Participation
    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { 
            participants: {
                include: { user: true }
            }
        }
    }) as any;

    if (!conversation) throw new AppError('Conversation not found', 404);

    const isParticipant = conversation.participants.some((p: any) => p.userId === userId);
    if (!isParticipant) throw new AppError('Only participants can schedule meetings', 403);

    // 2. Create Meeting in DB
    const meeting = await prisma.meeting.create({
        data: {
            title,
            startTime: new Date(startTime),
            meetingLink: meetingLink || 'https://meet.google.com',
            conversationId,
            creatorId: userId,
            status: 'SCHEDULED'
        },
        include: {
            creator: {
                select: {
                    id: true,
                    profile: { select: { firstName: true, avatarUrl: true, jobTitle: true, city: true, country: true, metadata: true, preferences: true } }
                }
            }
        }
    });

    // 3. Create In-App Notifications for OTHER participants
    const otherParticipants = conversation.participants.filter((p: any) => p.userId !== userId);
    
    for (const participant of otherParticipants) {
        // Create DB Notification
        await prisma.notification.create({
            data: {
                userId: participant.userId,
                title: 'New Meeting Scheduled',
                message: `Admin has scheduled a meeting: ${title} for ${new Date(startTime).toLocaleString()}`,
                type: 'MEETING',
                link: `/messages?activeTab=chat&conversationId=${conversationId}`
            }
        });

        // Send Email
        if (participant.user.email) {
            sendMeetingEmail(participant.user.email, title, new Date(startTime), meetingLink || 'https://meet.google.com').catch(err => {
                console.error(`[🚨 MEETING EMAIL FAILED]: ${participant.user.email}`, err);
            });
        }

        // Emit Socket Event (For in-app real-time notification)
        SocketService.notifyUser(participant.userId, SocketEvents.MEETING_SCHEDULED, {
            meeting,
            conversationId
        });
    }

    // Queue Web Push notifications via QStash
    const recipientIds = otherParticipants.map((p: any) => p.userId);
    if (recipientIds.length > 0) {
        queueNotification({
            type: 'MEETING_SCHEDULED',
            messageId: meeting.id,
            conversationId,
            senderId: userId,
            senderName: (meeting.creator as any)?.profile?.firstName || 'Admin',
            recipientIds,
            title: 'New Meeting Scheduled 📅',
            body: `${title} scheduled for ${new Date(startTime).toLocaleString()}`,
            deepLink: `/dashboard/messages?conversation=${conversationId}`,
        }).catch(err => console.error('[⚠️ MEETING QUEUE ERROR]:', err));
    }

    // Also emit to the conversation room so everyone actively chatting sees it
    SocketService.io.to(`chat:${conversationId}`).emit(SocketEvents.MEETING_SCHEDULED, {
        meeting,
        conversationId
    });

    res.status(201).json({
        success: true,
        message: 'Meeting scheduled successfully',
        data: meeting
    });
});

/**
 * Get the latest scheduled meeting for a conversation
 */
export const getLatestMeeting = asyncHandler(async (req: AuthRequest, res: Response) => {
    const conversationId = req.params.conversationId as string;
    const userId = req.user?.id;

    if (!userId) throw new AppError('Unauthorized', 401);

    const meeting = await prisma.meeting.findFirst({
        where: {
            conversationId,
            status: 'SCHEDULED',
            startTime: { gte: new Date() } // Future meetings only
        },
        orderBy: {
            startTime: 'asc'
        },
        include: {
            creator: {
                select: {
                    id: true,
                    profile: { select: { firstName: true, avatarUrl: true, jobTitle: true, city: true, country: true, metadata: true, preferences: true } }
                }
            }
        }
    });

    res.status(200).json({
        success: true,
        data: meeting
    });
});
