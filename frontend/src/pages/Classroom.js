import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = (() => {
  if (process.env.REACT_APP_SOCKET_URL) {
    return process.env.REACT_APP_SOCKET_URL;
  }
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  if (window.location.protocol === 'https:') {
    return 'https://smartlearning-backend-2.onrender.com';
  }
  return `http://${hostname}:5000`;
})();

const Classroom = () => {
  const { user } = useAuth();
  const [inRoom, setInRoom] = useState(false);
  const [roomId] = useState('main-classroom');
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [users, setUsers] = useState([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [localVideoReady, setLocalVideoReady] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMobile] = useState(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  });
  const socketRef = useRef();
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const localStreamRef = useRef();
  const pcRef = useRef(null);
  const messagesEndRef = useRef();
  const audioEnabledRef = useRef(true);
  const videoEnabledRef = useRef(true);

  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  // Attach local stream to video element whenever it mounts or stream changes
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      setLocalVideoReady(true);
    }
  }, [inRoom, localVideoRef.current]);

  // Attach remote stream to video element whenever it changes
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, remoteVideoRef.current]);

  const closePC = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    setRemoteStream(null);
  }, []);

  const createPC = useCallback((remoteSocketId, direction = 'offerer') => {
    closePC();
    const pc = new RTCPeerConnection(configuration);
    const localStream = localStreamRef.current;

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    pc.ontrack = (event) => {
      if (event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && remoteSocketId) {
        socketRef.current.emit('ice-candidate', { candidate: event.candidate, to: remoteSocketId });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        closePC();
      }
    };

    pcRef.current = pc;
    return pc;
  }, [closePC, configuration]);

  const startCall = useCallback(async (remoteSocketId) => {
    if (!remoteSocketId || !localStreamRef.current) return;
    console.log('Starting call to:', remoteSocketId);
    const pc = createPC(remoteSocketId, 'offerer');
    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);
      socketRef.current.emit('offer', { offer, to: remoteSocketId });
    } catch (err) {
      console.error('Error creating offer:', err);
    }
  }, [createPC]);

  const handleOffer = useCallback(async ({ offer, from }) => {
    if (!localStreamRef.current) {
      console.log('No local stream yet, cannot handle offer');
      return;
    }
    console.log('Received offer from:', from);
    const pc = createPC(from, 'answerer');
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketRef.current.emit('answer', { answer, to: from });
    } catch (err) {
      console.error('Error handling offer:', err);
    }
  }, [createPC]);

  const handleAnswer = useCallback(async ({ answer }) => {
    try {
      if (pcRef.current && pcRef.current.remoteDescription === null && pcRef.current.signalingState === 'have-local-offer') {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('Remote description set successfully');
      }
    } catch (err) {
      console.error('Error handling answer:', err);
    }
  }, []);

  const handleIceCandidate = useCallback(async ({ candidate }) => {
    try {
      if (pcRef.current && candidate) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (e) {
      console.error('Error adding ice candidate:', e);
    }
  }, []);

  // Socket event handlers setup
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'], upgrade: false });
    socketRef.current = socket;

    socket.on('user-joined', ({ userId, userName, socketId }) => {
      console.log('User joined:', userName, socketId);
      setUsers((prev) => {
        // Avoid duplicates
        if (prev.some((u) => u.socketId === socketId)) return prev;
        return [...prev, { userId, userName, socketId }];
      });
    });

    socket.on('user-left', ({ userId }) => {
      console.log('User left:', userId);
      setUsers((prev) => prev.filter((u) => u.userId !== userId));
      closePC();
    });

    socket.on('room-users', (roomUsers) => {
      console.log('Room users received:', roomUsers.length);
      // Filter out self from the list to avoid calling ourselves
      const others = roomUsers.filter((u) => u.userId !== user?._id);
      setUsers(others);
    });

    socket.on('receive-message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      closePC();
      socket.disconnect();
    };
  }, [handleOffer, handleAnswer, handleIceCandidate, closePC, user?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initiate call when users change (new person joined)
  useEffect(() => {
    if (!inRoom || !localStreamRef.current || users.length === 0) return;

    // Only initiate if we have exactly one remote user to call
    // and we don't already have an active connection
    if (!pcRef.current || pcRef.current.connectionState === 'failed' || pcRef.current.connectionState === 'disconnected') {
      const timer = setTimeout(() => {
        const remoteUser = users[0];
        if (remoteUser?.socketId && remoteUser.userId !== user?._id) {
          console.log('Initiating call to:', remoteUser.userName);
          startCall(remoteUser.socketId);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [users.length, inRoom, startCall, user?._id]);

  const startLocalStream = useCallback(async () => {
    try {
      setMediaError('');
      // Use higher quality defaults but mobile-friendly
      const constraints = {
        video: isMobile
          ? { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
          : { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      // Set the local video element if it's already mounted
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        setLocalVideoReady(true);
      }
      return stream;
    } catch (err) {
      if (err.name === 'NotAllowedError') setMediaError('Camera/microphone permission denied. Please allow access and try again.');
      else if (err.name === 'NotFoundError') setMediaError('No camera or microphone found on this device.');
      else if (err.name === 'NotReadableError') setMediaError('Camera or microphone is already in use by another app.');
      else setMediaError(`Media error: ${err.message}`);
      return null;
    }
  }, [isMobile]);

  const joinRoom = async () => {
    setMediaError('');
    const stream = await startLocalStream();
    if (!stream) return;
    socketRef.current.emit('join-room', { roomId, userId: user?._id, userName: user?.name });
    setInRoom(true);
  };

  const toggleAudio = () => {
    const stream = localStreamRef.current;
    if (stream) {
      const enabled = !audioEnabledRef.current;
      audioEnabledRef.current = enabled;
      stream.getAudioTracks().forEach((track) => { track.enabled = enabled; });
      setAudioEnabled(enabled);
      socketRef.current.emit('toggle-audio', { roomId, enabled });
    }
  };

  const toggleVideo = () => {
    const stream = localStreamRef.current;
    if (stream) {
      const enabled = !videoEnabledRef.current;
      videoEnabledRef.current = enabled;
      stream.getVideoTracks().forEach((track) => { track.enabled = enabled; });
      setVideoEnabled(enabled);
      socketRef.current.emit('toggle-video', { roomId, enabled });
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (messageInput.trim()) {
      socketRef.current.emit('send-message', { roomId, message: messageInput });
      setMessages((prev) => [...prev, {
        userId: user?._id,
        userName: user?.name,
        message: messageInput,
        timestamp: new Date().toISOString(),
        isOwn: true,
      }]);
      setMessageInput('');
    }
  };

  const leaveRoom = () => {
    setInRoom(false);
    setUsers([]);
    setMessages([]);
    setRemoteStream(null);
    setLocalVideoReady(false);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    closePC();
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (socketRef.current) socketRef.current.emit('leave-room', { roomId });
  };

  const isMediaSupported = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  return (
    <div className="classroom-page">
      <div className="classroom-container">
        <div className="classroom-header">
          <div className="classroom-header-left">
            <span className="classroom-header-icon">🎥</span>
            <div>
              <h2 className="classroom-title">Video Classroom</h2>
              <p className="classroom-subtitle">
                {inRoom ? `Connected — ${users.length} user${users.length !== 1 ? 's' : ''} in room` : 'Join a live learning session'}
              </p>
            </div>
          </div>
          {inRoom && <button type="button" className="btn btn-leave" onClick={leaveRoom}>🚪 Leave Room</button>}
        </div>

        {mediaError && (
          <div className="classroom-alert alert-error">
            <span className="alert-icon">❌</span>
            <div className="alert-content">
              <strong>Media Error</strong>
              <p>{mediaError}</p>
            </div>
          </div>
        )}

        {!isMediaSupported() && (
          <div className="classroom-alert alert-warning">
            <span className="alert-icon">⚠️</span>
            <div className="alert-content">Your browser does not support camera/microphone access. Please use Chrome, Firefox, or Safari.</div>
          </div>
        )}

        {!inRoom ? (
          <div className="classroom-join">
            <div className="join-card">
              <div className="join-icon">🎥</div>
              <h3>Join the Classroom</h3>
              <p>Connect with your teacher and classmates via live video call</p>
              {isMobile && <div className="join-mobile-note">📱 Please allow camera and microphone when prompted by your browser</div>}
              <button type="button" className="btn btn-join" onClick={joinRoom} disabled={!isMediaSupported()}>
                🎥 Join Classroom
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="classroom-videos-section">
              <div className="videos-grid">
                {/* Local Video - You */}
                <div className="video-card local">
                  <div className="video-wrapper">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="video-element"
                    />
                    <div className="video-overlay">
                      <div className="video-user-badge">
                        <span className="video-user-avatar">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                        <span className="video-user-name">You ({user?.name})</span>
                      </div>
                      {!videoEnabled && <div className="video-off-indicator">📹 Off</div>}
                      {videoEnabled && !localVideoReady && (
                        <div className="calling-indicator">Starting camera...</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Remote Video - Other Users */}
                <div className="video-card remote">
                  <div className="video-wrapper">
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="video-element"
                    />
                    <div className="video-overlay">
                      <div className="video-user-badge">
                        <span className="video-user-avatar remote-avatar">
                          {users.length > 0 ? users[0]?.userName?.charAt(0).toUpperCase() || '?' : '?'}
                        </span>
                        <span className="video-user-name">
                          {remoteStream ? (users[0]?.userName || 'Remote User') : 'Waiting...'}
                        </span>
                      </div>
                      {!remoteStream && users.length === 0 && (
                        <div className="waiting-indicator">
                          <div className="waiting-dots"><span></span><span></span><span></span></div>
                          <span>Waiting for someone to join...</span>
                        </div>
                      )}
                      {!remoteStream && users.length > 0 && (
                        <div className="calling-indicator">
                          <span>🔗 Connecting to {users[0]?.userName}...</span>
                        </div>
                      )}
                      {remoteStream && (
                        <div className="video-off-indicator" style={{ background: 'rgba(16, 185, 129, 0.8)' }}>
                          Connected
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Control buttons */}
              <div className="classroom-controls">
                <button type="button" className={`ctrl-btn ${audioEnabled ? 'active' : 'inactive'}`} onClick={toggleAudio}>
                  <span className="ctrl-icon">{audioEnabled ? '🎤' : '🔇'}</span>
                  <span className="ctrl-label">{audioEnabled ? 'Mute' : 'Unmute'}</span>
                </button>
                <button type="button" className={`ctrl-btn ${videoEnabled ? 'active' : 'inactive'}`} onClick={toggleVideo}>
                  <span className="ctrl-icon">{videoEnabled ? '📹' : '🚫'}</span>
                  <span className="ctrl-label">{videoEnabled ? 'Hide' : 'Show'}</span>
                </button>
                <button type="button" className="ctrl-btn" onClick={() => setShowChat(!showChat)}>
                  <span className="ctrl-icon">💬</span>
                  <span className="ctrl-label">Chat</span>
                  {messages.length > 0 && <span className="chat-badge">{messages.length}</span>}
                </button>
              </div>

              <div className="classroom-users-bar">
                <span className="users-bar-label">👥 In Room:</span>
                {users.map((u, i) => (
                  <span key={i} className="user-chip">
                    <span className="user-chip-avatar">{u.userName?.charAt(0).toUpperCase()}</span>
                    {u.userName}
                  </span>
                ))}
                {users.length === 0 && <span className="text-muted small">No other users yet</span>}
              </div>
            </div>

            {showChat && (
              <div className="classroom-chat-panel">
                <div className="chat-panel-header">
                  <h5>💬 Chat</h5>
                  <button type="button" className="btn-close-chat" onClick={() => setShowChat(false)}>✕</button>
                </div>
                <div className="chat-panel-messages">
                  {messages.length === 0 && <div className="chat-empty">No messages yet.</div>}
                  {messages.map((msg, i) => (
                    <div key={i} className={`chat-msg ${msg.isOwn ? 'own' : ''}`}>
                      <div className="chat-msg-sender">{msg.userName}</div>
                      <div className="chat-msg-text">{msg.message}</div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div className="chat-panel-input">
                  <form onSubmit={sendMessage} className="chat-form">
                    <input
                      type="text"
                      className="chat-input"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Type a message..."
                    />
                    <button type="submit" className="btn-send">Send</button>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Classroom;