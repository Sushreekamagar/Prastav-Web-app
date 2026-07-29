import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { HiOutlineChatAlt2 } from 'react-icons/hi'
import { toast } from 'react-toastify'
import { DashboardPage } from '../../layouts/DashboardLayout'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { LoadingScreen } from '../../components/ui/Spinner'
import PageTransition from '../../components/ui/PageTransition'
import { useAuth } from '../../context/AuthContext'
import { getConversations, getMessages, sendMessage, createChatSocket } from '../../services/chatService'
import { formatRelativeTime } from '../../utils/formatters'

export default function ChatPage() {
  const { user, token } = useAuth()
  const [searchParams] = useSearchParams()
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(searchParams.get('conversation') || null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const socketRef = useRef(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await getConversations()
        const list = Array.isArray(data) ? data : data.conversations || []
        setConversations(list)
        if (!activeId && list.length) setActiveId(list[0]._id)
      } catch {
        setConversations([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!activeId) return
    async function loadMessages() {
      try {
        const data = await getMessages(activeId)
        setMessages(Array.isArray(data) ? data : data.messages || [])
      } catch {
        setMessages([])
      }
    }
    loadMessages()
  }, [activeId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Connect socket once on mount (token-based)
  useEffect(() => {
    if (!token) return
    const socket = createChatSocket(token)
    socketRef.current = socket
    if (socket) {
      socket.on('new_message', (msg) => {
        setMessages((prev) => {
          // Avoid duplicates from our own sends
          if (prev.some((m) => m._id === msg._id)) return prev
          return [...prev, msg]
        })
      })
      return () => {
        socket.disconnect()
        socketRef.current = null
      }
    }
  }, [token])

  // Emit join_room whenever the active conversation changes
  useEffect(() => {
    if (!activeId || !socketRef.current) return
    socketRef.current.emit('join_room', { conversationId: activeId })
  }, [activeId])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!text.trim() || !activeId) return
    const textToSend = text.trim()
    setSending(true)
    // Optimistically add the message to the local state immediately
    const optimisticMsg = {
      _id: `local_${Date.now()}`,
      senderId: user?._id,
      text: textToSend,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimisticMsg])
    setText('')
    try {
      // Emit via socket so the other party receives it in real time
      socketRef.current?.emit('send_message', { conversationId: activeId, text: textToSend })
      // Also persist via REST (fire-and-forget; the optimistic msg is already shown)
      sendMessage(activeId, textToSend).catch(() => {})
    } catch (err) {
      toast.error(err.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const activeConv = conversations.find((c) => c._id === activeId)

  if (loading) return <LoadingScreen message="Loading chats..." />

  return (
    <DashboardPage title="Chats" subtitle="Message buyers and sellers">
      <PageTransition>
        {conversations.length === 0 ? (
          <EmptyState
            icon={HiOutlineChatAlt2}
            title="No conversations yet"
            description="Chat becomes available after you send or receive a book request."
            actionLabel="Browse Books"
            actionTo="/dashboard/books"
          />
        ) : (
          <div className="flex h-[calc(100vh-12rem)] overflow-hidden rounded-2xl bg-white shadow-md">
            <div className="w-full border-r border-gray-100 sm:w-80">
              <div className="border-b border-gray-100 p-4">
                <h3 className="font-semibold text-gray-900">Conversations</h3>
              </div>
              <div className="overflow-y-auto">
                {conversations.map((conv) => (
                  <button
                    key={conv._id}
                    type="button"
                    onClick={() => setActiveId(conv._id)}
                    className={`flex w-full items-center gap-3 border-b border-gray-50 p-4 text-left transition-colors hover:bg-prastav-50/50 ${
                      activeId === conv._id ? 'bg-prastav-50' : ''
                    }`}
                  >
                    <Avatar name={conv.participant?.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900">{conv.participant?.name}</p>
                      <p className="truncate text-xs text-gray-500">{conv.book?.title}</p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="rounded-full bg-prastav-700 px-2 py-0.5 text-[10px] font-bold text-white">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden flex-1 flex-col sm:flex">
              {activeConv ? (
                <>
                  <div className="border-b border-gray-100 p-4">
                    <p className="font-semibold text-gray-900">{activeConv.participant?.name}</p>
                    <p className="text-sm text-gray-500">{activeConv.book?.title}</p>
                  </div>
                  <div className="flex-1 space-y-3 overflow-y-auto p-4">
                    {messages.map((msg) => {
                      const isMine = msg.senderId === user?._id
                      return (
                        <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                              isMine ? 'bg-prastav-700 text-white' : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p>{msg.text}</p>
                            <p className={`mt-1 text-[10px] ${isMine ? 'text-prastav-200' : 'text-gray-400'}`}>
                              {formatRelativeTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={bottomRef} />
                  </div>
                  <form onSubmit={handleSend} className="border-t border-gray-100 p-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-prastav-500 focus:outline-none focus:ring-1 focus:ring-prastav-500"
                      />
                      <Button type="submit" size="sm" disabled={sending || !text.trim()}>
                        Send
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center text-gray-500">
                  Select a conversation
                </div>
              )}
            </div>
          </div>
        )}
      </PageTransition>
    </DashboardPage>
  )
}
