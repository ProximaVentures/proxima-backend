export const SocketEvents = {
    // Connection related
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',
    ERROR: 'error',

    // Chat related
    JOIN_CONVERSATION: 'chat:join',
    LEAVE_CONVERSATION: 'chat:leave',
    
    // Messaging
    MESSAGE_SEND: 'message:send',
    MESSAGE_RECEIVED: 'message:received',
    MESSAGE_READ: 'message:read',
    
    // Status/Presence
    USER_ONLINE: 'user:online',
    USER_OFFLINE: 'user:offline',
    TYPING_START: 'typing:start',
    TYPING_STOP: 'typing:stop',
    
    // System/Notifications
    NOTIFICATION_NEW: 'notification:new',
} as const;

export type SocketEventType = typeof SocketEvents[keyof typeof SocketEvents];
