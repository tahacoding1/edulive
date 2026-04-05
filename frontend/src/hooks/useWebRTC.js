import { useEffect, useRef, useState, useCallback } from 'react';
import SimplePeer from 'simple-peer';
import { getSocket } from '../utils/socket';

/**
 * useWebRTC — manages all peer connections in a classroom.
 *
 * Returns:
 *  localStream   — current user's MediaStream (or null)
 *  peers         — Map<socketId, { stream, name, userId, hasVideo, hasAudio }>
 *  startStream   — fn(video, audio) to start local stream
 *  stopStream    — fn() to stop local stream
 *  toggleMic     — fn()
 *  toggleCamera  — fn()
 *  micOn / camOn — booleans
 *  shareScreen   — fn()
 */
export function useWebRTC({ roomId, user }) {
  const localStream  = useRef(null);
  const peersRef     = useRef(new Map()); // socketId -> SimplePeer instance
  const [peers,    setPeers]    = useState(new Map()); // socketId -> display data
  const [micOn,    setMicOn]    = useState(false);
  const [camOn,    setCamOn]    = useState(false);
  const [localSrc, setLocalSrc] = useState(null);

  // Update display peers from ref
  const syncPeers = useCallback(() => {
    setPeers(new Map(peers));
  }, [peers]);

  const createPeer = useCallback((targetSocketId, targetInfo, stream, initiator) => {
    const socket = getSocket();
    const peer   = new SimplePeer({
      initiator,
      trickle: true,
      stream: stream || undefined,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      },
    });

    peer.on('signal', (data) => {
      if (data.type === 'offer') {
        socket.emit('webrtc-offer', {
          targetSocketId,
          offer: data,
          senderInfo: { userId: user._id, name: user.name, role: user.role },
        });
      } else if (data.type === 'answer') {
        socket.emit('webrtc-answer', { targetSocketId, answer: data });
      } else {
        socket.emit('webrtc-ice-candidate', { targetSocketId, candidate: data });
      }
    });

    peer.on('stream', (remoteStream) => {
      setPeers(prev => {
        const next = new Map(prev);
        next.set(targetSocketId, {
          ...next.get(targetSocketId),
          stream: remoteStream,
          hasVideo: remoteStream.getVideoTracks().length > 0,
          hasAudio: remoteStream.getAudioTracks().length > 0,
        });
        return next;
      });
    });

    peer.on('error', (err) => console.warn('Peer error:', err.message));

    peer.on('close', () => {
      setPeers(prev => { const n = new Map(prev); n.delete(targetSocketId); return n; });
      peersRef.current.delete(targetSocketId);
    });

    peersRef.current.set(targetSocketId, peer);
    setPeers(prev => {
      const next = new Map(prev);
      next.set(targetSocketId, {
        stream: null,
        name:   targetInfo?.name   || 'Unknown',
        userId: targetInfo?.userId || '',
        role:   targetInfo?.role   || 'student',
        hasVideo: false,
        hasAudio: false,
      });
      return next;
    });

    return peer;
  }, [user]);

  // ── Socket listeners ──
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // A new peer joined — we (as existing member) initiate an offer to them
    const onNewPeer = ({ peerId, peerName, socketId: peerSocketId }) => {
      if (peerSocketId === socket.id) return;
      createPeer(peerSocketId, { userId: peerId, name: peerName }, localStream.current, true);
    };

    // We received an offer — create answer
    const onOffer = ({ offer, senderSocketId, senderInfo }) => {
      let peer = peersRef.current.get(senderSocketId);
      if (!peer) {
        peer = createPeer(senderSocketId, senderInfo, localStream.current, false);
      }
      peer.signal(offer);
    };

    // We received an answer
    const onAnswer = ({ answer, senderSocketId }) => {
      const peer = peersRef.current.get(senderSocketId);
      peer?.signal(answer);
    };

    // ICE candidate
    const onCandidate = ({ candidate, senderSocketId }) => {
      const peer = peersRef.current.get(senderSocketId);
      peer?.signal(candidate);
    };

    // Peer left
    const onPeerLeft = ({ socketId: leftSocketId }) => {
      const peer = peersRef.current.get(leftSocketId);
      peer?.destroy();
      peersRef.current.delete(leftSocketId);
      setPeers(prev => { const n = new Map(prev); n.delete(leftSocketId); return n; });
    };

    // Stream toggle notification
    const onStreamToggle = ({ socketId: sid, hasVideo, hasAudio }) => {
      setPeers(prev => {
        const n = new Map(prev);
        if (n.has(sid)) n.set(sid, { ...n.get(sid), hasVideo, hasAudio });
        return n;
      });
    };

    socket.on('webrtc-new-peer',       onNewPeer);
    socket.on('webrtc-offer',          onOffer);
    socket.on('webrtc-answer',         onAnswer);
    socket.on('webrtc-ice-candidate',  onCandidate);
    socket.on('webrtc-peer-left',      onPeerLeft);
    socket.on('webrtc-stream-toggle',  onStreamToggle);

    return () => {
      socket.off('webrtc-new-peer',       onNewPeer);
      socket.off('webrtc-offer',          onOffer);
      socket.off('webrtc-answer',         onAnswer);
      socket.off('webrtc-ice-candidate',  onCandidate);
      socket.off('webrtc-peer-left',      onPeerLeft);
      socket.off('webrtc-stream-toggle',  onStreamToggle);
    };
  }, [createPeer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      localStream.current?.getTracks().forEach(t => t.stop());
      peersRef.current.forEach(p => p.destroy());
      peersRef.current.clear();
    };
  }, []);

  const notifyStreamState = useCallback((stream) => {
    const socket = getSocket();
    socket?.emit('webrtc-stream-toggle', {
      roomId,
      hasVideo: stream ? stream.getVideoTracks().some(t => t.enabled) : false,
      hasAudio: stream ? stream.getAudioTracks().some(t => t.enabled) : false,
    });
  }, [roomId]);

  const startStream = useCallback(async (video = true, audio = true) => {
    try {
      if (localStream.current) {
        localStream.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio });
      localStream.current = stream;
      setLocalSrc(stream);
      setCamOn(video);
      setMicOn(audio);

      // Add stream to all existing peers
      peersRef.current.forEach(peer => {
        try { peer.addStream(stream); } catch {}
      });

      notifyStreamState(stream);
      return stream;
    } catch (err) {
      console.error('getUserMedia error:', err);
      throw err;
    }
  }, [notifyStreamState]);

  const shareScreen = useCallback(async () => {
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      if (localStream.current) localStream.current.getTracks().forEach(t => t.stop());
      localStream.current = screen;
      setLocalSrc(screen);
      setCamOn(true);

      peersRef.current.forEach(peer => {
        try { peer.addStream(screen); } catch {}
      });

      screen.getVideoTracks()[0].onended = () => stopStream();
      notifyStreamState(screen);
      return screen;
    } catch (err) {
      console.error('Screen share error:', err);
      throw err;
    }
  }, [notifyStreamState]);

  const stopStream = useCallback(() => {
    localStream.current?.getTracks().forEach(t => t.stop());
    localStream.current = null;
    setLocalSrc(null);
    setCamOn(false);
    setMicOn(false);
    notifyStreamState(null);
  }, [notifyStreamState]);

  const toggleMic = useCallback(() => {
    const stream = localStream.current;
    if (!stream) return;
    const tracks = stream.getAudioTracks();
    tracks.forEach(t => { t.enabled = !t.enabled; });
    const enabled = tracks[0]?.enabled ?? false;
    setMicOn(enabled);
    notifyStreamState(stream);
  }, [notifyStreamState]);

  const toggleCamera = useCallback(() => {
    const stream = localStream.current;
    if (!stream) return;
    const tracks = stream.getVideoTracks();
    tracks.forEach(t => { t.enabled = !t.enabled; });
    const enabled = tracks[0]?.enabled ?? false;
    setCamOn(enabled);
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
