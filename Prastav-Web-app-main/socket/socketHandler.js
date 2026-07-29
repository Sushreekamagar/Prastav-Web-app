const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const Transaction = require('../models/Transaction');
const Conversation = require('../models/Conversation');
 
/**
 * Socket.io Real-Time Chat Handler
 *
 * Each chat room = transaction ID
 * Only the requester and lister of that transaction can communicate
 *
 * Connect from frontend:
 *   import { io } from 'socket.io-client';
 *   const socket = io('http://localhost:5000', { auth: { token: 'JWT_HERE' } });
 */
const socketHandler = (io) => {
 
  // Authenticate every socket connection using JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required.'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Invalid or expired token.'));
    }
  });
 
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.userId}`);
 
    // ── Join a chat room ──────────────────────────────────────────────
    socket.on('joinRoom', async ({ transactionId }) => {
      try {
        const transaction = await Transaction.findById(transactionId);
        if (!transaction) return socket.emit('chatError', { message: 'Transaction not found.' });

        // Ensure user is part of transaction
        if (
          transaction.requester.toString() !== socket.userId &&
          transaction.lister.toString() !== socket.userId
        ) {
          return socket.emit('chatError', { message: 'Not authorized for this chat.' });
        }

        // Only allow if status is beyond pending/rejected
        const allowedStatuses = ['accepted', 'payment_pending', 'payment_uploaded', 'payment_completed', 'completed'];
        if (!allowedStatuses.includes(transaction.status)) {
          return socket.emit('chatError', { message: 'Chat is only available after request is accepted.' });
        }

        socket.join(transactionId);
        console.log(`User ${socket.userId} joined room ${transactionId}`);
      } catch (err) {
        socket.emit('chatError', { message: 'Failed to join room.' });
      }
    });
 
    // ── Leave a chat room ─────────────────────────────────────────────
    socket.on('leaveRoom', ({ transactionId }) => {
      socket.leave(transactionId);
    });
 
    // ── Send a message ────────────────────────────────────────────────
    socket.on('sendMessage', async ({ transactionId, content }) => {
      try {
        if (!content || content.trim() === '') return;

        const transaction = await Transaction.findById(transactionId);
        if (!transaction) return socket.emit('chatError', { message: 'Transaction not found.' });

        if (
          transaction.requester.toString() !== socket.userId &&
          transaction.lister.toString() !== socket.userId
        ) {
          return socket.emit('chatError', { message: 'Not authorized to send messages.' });
        }

        const allowedStatuses = ['accepted', 'payment_pending', 'payment_uploaded', 'payment_completed', 'completed'];
        if (!allowedStatuses.includes(transaction.status)) {
          return socket.emit('chatError', { message: 'Cannot send messages until request is accepted.' });
        }

        const message = await Message.create({
          transaction: transactionId,
          sender: socket.userId,
          content: content.trim(),
        });

        // Upsert Conversation
        await Conversation.findOneAndUpdate(
          { transaction: transactionId },
          {
            buyer: transaction.requester,
            seller: transaction.lister,
            lastMessage: content.trim(),
            lastMessageAt: new Date()
          },
          { upsert: true, new: true }
        );
 
        await message.populate('sender', 'name profileImage');
 
        // Broadcast to all in the room (both parties)
        io.to(transactionId).emit('receiveMessage', {
          _id: message._id,
          content: message.content,
          sender: message.sender,
          createdAt: message.createdAt,
          isRead: false,
        });
      } catch (err) {
        socket.emit('chatError', { message: 'Failed to send message.' });
      }
    });
 
    // ── Typing indicators ─────────────────────────────────────────────
    socket.on('typing', ({ transactionId }) => {
      socket.to(transactionId).emit('userTyping', { userId: socket.userId });
    });
 
    socket.on('stopTyping', ({ transactionId }) => {
      socket.to(transactionId).emit('userStoppedTyping', { userId: socket.userId });
    });
 
    // ── Mark messages as read ─────────────────────────────────────────
    socket.on('markRead', async ({ transactionId }) => {
      try {
        await Message.updateMany(
          {
            transaction: transactionId,
            sender: { $ne: socket.userId },
            isRead: false,
          },
          { isRead: true }
        );
        socket.to(transactionId).emit('messagesRead', { byUserId: socket.userId });
      } catch (err) {
        // silently fail — non-critical
      }
    });
 
    // ── Frontend style join ──────────────────────────────────────────
    socket.on('join_room', async ({ conversationId }) => {
      socket.join(conversationId);
      console.log(`🔌 User ${socket.userId} joined conversation room ${conversationId}`);
    });

    // ── Frontend style message send ───────────────────────────────────
    socket.on('send_message', async ({ conversationId, text }) => {
      try {
        if (!text || text.trim() === '') return;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;

        // Broadcast the new message to everyone else in the conversation room
        socket.to(conversationId).emit('new_message', {
          _id: `msg_socket_${Date.now()}`,
          senderId: socket.userId,
          text: text.trim(),
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('❌ Socket message broadcast failed:', err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.userId}`);
    });
  });
};

 
module.exports = socketHandler;