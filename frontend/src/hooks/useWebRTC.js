import { useEffect, useRef, useState, useCallback } from 'react';
import SimplePeer from 'simple-peer';
import { getSocket } from '../utils/socket';

export function useWebRTC({ roomId, user }) {
  const localStreamRef = useRef(null);
  const peersRef       = useRef(new Map()); // socketId -> SimplePeer
  const [peers,    setPeers]    = useState(new Map());
  const [micOn,    setMicOn]    = useState(false);
  const [camOn,    setCamOn]    = useState(false);
  const [localSrc, setLocalSrc] = useState(null);

  // ── Replace tracks on all existing peer connections (for screen-share switch) ──
  const replaceTracksOnPeers = useCallback((newStream) => {
    peersRef.current.forEach((peer) => {
      try {
        const pc = peer._pc;
        if (!pc) return;
        const senders = pc.getSenders();

        newStream.getTracks().forEach((track) => {
          const sender = senders.find(s => s.track?.kind === track.kind);
          if (sender) {
            sender.replaceTrack(track).catch(console.warn);
          } else {
            // No sender yet for this kind → add track (triggers renegotiation)
            pc.addTrack(track, newStream);
          }
        });
      } catch (e) {
        console.warn('replaceTrack error:', e.message);
      }
    });
  }, []);

  // ── Notify room about stream state ──
  const notifyStreamState = useCallback((stream) => {
    const socket = getSocket();
    socket?.emit('webrtc-stream-toggle', {
      roomId,
      hasVideo: !!(stream?.getVideoTracks().find(t => t.enabled)),
      hasAudio: !!(stream?.getAudioTracks().find(t => t.enabled)),
    });
  }, [roomId]);

  // ── Create a SimplePeer for a given remote socket ──
  const createPeer = useCallback((targetSocketId, targetInfo, stream, initiator) => {
    const socket = getSocket();

    const peer = new SimplePeer({
      initiator,
      trickle: true,
      stream: stream || undefined,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
        ],
      },
    });

    peer.on('signal', (data) => {
      if (data.type === 'offer') {
        socket?.emit('webrtc-offer', {
          targetSocketId,
          offer: data,
          senderInfo: { userId: user._id, name: user.name, role: user.role },
        });
      } else if (data.type === 'answer') {
        socket?.emit('webrtc-answer', { targetSocketId, answer: data });
      } else {
        socket?.emit('webrtc-ice-candidate', { targetSocketId, candidate: data });
      }
    });

    peer.on('stream', (remoteStream) => {
      setPeers(prev => {
        const next = new Map(prev);
        const existing = next.get(targetSocketId) || {};
        next.set(targetSocketId, {
          ...existing,
          stream: remoteStream,
          hasVideo: remoteStream.getVideoTracks().length > 0,
          hasAudio: remoteStream.getAudioTracks().length > 0,
        });
        return next;
      });
    });

    peer.on('track', (track, stream) => {
      setPeers(prev => {
        const next = new Map(prev);
        const existing = next.get(targetSocketId) || {};
        next.set(targetSocketId, {
          ...existing,
          stream,
          hasVideo: stream.getVideoTracks().length > 0,
          hasAudio: stream.getAudioTracks().length > 0,
        });
        return next;
      });
    });

    peer.on('error', (err) => console.warn('Peer error:', targetSocketId, err.message));
    peer.on('close', () => {
      peersRef.current.delete(targetSocketId);
      setPeers(prev => { const n = new Map(prev); n.delete(targetSocketId); return n; });
    });

    peersRef.current.set(targetSocketId, peer);
    setPeers(prev => {
      const next = new Map(prev);
      next.set(targetSocketId, {
        stream:   null,
        name:     targetInfo?.name   || 'Unknown',
        userId:   targetInfo?.userId || '',
        role:     targetInfo?.role   || 'student',
        hasVideo: false,
        hasAudio: false,
        ...(next.get(targetSocketId) || {}),
      });
      return next;
    });

    return peer;
  }, [user]);

  // ── Socket listeners ──
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNewPeer = ({ peerId, peerName, peerRole, socketId: peerSocketId }) => {
      if (peerSocketId === socket.id) return;
      createPeer(peerSocketId, { userId: peerId, name: peerName, role: peerRole }, localStreamRef.current, true);
    };

    const onOffer = ({ offer, senderSocketId, senderInfo }) => {
      let peer = peersRef.current.get(senderSocketId);
      if (!peer) peer = createPeer(senderSocketId, senderInfo, localStreamRef.current, false);
      peer.signal(offer);
    };

    const onAnswer = ({ answer, senderSocketId }) => {
      peersRef.current.get(senderSocketId)?.signal(answer);
    };

    const onCandidate = ({ candidate, senderSocketId }) => {
      peersRef.current.get(senderSocketId)?.signal(candidate);
    };

    const onPeerLeft = ({ socketId: leftSocketId }) => {
      peersRef.current.get(leftSocketId)?.destroy();
      peersRef.current.delete(leftSocketId);
      setPeers(prev => { const n = new Map(prev); n.delete(leftSocketId); return n; });
    };

    const onStreamToggle = ({ socketId: sid, hasVideo, hasAudio, name, userId }) => {
      setPeers(prev => {
        const n = new Map(prev);
        if (n.has(sid)) n.set(sid, { ...n.get(sid), hasVideo, hasAudio });
        return n;
      });
    };

    socket.on('webrtc-new-peer',      onNewPeer);
    socket.on('webrtc-offer',         onOffer);
    socket.on('webrtc-answer',        onAnswer);
    socket.on('webrtc-ice-candidate', onCandidate);
    socket.on('webrtc-peer-left',     onPeerLeft);
    socket.on('webrtc-stream-toggle', onStreamToggle);

    return () => {
      socket.off('webrtc-new-peer',      onNewPeer);
      socket.off('webrtc-offer',         onOffer);
      socket.off('webrtc-answer',        onAnswer);
      socket.off('webrtc-ice-candidate', onCandidate);
      socket.off('webrtc-peer-left',     onPeerLeft);
      socket.off('webrtc-stream-toggle', onStreamToggle);
    };
  }, [createPeer]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      peersRef.current.forEach(p => p.destroy());
      peersRef.current.clear();
    };
  }, []);

  // ── Start camera + microphone ──
  const startStream = useCallback(async (video = true, audio = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio });

      if (localStreamRef.current) {
        // Replace tracks on existing connections
        replaceTracksOnPeers(stream);
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }

      localStreamRef.current = stream;
      setLocalSrc(stream);
      setCamOn(video ? stream.getVideoTracks().some(t => t.enabled) : false);
      setMicOn(audio ? stream.getAudioTracks().some(t => t.enabled) : false);
      notifyStreamState(stream);
      return stream;
    } catch (err) {
      console.error('getUserMedia error:', err);
      throw err;
    }
  }, [replaceTracksOnPeers, notifyStreamState]);

  // ── Share screen — replaces existing tracks on all peers ──
  const shareScreen = useCallback(async () => {
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });

      if (localStreamRef.current) {
        // Key fix: replace tracks instead of addStream
        replaceTracksOnPeers(screen);
        localStreamRef.current.getTracks().forEach(t => t.stop());
      } else {
        // No existing connection — add stream to future peers (handled in createPeer)
      }

      localStreamRef.current = screen;
      setLocalSrc(screen);
      setCamOn(true);
      setMicOn(false);

      screen.getVideoTracks()[0].onended = () => stopStream();
      notifyStreamState(screen);
      return screen;
    } catch (err) {
      console.error('Screen share error:', err);
      throw err;
    }
  }, [replaceTracksOnPeers, notifyStreamState]);

  // ── Stop all local tracks ──
  const stopStream = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    setLocalSrc(null);
    setCamOn(false);
    setMicOn(false);
    notifyStreamState(null);
  }, [notifyStreamState]);

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const tracks = stream.getAudioTracks();
    tracks.forEach(t => { t.enabled = !t.enabled; });
    setMicOn(tracks[0]?.enabled ?? false);
    notifyStreamState(stream);
  }, [notifyStreamState]);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const tracks = stream.getVideoTracks();
    tracks.forEach(t => { t.enabled = !t.enabled; });
    setCamOn(tracks[0]?.enabled ?? false);
    notifyStreamState(stream);
  }, [notifyStreamState]);

  return {
    localStream: localSrc,
    peers,
    startStream,
    stopStream,
    shareScreen,
    toggleMic,
    toggleCamera,
    micOn,
    camOn,
  };
}
