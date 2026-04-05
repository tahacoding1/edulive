import { useRef, useState, useEffect } from 'react';

export default function VideoPanel({ isTeacher }) {
  const videoRef  = useRef(null);
  const streamRef = useRef(null);

  const [active, setActive] = useState(false);
  const [mode,   setMode]   = useState('camera');
  const [error,  setError]  = useState('');

  const start = async (type) => {
    setError('');
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      const stream = type === 'screen'
        ? await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        : await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      stream.getVideoTracks()[0].onended = stop;
      setMode(type); setActive(true);
    } catch {
      setError(type === 'screen' ? 'Screen sharing cancelled or denied.' : 'Camera / microphone access denied.');
    }
  };

  const stop = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
  };

  useEffect(() => () => streamRef.current?.getTracks().forEach(t => t.stop()), []);

  return (
    <div className="h-full flex flex-col bg-[#040a16]">
      {/* Teacher controls */}
      {isTeacher && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-border bg-elevated flex-shrink-0">
          {!active ? (
            <>
              <button onClick={() => start('camera')}
                className="px-3.5 py-1.5 bg-primary rounded-lg text-white text-xs font-bold hover:bg-primary/90 transition-colors">
                📹 Start Camera
              </button>
              <button onClick={() => start('screen')}
                className="px-3.5 py-1.5 bg-elevated border border-border rounded-lg text-textDim text-xs hover:border-borderLight transition-colors">
                🖥 Share Screen
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-danger/10 border border-danger/40 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-danger animate-pulse-dot" />
                <span className="text-danger text-xs font-bold">LIVE · {mode === 'screen' ? 'Screen' : 'Camera'}</span>
              </div>
              {mode === 'camera' && (
                <button onClick={() => start('screen')}
                  className="px-3 py-1.5 border border-border rounded-lg text-textDim text-xs hover:border-borderLight transition-colors">
                  🖥 Switch to Screen
                </button>
              )}
              {mode === 'screen' && (
                <button onClick={() => start('camera')}
                  className="px-3 py-1.5 border border-border rounded-lg text-textDim text-xs hover:border-borderLight transition-colors">
                  📹 Switch to Camera
                </button>
              )}
              <button onClick={stop}
                className="px-3 py-1.5 bg-danger/10 border border-danger/40 rounded-lg text-danger text-xs hover:bg-danger/20 transition-colors">
                ⏹ Stop
              </button>
            </>
          )}
        </div>
      )}

      {/* Video area */}
      <div className="flex-1 relative flex items-center justify-center">
        <video ref={videoRef} autoPlay muted playsInline
          className="w-full h-full object-contain"
          style={{ display: active ? 'block' : 'none' }} />

        {!active && (
          <div className="text-center animate-fade-in">
            <div className="text-7xl mb-5">📹</div>
            <p className="text-textDim text-sm max-w-xs mx-auto leading-relaxed">
              {isTeacher
                ? 'Start your camera or screen share to broadcast to students.'
                : 'Waiting for teacher to go live…'}
            </p>
            {error && <p className="text-danger mt-4 text-xs">{error}</p>}
          </div>
        )}

        {active && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-danger/85 rounded-md px-2.5 py-1">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse-dot" />
            <span className="text-white text-xs font-bold">LIVE</span>
          </div>
        )}
      </div>
    </div>
  );
}
