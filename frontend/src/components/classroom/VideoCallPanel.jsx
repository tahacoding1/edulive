import { useRef, useEffect } from 'react';

function VideoTile({ stream, name, role, muted = false, isLocal = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative bg-[#040a16] rounded-xl overflow-hidden border border-border flex items-center justify-center"
         style={{ aspectRatio: '16/9' }}>
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          muted={muted}
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black text-white"
               style={{ background: role === 'teacher'
                 ? 'linear-gradient(135deg,#2979ff,#00d4ff)'
                 : 'linear-gradient(135deg,#00e676,#00897b)' }}>
            {name?.[0]?.toUpperCase()}
          </div>
          <span className="text-textDim text-xs">{name}</span>
        </div>
      )}

      {/* Name badge */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 rounded-md px-2 py-1">
        <span className="text-white text-xs font-medium">{name}{isLocal ? ' (You)' : ''}</span>
      </div>

      {isLocal && (
        <div className="absolute top-2 right-2 bg-primary/80 rounded px-1.5 py-0.5 text-white text-[10px] font-bold">
          YOU
        </div>
      )}
    </div>
  );
}

export default function VideoCallPanel({
  localStream, peers, user,
  micOn, camOn, onStartCamera, onShareScreen, onStop, onToggleMic, onToggleCamera,
  isTeacher,
}) {
  const peerList = Array.from(peers.entries());
  const hasLocal = !!localStream;
  const totalTiles = hasLocal ? peerList.length + 1 : peerList.length;

  const gridCols = totalTiles <= 1 ? 'grid-cols-1'
                 : totalTiles <= 2 ? 'grid-cols-2'
                 : totalTiles <= 4 ? 'grid-cols-2'
                 : 'grid-cols-3';

  return (
    <div className="h-full flex flex-col bg-[#040a16]">
      {/* Controls */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-elevated flex-shrink-0 flex-wrap">
        {!hasLocal ? (
          <>
            <button onClick={onStartCamera}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary rounded-lg text-white text-xs font-bold hover:bg-primary/90 transition-colors">
              📹 Start Camera
            </button>
            <button onClick={onShareScreen}
              className="flex items-center gap-1.5 px-3.5 py-1.5 border border-border rounded-lg text-textDim text-xs hover:border-borderLight transition-colors">
              🖥 Share Screen
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-danger/10 border border-danger/40 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-danger animate-pulse-dot" />
              <span className="text-danger text-xs font-bold">LIVE</span>
            </div>
            <button onClick={onToggleMic}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                micOn
                  ? 'bg-primary/15 border-primary/50 text-primary hover:bg-primary/25'
                  : 'border-border text-textDim hover:border-borderLight'
              }`}>
              {micOn ? '🎤 Mic On' : '🔇 Muted'}
            </button>
            <button onClick={onToggleCamera}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                camOn
                  ? 'bg-primary/15 border-primary/50 text-primary hover:bg-primary/25'
                  : 'border-border text-textDim hover:border-borderLight'
              }`}>
              {camOn ? '📹 Cam On' : '📷 Cam Off'}
            </button>
            {isTeacher && (
              <button onClick={onShareScreen}
                className="px-3 py-1.5 border border-border rounded-lg text-textDim text-xs hover:border-borderLight transition-colors">
                🖥 Share Screen
              </button>
            )}
            <button onClick={onStop}
              className="px-3 py-1.5 bg-danger/10 border border-danger/40 rounded-lg text-danger text-xs hover:bg-danger/20 transition-colors">
              ⏹ Stop
            </button>
          </>
        )}
        <div className="flex-1" />
        <span className="text-textMuted text-xs">{totalTiles} participant{totalTiles !== 1 ? 's' : ''} on video</span>
      </div>

      {/* Video grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {totalTiles === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-center animate-fade-in">
            <div className="text-6xl">📹</div>
            <p className="text-textDim text-sm max-w-xs leading-relaxed">
              {isTeacher
                ? 'Start your camera or screen share to begin broadcasting.'
                : 'Waiting for participants to turn on their cameras…'}
            </p>
          </div>
        ) : (
          <div className={`grid ${gridCols} gap-3`}>
            {hasLocal && (
              <VideoTile
                stream={localStream}
                name={user.name}
                role={user.role}
                muted={true}
                isLocal={true}
              />
            )}
            {peerList.map(([socketId, peerData]) => (
              <VideoTile
                key={socketId}
                stream={peerData.stream}
                name={peerData.name}
                role={peerData.role}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
