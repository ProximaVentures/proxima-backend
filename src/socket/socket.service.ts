import { Server, Socket } from 'socket.io';
import { createServer, Server as HttpServer } from 'http';
import { authenticateSocket } from './socket.middleware.js';
import type { AuthenticatedSocket } from './socket.middleware.js';
import { SocketEvents } from './events.js';
import redis from '../utils/redis.js';
import prisma from '../utils/prisma.js';
import { MessageType } from '@prisma/client';

/**
 * SocketService
 * A singleton class that manages the Socket.io server instance,
 * handling heartbeats, connection lifecycles, and event routing.
 */
class SocketService {
    private static instance: SocketService;
    private _io: Server | null = null;

    private constructor() {}

    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    /**
     * Initialize the Socket.io server.
     * Integrates with HTTPServer and sets up global middleware.
     */
    public initialize(httpServer: HttpServer): Server {
        if (this._io) {
            console.warn('[⚠️ SOCKET SERVICE]: Socket.io already initialized.');
            return this._io;
        }

        // 🛡️ SECURITY: Restrict CORS to allowed origins in production
        const allowedOrigins = process.env.CORS_ORIGINS
            ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
            : ['http://localhost:3000', 'http://localhost:5000'];

        this._io = new Server(httpServer, {
            cors: {
                origin: process.env.NODE_ENV === 'production' ? allowedOrigins : '*',
                methods: ['GET', 'POST'],
                credentials: true
            },
            pingInterval: 10000, // 10s Heartbeat
            pingTimeout: 5000,   // 5s Timeout (Strict)
            maxHttpBufferSize: 1e6 // 1MB buffer limit to prevent memory bloat/attacks
        });

        // 🛡️ Apply Authentication Middleware
        this._io.use(authenticateSocket());

        // ⚡ Main Connection Handler
        this._io.on(SocketEvents.CONNECTION, (socket: AuthenticatedSocket) => {
            this.handleConnection(socket);
        });

        console.log('[⚡ SOCKET SERVICE]: Engine initialized and heartbeats activated.');
        return this._io;
    }

    public get io(): Server {
        if (!this._io) throw new Error('[🚨 SOCKET SERVICE]: Socket.io is not initialized.');
        return this._io;
    }

