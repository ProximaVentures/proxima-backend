import type { Response } from 'express';
import type { AuthRequest } from '../interfaces/auth.interface.js';
import prisma from '../utils/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import { MessageType } from '@prisma/client';

/**
 * ChatController
 * Manages conversation lifecycle and message history retrieval.
 */
export const getConversations = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) throw new AppError('Unauthorized', 401);

    const conversations = await prisma.conversationParticipant.findMany({
        where: { userId },
        include: {
            conversation: {
                include: {
                    participants: {
                        where: { userId: { not: userId } },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    email: true,
                                    profile: {
                                        select: { firstName: true, lastName: true, avatarUrl: true }
                                    }
                                }
                            }
                        }
                    },
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                }
            }
        },
        orderBy: {
            conversation: { updatedAt: 'desc' }
        }
    });

    res.status(200).json({
        success: true,
        data: conversations.map(p => ({
            id: p.conversation.id,
            name: p.conversation.name,
            isGroup: p.conversation.isGroup,
            lastMessage: p.conversation.messages[0] || null,
            updatedAt: p.conversation.updatedAt,
            otherParticipant: p.conversation.participants[0]?.user || null,
            unreadCount: 0 
        }))
    });
};

export const getMessages = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const conversationId = String(req.params.conversationId);
    const { cursor, limit = '20' } = req.query;

    if (!userId) throw new AppError('Unauthorized', 401);
    if (!conversationId) throw new AppError('Conversation ID is required', 400);

    // 1. Verify Member
    const isParticipant = await prisma.conversationParticipant.findUnique({
        where: { conversationId_userId: { conversationId, userId } }
    });

    if (!isParticipant) {
        throw new AppError('You are not a member of this conversation', 403);
    }

    // 2. Fetch Messages with Cursor Pagination
    const limitNum = parseInt(String(limit)) || 20;
    const messages = await prisma.message.findMany({
        where: { conversationId: String(conversationId) },
        take: limitNum,
        skip: cursor ? 1 : 0,
        ...(cursor ? { cursor: { id: String(cursor) } } : {}),
        orderBy: { createdAt: 'desc' },
        include: {
            sender: {
                select: {
                    id: true,
                    profile: { select: { firstName: true, avatarUrl: true } }
                }
            }
        }
    });

    res.status(200).json({
        success: true,
        data: messages.reverse(),
        nextCursor: messages.length === limitNum && messages[0] ? messages[0].id : null
    });
};

export const startPrivateConversation = async (req: AuthRequest, res: Response) => {
    const senderId = req.user?.id;
    const { receiverId } = req.body;

    if (!senderId || !receiverId) throw new AppError('Invalid request parameters', 400);
    if (senderId === receiverId) throw new AppError('Cannot start a chat with yourself', 400);

    // 1. Check if conversation already exists (between exactly these two people)
    const existing = await prisma.conversation.findFirst({
        where: {
            isGroup: false,
            AND: [
                { participants: { some: { userId: senderId } } },
                { participants: { some: { userId: receiverId } } }
            ]
        },
        select: { id: true }
    });

    if (existing) {
        return res.status(200).json({ success: true, data: existing });
    }

    // 2. Create New Private Conversation
    const conversation = await prisma.conversation.create({
        data: {
            isGroup: false,
            participants: {
                create: [
                    { userId: senderId },
                    { userId: receiverId }
                ]
            }
        },
        select: { id: true }
    });

    res.status(201).json({
        success: true,
        data: conversation
    });
};
