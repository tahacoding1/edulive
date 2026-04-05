import { getSocket } from '../../utils/socket';

export default function ParticipantsPanel({ user, participants, raisedHands, roomId }) {
  const socket = getSocket();

  const removeParticipant = (userId) => {
    socket?.emit('remove-participant', { roomId, userId });
  };

  const allowSpeak = (userId) => {
    socket?.emit('allow-speak', { roomId, userId });
  };

  return (
    <div className="p-3 overflow-y-auto h-full">
      <p className="text-textMuted text-[10px] font-bold uppercase tracking-widest mb-3 px-1">
        {participants.length} Participant{participants.length !== 1 ? 's' : ''}
      </p>

      <div className="flex flex-col gap-2">
        {participants.map(p => {
          const hasHand = raisedHands.includes(p.userId);
          const isMe    = p.userId === user._id;

          return (
            <div key={p.userId}
              className="flex items-center gap-2.5 p-3 bg-elevated border border-border rounded-lg animate-fade-in">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                   style={{ background: p.role === 'teacher'
                     ? 'linear-gradient(135deg,#2979ff,#00d4ff)'
                     : 'linear-gradient(135deg,#00e676,#00897b)' }}>
                {p.name?.[0]?.toUpperCase()}
              </div>

              {/* Name / role */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-textBase text-sm font-semibold truncate">{p.name}</span>
                  {isMe && <span className="text-textMuted text-[10px]">(You)</span>}
                </div>
                <p className={`text-xs capitalize ${p.role === 'teacher' ? 'text-accent' : 'text-textDim'}`}>
                  {p.role}
                </p>
              </div>

              {/* Raised hand indicator */}
              {hasHand && <span title="Hand raised" className="text-base">✋</span>}

              {/* Teacher controls */}
              {user.role === 'teacher' && p.role !== 'teacher' && (
                <div className="flex gap-1.5">
                  {hasHand && (
                    <button onClick={() => allowSpeak(p.userId)} title="Allow to speak"
                      className="px-2 py-1 bg-success/10 border border-success/40 rounded text-success text-xs font-semibold
                                 hover:bg-success/20 transition-colors">
                      🎤
                    </button>
                  )}
                  <button onClick={() => removeParticipant(p.userId)} title="Remove student"
                    className="px-2 py-1 bg-danger/10 border border-danger/40 rounded text-danger text-xs font-semibold
                               hover:bg-danger/20 transition-colors">
                    ✕
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
