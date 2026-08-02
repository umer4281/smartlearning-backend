import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

// Jitsi Meet External API URL
const JITSI_DOMAIN = 'meet.jit.si';

const Classroom = () => {
  const { user } = useAuth();
  const [inRoom, setInRoom] = useState(false);
  const [roomId] = useState('smartlearning-classroom');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const jitsiContainerRef = useRef(null);
  const jitsiApiRef = useRef(null);

  // Load Jitsi Meet External API script
  const loadJitsiScript = () => {
    return new Promise((resolve, reject) => {
      if (window.JitsiMeetExternalAPI) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = `https://${JITSI_DOMAIN}/external_api.js`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Jitsi Meet. Please check your internet connection.'));
      document.body.appendChild(script);
    });
  };

  const joinRoom = async () => {
    setError('');
    setIsLoading(true);
    try {
      await loadJitsiScript();

      if (!window.JitsiMeetExternalAPI) {
        throw new Error('Jitsi Meet failed to initialize.');
      }

      // Clean up any existing instance
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }

      // Create Jitsi Meet instance
      const domain = JITSI_DOMAIN;
      const options = {
        roomName: roomId,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName: user?.name || 'Student',
          email: user?.email || '',
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          disableInviteFunctions: true,
          disableProfile: true,
          toolbarButtons: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
            'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
            'security'
          ],
        },
        interfaceConfigOverwrite: {
          DEFAULT_BACKGROUND: '#0a2e22',
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
            'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
            'security'
          ],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_POWERED_BY: false,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
          MOBILE_APP_PROMO: false,
          DEFAULT_REMOTE_DISPLAY_NAME: 'Student',
          DEFAULT_LOCAL_DISPLAY_NAME: 'You',
        },
      };

      const api = new window.JitsiMeetExternalAPI(domain, options);
      jitsiApiRef.current = api;

      // Event handlers
      api.addEventListeners({
        readyToClose: () => {
          leaveRoom();
        },
        videoConferenceLeft: () => {
          setInRoom(false);
          setIsLoading(false);
        },
        videoConferenceJoined: () => {
          setInRoom(true);
          setIsLoading(false);
        },
        participantJoined: () => {
          // Participant joined
        },
        participantLeft: () => {
          // Participant left
        },
      });

      setInRoom(true);
    } catch (err) {
      console.error('Jitsi Meet error:', err);
      setError(err.message || 'Failed to join the classroom. Please try again.');
      setIsLoading(false);
    }
  };

  const leaveRoom = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.dispose();
      jitsiApiRef.current = null;
    }
    setInRoom(false);
    setIsLoading(false);
    // Clear the container
    if (jitsiContainerRef.current) {
      jitsiContainerRef.current.innerHTML = '';
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
  }, []);

  return (
    <div className="classroom-page">
      <div className="classroom-container">
        <div className="classroom-header">
          <div className="classroom-header-left">
            <span className="classroom-header-icon">🎥</span>
            <div>
              <h2 className="classroom-title">Video Classroom</h2>
              <p className="classroom-subtitle">
                {inRoom ? 'Connected — Live session via Jitsi Meet' : 'Join a live learning session via Jitsi Meet'}
              </p>
            </div>
          </div>
          {inRoom && (
            <button type="button" className="btn btn-leave" onClick={leaveRoom}>
              🚪 Leave Room
            </button>
          )}
        </div>

        {error && (
          <div className="classroom-alert alert-error">
            <span className="alert-icon">❌</span>
            <div className="alert-content">
              <strong>Connection Error</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Always render the Jitsi container so the ref is never null */}
        <div className={`jitsi-container ${!inRoom ? 'jitsi-container-hidden' : ''}`}>
          <div ref={jitsiContainerRef} className="jitsi-meet-frame" />
        </div>

        {!inRoom && (
          <div className="classroom-join">
            <div className="join-card">
              <div className="join-icon">🎥</div>
              <h3>Join the Classroom</h3>
              <p>Connect with your teacher and classmates via Jitsi Meet — a reliable, high-quality video conferencing platform</p>
              <div className="join-features">
                <span>✅ HD Video & Audio</span>
                <span>💬 Built-in Chat</span>
                <span>🖥️ Screen Sharing</span>
                <span>📱 Works on Mobile</span>
              </div>
              <button
                type="button"
                className="btn btn-join"
                onClick={joinRoom}
                disabled={isLoading}
              >
                {isLoading ? '⏳ Connecting...' : '🎥 Join Classroom'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Classroom;