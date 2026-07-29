import { io } from 'socket.io-client'
import api from './api'

function formatMessage(msg) {
  if (!msg) return null
  return {
    _id: msg._id,
    senderId: typeof msg.sender === 'object' ? (msg.sender._id || msg.sender.id) : msg.sender,
    text: msg.content,
    createdAt: msg.createdAt,
  }
}

export async function getConversations() {
  const { data } = await api.get('/chat/conversations')
  return Array.isArray(data) ? data : (data.conversations || [])
}

export async function getMessages(conversationId) {
  const { data } = await api.get(`/chat/conversations/${conversationId}/messages`)
  return (data.messages || []).map(formatMessage)
}

export function createChatSocket(token) {
  const url = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'
  return io(url, {
    auth: { token },
    transports: ['websocket', 'polling'],
  })
}

export async function sendMessage(conversationId, text) {
  const { data } = await api.post(`/chat/conversations/${conversationId}/messages`, { text })
  return formatMessage(data.message)
}
