import { useState, useEffect, useRef } from 'react';
import { getSocket } from '../../utils/socket';

export default function ChatPanel({ user, roomId }) {
  const [messages, setMessages] = useState([
    { _id: 'sys-0', type: 'system', text: 'Welcome to the classroom! 👋' },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleHistory = ({ messages: hist }) => {
      const formatted = hist.map(m => ({
        _id: m._id,
        sender: m.sender,
        text: m.text,
        createdAt: m.createdAt,
      }));
      setMessages([
        { _id: 'sys-0', type: 'system', text: 'Welcome to the classroom! 👋' },
        ...formatted,
      ]);
    };

    const handleNew = ({ message: m }) => {
      setMessages(prev => [...prev, m]);
    };

    socket.on('chat-history', handleHistory);
    socket.on('new-message', handleNew);
    return () => {
      socket.off('chat-history', handleHistory);
      socket.off('new-message', handleNew);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const socket = getSocket();
    socket?.emit('send-message', { roomId, text });
    setInput('');
  };

  const fmt = (ts) => ts
    ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
        {messages.map(msg => (
          <div key={msg._id}>
            {msg.type === 'system' ? (
              <div className="text-center text-textMuted text-xs py-1.5 px-3 bg-primary/10 rounded-full mx-auto w-fit">
                {msg.text}
              </div>
            ) : (
              <div className={`flex gap-2 items-end ${msg.sender?._id === user._id ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                     style={{ background: msg.sender?.role === 'teacher'
                       ? 'linear-gradient(135deg,#2979ff,#00d4ff)'
                       : 'linear-gradient(135deg,#00e676,#00897b)' }}>
                  {msg.sender?.name?.[0]?.toUpperCase() || '?'}
                </div>
                {/* Bubble */}
                <div className={`max-w-[73%] ${msg.sender?._id === user._id ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`flex items-baseline gap-1.5 mb-1 ${msg.sender?._id === user._id ? 'flex-row-reverse' : ''}`}>
                    <span className={`text-xs font-bold ${msg.sender?.role === 'teacher' ? 'text-accent' : 'text-textDim'}`}>
                      {msg.sender?.name || 'Unknown'}
                    </span>
                    <span className="text-textMuted text-[10px]">{fmt(msg.createdAt)}</span>
                  </div>
                  <div className={`px-3 py-2 text-sm leading-relaxed break-words ${
                    msg.sender?._id === user._id
                      ? 'bg-primaryDim/60 border border-primaryDim rounded-xl rounded-br-sm text-textBase'
                      : 'bg-elevated border border-border rounded-xl rounded-bl-sm text-textBase'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-2.5 border-t border-border flex gap-2 flex-shrink-0">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Type a message…"
          className="flex-1 bg-elevated border border-border rounded-lg px-3 py-2.5 text-textBase text-sm
                     outline-none transition-colors focus:border-primary placeholder:text-textMuted"
        />
        <button onClick={send}
          className="bg-primary hover:bg-primary/90 text-white rounded-lg px-3.5 text-lg transition-colors active:scale-95">
          ➤
        </button>
      </div>
    </div>
  );
}
