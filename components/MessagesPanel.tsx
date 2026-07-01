'use client'

import { useEffect, useState } from 'react'

interface Message {
  id: string
  type: string
  title: string
  body: string | null
  action_url: string | null
  action_label: string | null
  is_read: boolean
  created_at: string
}

const TYPE_ICON: Record<string, string> = {
  application_sent: '✓',
  manual_apply: '→',
  strong_match: '◆',
  system: '·',
}

const TYPE_COLOR: Record<string, string> = {
  application_sent: '#4ade80',
  manual_apply: '#7a9ac0',
  strong_match: '#c9a84c',
  system: '#6b7a99',
}

export default function MessagesPanel() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  const unread = messages.filter(m => !m.is_read).length

  useEffect(() => {
    fetch('/api/messages')
      .then(r => r.json())
      .then(d => { setMessages(d.messages || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function markRead(id: string) {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m))
    await fetch('/api/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: id }),
    })
  }

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-5 rounded-full" style={{ background: 'linear-gradient(#4ade80, #1a6a3a)' }} />
          <h2 className="text-sm font-semibold tracking-widest uppercase" style={{ color: '#4a8a6a', letterSpacing: '0.15em' }}>
            Inbox
          </h2>
          {unread > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: '#c9a84c', color: '#000' }}>
              {unread}
            </span>
          )}
        </div>
        {messages.length > 0 && (
          <button onClick={() => setOpen(!open)} className="text-xs transition-all" style={{ color: '#3a4a6a' }}
            onMouseEnter={e => (e.target as HTMLElement).style.color = '#4a8a6a'}
            onMouseLeave={e => (e.target as HTMLElement).style.color = '#3a4a6a'}>
            {open ? 'Hide ↑' : `Show ${messages.length} ↓`}
          </button>
        )}
      </div>

      {loading ? (
        <div className="rounded-xl p-4" style={{ background: '#111827', border: '1px solid #1e2d4a' }}>
          <p className="text-xs" style={{ color: '#3a4a6a' }}>Loading inbox...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="rounded-xl p-4" style={{ background: '#111827', border: '1px solid #1e2d4a' }}>
          <p className="text-xs" style={{ color: '#3a4a6a' }}>No messages yet. Applications and match alerts will appear here.</p>
        </div>
      ) : (
        <>
          {/* Unread preview always visible */}
          {!open && unread > 0 && (
            <div className="space-y-2">
              {messages.filter(m => !m.is_read).slice(0, 3).map(m => (
                <MessageRow key={m.id} message={m} onRead={markRead} />
              ))}
              {messages.length > 3 && (
                <button onClick={() => setOpen(true)} className="text-xs w-full py-2 rounded-lg text-center transition-all"
                  style={{ color: '#3a4a6a', border: '1px solid #1e2d4a' }}>
                  Show all messages
                </button>
              )}
            </div>
          )}

          {/* All messages when open */}
          {open && (
            <div className="space-y-2">
              {messages.map(m => (
                <MessageRow key={m.id} message={m} onRead={markRead} />
              ))}
            </div>
          )}

          {/* If no unread and not open, show compact summary */}
          {!open && unread === 0 && (
            <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: '#111827', border: '1px solid #1e2d4a' }}>
              <p className="text-xs" style={{ color: '#3a4a6a' }}>{messages.length} message{messages.length !== 1 ? 's' : ''} · all read</p>
              <button onClick={() => setOpen(true)} className="text-xs" style={{ color: '#3a4a6a' }}>View all</button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

function MessageRow({ message: m, onRead }: { message: Message; onRead: (id: string) => void }) {
  const color = TYPE_COLOR[m.type] || '#6b7a99'
  const icon = TYPE_ICON[m.type] || '·'

  return (
    <div
      onClick={() => !m.is_read && onRead(m.id)}
      className="rounded-xl p-4 flex items-start gap-3 transition-all cursor-pointer"
      style={{
        background: m.is_read ? '#111827' : '#0d1a2a',
        border: `1px solid ${m.is_read ? '#1e2d4a' : '#2a3d5a'}`,
      }}
    >
      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5"
        style={{ background: color + '22', color, border: `1px solid ${color}44` }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold mb-0.5" style={{ color: m.is_read ? '#6b7a99' : '#e8dcc8' }}>{m.title}</p>
        {m.body && <p className="text-xs leading-relaxed" style={{ color: '#3a4a6a' }}>{m.body}</p>}
        {m.action_url && (
          <a href={m.action_url} target="_blank" rel="noopener noreferrer"
            className="text-xs mt-1.5 inline-block"
            style={{ color: '#7a9ac0' }}>
            {m.action_label || 'Open →'}
          </a>
        )}
      </div>
      {!m.is_read && <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: '#c9a84c' }} />}
    </div>
  )
}
