import { useRef, useEffect, useState } from 'react';

function VideoTile({ stream, name, role, muted = false, isLocal = false, isScreen = false }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (stream) {
      v.srcObject = stream;
      v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      v.srcObject = null;
      setPlaying(false);
    }
  }, [stream]);

  const hasVideo = stream && stream.getVideoTracks().some(t => t.enabled);

  return (
    <div className={`relative rounded-xl overflow-hidden border flex items-center justify-center bg-[#040d1a] transition-all duration-300 ${
      isScreen ? 'border-accent/60 ring-1 ring-accent/30' : 'border-border hover:border-borderLight'
    }`} style={{ aspectRatio: '16/9' }}>

      <video
        ref={videoRef}
        autoPlay
        muted={muted}
        playsInline
        className={`w-full h-full object-cover transition-opacity duration-300 ${hasVideo && playing ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Avatar shown when no video */}
      {(!hasVideo || !playing) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-lg"
            style={{
              background: role === 'teacher' || role === 'admin'
                ? 'linear-gradient(135deg,#2979ff,#00d4ff)'
                : 'linear-gradient(135deg,#00e676,#009688)',
            }}>
            {name?.[0]?.toUpperCase() || '?'}
          </div>
          <span className="text-textDim text-xs">{name}</span>
          <span className="text-textMuted text-[10px]">Camera off</span>
        </div>
      )}

      {/* Bottom name bar */}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/80 to-transparent flex items-center gap-2">
        {isScreen && <span className="text-accent text-[10px] font-bold bg-accent/20 border border-accent/40 px-1.5 py-0.5 rounded">🖥 SCREEN</span>}
        <span className="text-white text-xs font-medium truncate">{name}{isLocal ? ' (You)' : ''}</span>
        <div className={`ml-auto w-2 h-2 rounded-full ${stream ? 'bg-success' : 'bg-textMuted'}`} />
      </div>

      {/* Local badge */}
      {isLocal && (
        <div className="absolute top-2 right-2 bg-primary/80 backdrop-blur rounded-md px-2 py-0.5">
          <span className="text-white text-[10px] font-bold">YOU</span>
        </div>
      )}

      {/* Teacher badge */}
      {(role === 'teacher' || role === 'admin') && !isLocal && (
        <div className="absolute top-2 left-2 bg-accent/20 border border-accent/40 backdrop-blur rounded-md px-2 py-0.5">
          <span className="text-accent text-[10px] font-bold">👨‍🏫 TEACHER</span>
        </div>
      )}
    </div>
  );
}

export default function VideoCallPanel({
  localStream, peers, user,
  micOn, camOn,
  onStartCamera, onShareScreen, onStop,
  onToggleMic, onToggleCamera,
  isTeacher,
}) {
  const peerList  = Array.from(peers.entries());
  const hasLocal  = !!localStream;
  const totalTiles = (hasLocal ? 1 : 0) + peerList.length;

  // Detect if local stream is screen share
  const isScreenShare = hasLocal && localStream.getVideoTracks().some(
    t => t.label.toLowerCase().includes('screen') || t.label.toLowerCase().includes('display')
  );

  const gridClass =
    totalTiles === 0 ? '' :
    totalTiles === 1 ? 'grid-cols-1 max-w-2xl mx-auto' :
    totalTiles === 2 ? 'grid-cols-2' :
    totalTiles <= 4  ? 'grid-cols-2' :
    totalTiles <= 6  ? 'grid-cols-3' :
    'grid-cols-3';

  return (
    <div className="h-full flex flex-col bg-[#030c18]">

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-elevated/80 shrink-0 flex-wrap">
        {!hasLocal ? (
          <>
            <button onClick={onStartCamera}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary rounded-lg text-white text-xs font-bold hover:bg-primary/85 transition-all active:scale-95">
              📹 Start Camera
            </button>
            <button onClick={onShareScreen}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-elevated border border-border rounded-lg text-textDim text-xs font-semibold hover:border-accent hover:text-accent transition-all">
              🖥 Share Screen
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-danger/10 border border-danger/40 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-danger animate-pulse-dot" />
              <span className="text-danger text-xs font-bold">
                LIVE · {isScreenShare ? 'Screen Share' : 'Camera'}
              </span>
            </div>

            <button onClick={onToggleMic}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all active:scale-95 ${
                micOn ? 'bg-primary/15 border-primary/50 text-primary' : 'border-border text-textDim hover:border-borderLight'
              }`}>
              {micOn ? '🎤 Mic On' : '🔇 Muted'}
            </button>

            <button onClick={onToggleCamera}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all active:scale-95 ${
                camOn ? 'bg-primary/15 border-primary/50 text-primary' : 'border-border text-textDim hover:border-borderLight'
              }`}>
              {camOn ? '📹 Cam On' : '📷 Off'}
            </button>

            {isTeacher && (
              <button onClick={onShareScreen}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-elevated border border-border rounded-lg text-textDim text-xs font-semibold hover:border-accent hover:text-accent transition-all">
                {isScreenShare ? '📹 Switch to Camera' : '🖥 Share Screen'}
              </button>
            )}

            <button onClick={onStop}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-danger/10 border border-danger/40 rounded-lg text-danger text-xs font-semibold hover:bg-danger/20 transition-all">
              ⏹ Stop
            </button>
          </>
        )}

        <div className="flex-1" />
        <span className="text-textMuted text-xs px-2">
          {totalTiles} on video
        </span>
      </div>

      {/* ── Video grid ── */}
      <div className="flex-1 overflow-y-auto p-3">
        {totalTiles === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-elevated border border-border flex items-center justify-center text-4xl">📹</div>
            <div>
              <p className="text-textBase font-semibold mb-1">No live video yet</p>
              <p className="text-textDim text-sm max-w-xs leading-relaxed">
                {isTeacher
                  ? 'Click "Start Camera" or "Share Screen" to begin broadcasting to your students.'
                  : 'Waiting for the teacher or participants to turn on their camera…'}
              </p>
            </div>
            {isTeacher && (
              <div className="flex gap-2 mt-2">
                <button onClick={onStartCamera}
                  className="px-5 py-2.5 bg-primary rounded-xl text-white text-sm font-bold hover:bg-primary/85 transition-all shadow-glow">
                  📹 Start Camera
                </button>
                <button onClick={onShareScreen}
                  className="px-5 py-2.5 border border-border rounded-xl text-textDim text-sm hover:border-accent hover:text-accent transition-all">
                  🖥 Share Screen
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className={`grid ${gridClass} gap-3`}>
            {hasLocal && (
              <VideoTile
                stream={localStream}
                name={user.name}
                role={user.role}
                muted={true}
                isLocal={true}
                isScreen={isScreenShare}
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
