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

    const conversations = await prisma.conversation.findMany({
        where: {
            participants: {
                some: { userId }
            }
        },
        include: {
            project: {
                select: { id: true, title: true }
            },
            participants: {
                where: { userId: { not: userId } },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            role: true,
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
            },
            _count: {
                select: {
                    messages: {
                        where: {
                            senderId: { not: userId },
                            isRead: false
                        }
                    }
                }
            }
        },
        orderBy: { updatedAt: 'desc' }
    });

    const data = conversations.map((c) => ({
        id: c.id,
        name: c.name,
        isGroup: c.isGroup,
        lastMessage: c.messages[0] || null,
        updatedAt: c.updatedAt,
        otherParticipant: c.participants[0]?.user || null,
        project: c.project || null,
        unreadCount: c._count.messages
    }));

    res.status(200).json({
        success: true,
        data
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
            },
            replyTo: {
                include: {
                    sender: {
                        select: {
                            id: true,
                            profile: { select: { firstName: true, avatarUrl: true } }
                        }
                    }
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

    // 2. Determine if we should link a project (for Clients)
    let projectId: string | null = null;
    const receiver = await prisma.user.findUnique({
        where: { id: receiverId },
        include: { 
            projects: { 
                orderBy: { createdAt: 'desc' }, 
                take: 1,
                select: { id: true }
            } 
        }
    });

    if (receiver?.role === 'CLIENT' && receiver.projects[0]) {
        projectId = receiver.projects[0].id;
    }

    // 3. Create New Private Conversation
    const conversation = await prisma.conversation.create({
        data: {
            isGroup: false,
            projectId: projectId || undefined,
            participants: {
                create: [
                    { userId: senderId },
                    { userId: receiverId }
                ]
            }
        },
        include: {
            project: { select: { id: true, title: true } }
        }
    });

    res.status(201).json({
        success: true,
        data: conversation
    });
};

export const getTotalUnreadCount = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new AppError('Unauthorized', 401);

    const counts = await prisma.conversationParticipant.findMany({
        where: { userId },
        select: {
            conversationId: true,
            lastSeenAt: true
        }
    });

    let total = 0;
    for (const p of counts) {
        const unread = await prisma.message.count({
            where: {
                conversationId: p.conversationId,
                senderId: { not: userId },
                createdAt: { gt: p.lastSeenAt }
            }
        });
        total += unread;
    }

    res.status(200).json({
        success: true,
        data: { count: total }
    });
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const conversationId = String(req.params.conversationId);

    if (!userId || !conversationId) throw new AppError('Invalid request', 400);

    // 1. Update lastSeenAt for this participant
    await prisma.conversationParticipant.update({
        where: { conversationId_userId: { conversationId, userId } },
        data: { lastSeenAt: new Date() }
    });

    // 2. Mark messages as read where sender is not current user
    await prisma.message.updateMany({
        where: {
            conversationId,
            senderId: { not: userId },
            isRead: false
        },
        data: { isRead: true }
    });

    res.status(200).json({ success: true });
};

export const getAdminDirectory = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId || req.user?.role !== 'ADMIN') {
        throw new AppError('Unauthorized. Admin access required.', 403);
    }

    // 1. Fetch all Clients with their projects
    const clients = await prisma.user.findMany({
        where: { role: 'CLIENT' },
        include: {
            profile: {
                select: { firstName: true, lastName: true, avatarUrl: true }
            },
            projects: {
                select: { id: true, title: true, status: true },
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    // 2. Fetch all Professionals
    const professionals = await prisma.user.findMany({
        where: { role: 'PROFESSIONAL' },
        include: {
            profile: {
                select: { firstName: true, lastName: true, avatarUrl: true, category: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    console.log(`[Admin Directory] Found ${clients.length} clients and ${professionals.length} professionals`);

    // 3. Transform data to look like "Conversations" or at least usable directory items
    // Since these aren't yet conversations, we'll return them as users.
    // The frontend can then decide whether to show them as potential starts.
    res.status(200).json({
        success: true,
        data: {
            clients: clients.map(c => ({
                id: c.id,
                email: c.email,
                role: 'CLIENT',
                profile: c.profile || { firstName: 'Client', lastName: '#' + c.id.slice(-4) },
                project: c.projects[0] || null
            })),
            professionals: professionals.map(p => ({
                id: p.id,
                email: p.email,
                role: 'PROFESSIONAL',
                profile: p.profile || { firstName: 'Pro', lastName: '#' + p.id.slice(-4) }
            }))
        }
    });
};
