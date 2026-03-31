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

        this._io = new Server(httpServer, {
            cors: {
                origin: '*', // We handle CORS at the Express layer, but Socket.io needs its own config
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
        
        // 3. Broadcast Online Status (Optional: Notify friends/participants)
        socket.broadcast.emit(SocketEvents.USER_ONLINE, { userId });

        console.log(`[⚡ SOCKET]: User ${userId} connected and joined private room.`);

        // --- Core Messaging Events ---

        // Join Conversation
        socket.on(SocketEvents.JOIN_CONVERSATION, (conversationId: string) => {
            socket.join(`chat:${conversationId}`);
            console.log(`[⚡ SOCKET]: User ${userId} joined conversation ${conversationId}`);
        });

        // Leave Conversation
        socket.on(SocketEvents.LEAVE_CONVERSATION, (conversationId: string) => {
            socket.leave(`chat:${conversationId}`);
        });

        // Send Message
        socket.on(SocketEvents.MESSAGE_SEND, async (data: { conversationId: string; content: string; type?: MessageType; tempId?: string }) => {
            try {
                const { conversationId, content, type = MessageType.TEXT, tempId } = data;

                // A. Validate Participation (Security Check)
                const isParticipant = await prisma.conversationParticipant.findFirst({
                    where: { conversationId, userId }
                });

                if (!isParticipant) {
                    console.error(`[🚨 SOCKET SECURITY]: User ${userId} tried to message unauthored chat ${conversationId}.`);
                    return socket.emit(SocketEvents.ERROR, { message: 'Unauthorized access to this conversation.' });
                }

                // B. Persist to DB
                const message = await prisma.$transaction(async (tx) => {
                    const msg = await tx.message.create({
                        data: {
                            conversationId,
                            senderId: userId,
                            content,
                            type: type as MessageType,
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

                // D. Emit to the room (Real-time Broadcast)
                this._io?.to(`chat:${conversationId}`).emit(SocketEvents.MESSAGE_RECEIVED, {
                    ...message,
                    tempId // Echo tempId for frontend UI reconciliation
                });

            } catch (err: any) {
                console.error('[🚨 SOCKET MESSAGE ERROR]:', err.message);
                socket.emit(SocketEvents.ERROR, { message: 'Failed to transmit message signal.' });
            }
        });

        // Typing Indicators (Volatile)
        socket.on(SocketEvents.TYPING_START, (conversationId: string) => {
            socket.to(`chat:${conversationId}`).emit(SocketEvents.TYPING_START, { conversationId, userId });
        });

        socket.on(SocketEvents.TYPING_STOP, (conversationId: string) => {
            socket.to(`chat:${conversationId}`).emit(SocketEvents.TYPING_STOP, { conversationId, userId });
        });

        // --- Cleanup Lifecycle ---
        socket.on(SocketEvents.DISCONNECT, async () => {
            console.log(`[⚡ SOCKET]: User ${userId} disconnected.`);
            
            // A. Update Status in Redis
            await redis.del(`user:status:${userId}`);
            
            // B. Broadcast Offline Status
            socket.broadcast.emit(SocketEvents.USER_OFFLINE, { userId });

            // C. Auto-leave all rooms (Socket.io handles this, but we explicitly clear state if needed)
            socket.rooms.clear();
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