    /**
     * Handles connection lifecycle and top-level events.
     */
    private async handleConnection(socket: AuthenticatedSocket) {
        if (!socket.user) return;
        const userId = socket.user.id;

        // 1. Join Private Room (For direct notifications to this specific user)
        socket.join(`user:${userId}`);
        
        // 2. Set Status in Redis (Fast Presence Cache)
        await redis.set(`user:status:${userId}`, 'online', 'EX', 3600 * 24); // Expires in 24h
        
        // 3. Broadcast Online Status
        socket.broadcast.emit(SocketEvents.USER_ONLINE, { userId });

        console.log(`[⚡ SOCKET]: User ${userId} connected and joined private room.`);

        // --- Core Messaging Events ---

        // 🛡️ SECURITY: Validate participation before joining a conversation room
        socket.on(SocketEvents.JOIN_CONVERSATION, async (conversationId: string) => {
            if (!conversationId || typeof conversationId !== 'string') return;

            try {
                const isParticipant = await prisma.conversationParticipant.findFirst({
                    where: { conversationId, userId }
                });

                if (!isParticipant) {
                    console.error(`[🚨 SOCKET SECURITY]: User ${userId} attempted to join unauthorized chat ${conversationId}.`);
                    return socket.emit(SocketEvents.ERROR, { message: 'Unauthorized access.' });
                }

                socket.join(`chat:${conversationId}`);
            } catch (err: any) {
                console.error('[🚨 SOCKET JOIN ERROR]:', err.message);
            }
        });

        // Leave Conversation
        socket.on(SocketEvents.LEAVE_CONVERSATION, (conversationId: string) => {
            if (!conversationId || typeof conversationId !== 'string') return;
            socket.leave(`chat:${conversationId}`);
        });

        // Send Message
        socket.on(SocketEvents.MESSAGE_SEND, async (data: { conversationId: string; content?: string; type?: MessageType; tempId?: string; replyToId?: string; fileUrl?: string; fileName?: string; fileSize?: string }) => {
            try {
                const { conversationId, content, type = MessageType.TEXT, tempId, replyToId, fileUrl, fileName, fileSize } = data;

                // 🛡️ Input validation
                if (!conversationId || typeof conversationId !== 'string') {
                    return socket.emit(SocketEvents.ERROR, { message: 'Invalid conversation ID.' });
                }

                if (!content?.trim() && !fileUrl) {
                    return socket.emit(SocketEvents.ERROR, { message: 'Message content or file is required.' });
                }

                // 🛡️ Content length limit (prevent abuse)
                if (content && content.length > 10000) {
                    return socket.emit(SocketEvents.ERROR, { message: 'Message content too long (max 10,000 characters).' });
                }

                // A. Validate Participation (Security Check)
                const isParticipant = await prisma.conversationParticipant.findFirst({
                    where: { conversationId, userId }
                });

                if (!isParticipant) {
                    console.error(`[🚨 SOCKET SECURITY]: User ${userId} tried to message unauthorized chat ${conversationId}.`);
                    return socket.emit(SocketEvents.ERROR, { message: 'Unauthorized access to this conversation.' });
                }

                // B. Persist to DB
                const message = await prisma.$transaction(async (tx) => {
                    const msg = await tx.message.create({
                        data: {
                            conversationId,
                            senderId: userId,
                            content: content?.trim() || '',
                            type: type as MessageType,
                            replyToId: replyToId || null,
                            fileUrl: fileUrl || null,
                            fileName: fileName || null,
                            fileSize: fileSize || null
                        },
                        include: {
                            sender: {
                                select: {
                                    id: true,
                                    email: true,
                                    profile: {
                                        select: { firstName: true, lastName: true, avatarUrl: true }
                                    }
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

                    // C. Update Conversation Timestamp for sorting
                    await tx.conversation.update({
                        where: { id: conversationId },
                        data: { 
                            lastMessageAt: new Date(),
                            lastMessageId: msg.id
                        }
                    });

                    return msg;
                });

                // D. Fetch all participants to ensure the message reaches them
                const participants = await prisma.conversationParticipant.findMany({
                    where: { conversationId },
                    select: { userId: true }
                });

                // E. Emit to the conversation room (for those actively viewing it)
                this._io?.to(`chat:${conversationId}`).emit(SocketEvents.MESSAGE_RECEIVED, {
                    ...message,
                    tempId
                });

                // F. Emit to each participant's private room (to trigger unread counts/notifications globally)
                for (const p of participants) {
                    if (p.userId !== userId) {
                        this._io?.to(`user:${p.userId}`).emit(SocketEvents.MESSAGE_RECEIVED, {
                            ...message,
                            isNewForUser: true 
                        });
                    }
                }

            } catch (err: any) {
                console.error('[🚨 SOCKET MESSAGE ERROR]:', err.message);
                socket.emit(SocketEvents.ERROR, { message: 'Failed to transmit message signal.' });
            }
        });



        // Typing Indicators (Volatile — no persistence needed)
        socket.on(SocketEvents.TYPING_START, (conversationId: string) => {
            if (!conversationId || typeof conversationId !== 'string') return;
            socket.to(`chat:${conversationId}`).emit(SocketEvents.TYPING_START, { conversationId, userId });
        });

        socket.on(SocketEvents.TYPING_STOP, (conversationId: string) => {
            if (!conversationId || typeof conversationId !== 'string') return;
            socket.to(`chat:${conversationId}`).emit(SocketEvents.TYPING_STOP, { conversationId, userId });
        });

        // --- Cleanup Lifecycle ---
        socket.on(SocketEvents.DISCONNECT, async () => {
            console.log(`[⚡ SOCKET]: User ${userId} disconnected.`);
            
            // A. Update Status in Redis
            await redis.del(`user:status:${userId}`);
            
            // B. Broadcast Offline Status
            socket.broadcast.emit(SocketEvents.USER_OFFLINE, { userId });

            // Socket.io automatically handles room cleanup on disconnect
        });
    }

    /**
     * Utility method to send a notification to a specific user (outside of a chat session).
     */
    public notifyUser(userId: string, event: string, data: any) {
        this._io?.to(`user:${userId}`).emit(event, data);
    }
}

export default SocketService.getInstance();
