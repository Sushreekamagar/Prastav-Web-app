import { io } from 'socket.io-client'
import api from './api'
import { MOCK_REQUESTS } from '../utils/mockData'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const MOCK_CONVERSATIONS = MOCK_REQUESTS.map((req) => ({
  _id: `conv_${req._id}`,
  requestId: req._id,
  book: req.book,
  participant: req.seller,
  lastMessage: req.message,
  unreadCount: req.status === 'pending' ? 1 : 0,
  updatedAt: req.createdAt,
}))

const MOCK_MESSAGES = {
  req_1: [
    { _id: 'msg_1', senderId: 'user_1', text: 'Hi, is this book still available?', createdAt: '2026-01-12T10:00:00Z' },
    { _id: 'msg_2', senderId: 'user_2', text: 'Yes, it is available!', createdAt: '2026-01-12T10:05:00Z' },
  ],
}

export async function getConversations() {
  if (USE_MOCK) {
    await delay(400)
    return MOCK_CONVERSATIONS
  }
  const { data } = await api.get('/chats')
  return data
}

export async function getMessages(conversationId) {
  if (USE_MOCK) {
    await delay(300)
    const requestId = conversationId.replace('conv_', '')
    return MOCK_MESSAGES[requestId] || []
  }
  const { data } = await api.get(`/chats/${conversationId}/messages`)
  return data
}

export function createChatSocket(token) {
  if (USE_MOCK) return null
  const url = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'
  return io(url, {
    auth: { token },
    transports: ['websocket', 'polling'],
  })
}

export async function sendMessage(conversationId, text) {
  if (USE_MOCK) {
    await delay(200)
    return {
      _id: `msg_${Date.now()}`,
      senderId: 'user_1',
      text,
      createdAt: new Date().toISOString(),
    }
  }
  const { data } = await api.post(`/chats/${conversationId}/messages`, { text })
  return data
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
