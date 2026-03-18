import React, { useState, useEffect, useRef } from "react";
import Peer from "simple-peer";
import io from "socket.io-client";
import "./VoiceChat.css";

function VoiceChat({ gameId, username, onClose }) {
  const [stream, setStream] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();
  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = io("http://localhost:5000");

    navigator.mediaDevices
      .getUserMedia({ video: false, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }
      })
      .catch((err) => console.log("Media error:", err));

    socketRef.current.on("call-user", ({ signal, from }) => {
      setIncomingCall({ signal, from });
    });

    socketRef.current.on("call-accepted", ({ signal }) => {
      setCallAccepted(true);
      if (connectionRef.current) {
        connectionRef.current.signal(signal);
      }
    });

    socketRef.current.on("call-ended", () => {
      setCallEnded(true);
      if (connectionRef.current) {
        connectionRef.current.destroy();
      }
    });

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (connectionRef.current) {
        connectionRef.current.destroy();
      }
      socketRef.current.close();
    };
  }, []);

  const callUser = () => {
    setIsCalling(true);
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("call-user", {
        signal,
        to: gameId,
        from: username,
      });
    });

    peer.on("stream", (currentStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = currentStream;
      }
    });

    socketRef.current.on("call-accepted", ({ signal }) => {
      setCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const answerCall = () => {
    setCallAccepted(true);
    setIncomingCall(null);

    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("answer-call", {
        signal,
        to: gameId,
      });
    });

    peer.on("stream", (currentStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = currentStream;
      }
    });

    peer.signal(incomingCall.signal);
    connectionRef.current = peer;
  };

  const endCall = () => {
    setCallEnded(true);
    if (connectionRef.current) {
      connectionRef.current.destroy();
    }
    socketRef.current.emit("end-call", { to: gameId });
  };

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !micEnabled;
      });
      setMicEnabled(!micEnabled);
    }
  };

  return (
    <div className="voice-chat-container">
      <div className="video-container">
        <div className="my-video">
          <video ref={myVideo} muted autoPlay playsInline />
          <span className="video-label">{username} (You)</span>
        </div>

        {callAccepted && !callEnded && (
          <div className="user-video">
            <video ref={userVideo} autoPlay playsInline />
            <span className="video-label">Opponent</span>
          </div>
        )}
      </div>

      {incomingCall && (
        <div className="incoming-call">
          <p>📞 Incoming call from {incomingCall.from}</p>
          <div className="call-buttons">
            <button onClick={answerCall} className="accept-call">
              Accept
            </button>
            <button
              onClick={() => setIncomingCall(null)}
              className="decline-call"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      <div className="call-controls">
        {!callAccepted && !isCalling && !incomingCall && (
          <button onClick={callUser} className="start-call">
            📞 Start Voice Call
          </button>
        )}

        {callAccepted && !callEnded && (
          <>
            <button
              onClick={toggleMic}
              className={`control-btn ${micEnabled ? "active" : ""}`}
            >
              {micEnabled ? "🎤 Mic On" : "🎤 Mic Off"}
            </button>
            <button onClick={endCall} className="end-call">
              ❌ End Call
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default VoiceChat;
