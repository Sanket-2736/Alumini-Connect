'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion } from 'framer-motion';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  MessageCircle,
  X,
  Send,
  Loader,
} from 'lucide-react';
import { toast } from 'sonner';

interface VideoRoomProps {
  sessionId: string;
  role: 'initiator' | 'participant';
  displayName: string;
  remoteDisplayName?: string;
  startTime: string;
  endTime: string;
  signalingUrl: string;
  onCallEnd?: () => void;
}

type Phase = 'confirm' | 'countdown' | 'connecting' | 'waiting' | 'live' | 'ended';

interface ChatMessage {
  from: string;
  message: string;
  timestamp: number;
  isOwn: boolean;
}

export default function VideoRoom({
  sessionId,
  role,
  displayName,
  remoteDisplayName = 'Participant',
  startTime,
  endTime,
  signalingUrl,
  onCallEnd,
}: VideoRoomProps) {
  const [phase, setPhase] = useState<Phase>('confirm');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Initializing...');
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  // Initialize WebRTC
  const initializeWebRTC = async () => {
    try {
      setStatusMsg('Requesting camera and microphone...');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
        ],
      });

      peerConnectionRef.current = peerConnection;

      // Add local stream tracks
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log('Remote track received:', event.track.kind);
        if (remoteStreamRef.current) {
          remoteStreamRef.current.addTrack(event.track);
        } else {
          remoteStreamRef.current = new MediaStream([event.track]);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStreamRef.current;
          }
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current?.emit('ice-candidate', {
            sessionId,
            candidate: event.candidate,
          });
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        switch (peerConnection.connectionState) {
          case 'connected':
            setPhase('live');
            setStatusMsg('Connected');
            toast.success('Call connected!');
            break;
          case 'disconnected':
            setStatusMsg('Disconnected');
            break;
          case 'failed':
            setError('Connection failed');
            setStatusMsg('Connection failed');
            break;
          case 'closed':
            setPhase('ended');
            break;
        }
      };

      setStatusMsg('Ready to connect');
      setPhase('waiting');
    } catch (err: any) {
      const errorMsg = err.name === 'NotAllowedError'
        ? 'Camera/microphone permission denied'
        : err.message;
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  // Initialize Socket.IO
  useEffect(() => {
    const socket = io(signalingUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit('join-room', {
        sessionId,
        role,
        displayName,
        userId: sessionId,
      });
    });

    socket.on('room-participants', async (data) => {
      console.log('Room participants:', data.participants);
      if (data.participants.length === 1 && role === 'initiator') {
        setStatusMsg('Waiting for participant...');
      }
    });

    socket.on('ready-to-call', async () => {
      console.log('Both participants ready');
      if (role === 'initiator') {
        setPhase('connecting');
        setStatusMsg('Creating offer...');

        if (peerConnectionRef.current) {
          const offer = await peerConnectionRef.current.createOffer();
          await peerConnectionRef.current.setLocalDescription(offer);
          socket.emit('call-user', {
            sessionId,
            offer,
          });
        }
      }
    });

    socket.on('call-received', async (data) => {
      console.log('Call received');
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(data.offer)
        );
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        socket.emit('call-accepted', {
          sessionId,
          answer,
        });
      }
    });

    socket.on('call-answer', async (data) => {
      console.log('Call answered');
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
      }
    });

    socket.on('ice-candidate', (data) => {
      if (peerConnectionRef.current && data.candidate) {
        peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(data.candidate)
        ).catch(err => console.error('Error adding ICE candidate:', err));
      }
    });

    socket.on('chat-message', (data) => {
      setChatMessages(prev => [...prev, {
        from: data.from,
        message: data.message,
        timestamp: data.timestamp,
        isOwn: false,
      }]);
      if (!showChat) {
        setUnreadCount(prev => prev + 1);
      }
    });

    socket.on('call-ended', () => {
      toast.info('Call ended by other participant');
      endCall();
    });

    socket.on('user-left', (data) => {
      toast.warning(`${data.displayName} left the call`);
      endCall();
    });

    socket.on('error', (data) => {
      setError(data.message);
      toast.error(data.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId, role, displayName, signalingUrl]);

  // Initialize media on mount
  useEffect(() => {
    initializeWebRTC();
  }, []);

  // Handle early start
  const handleEarlyStart = async () => {
    if (role !== 'initiator') {
      toast.error('Only alumni can start the call');
      return;
    }

    setPhase('connecting');
    setStatusMsg('Starting call...');

    if (peerConnectionRef.current) {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      socketRef.current?.emit('call-user', {
        sessionId,
        offer,
      });
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff(!isCameraOff);
    }
  };

  // End call
  const endCall = () => {
    socketRef.current?.emit('end-call', { sessionId });

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }

    setPhase('ended');
    setStatusMsg('Call ended');
    onCallEnd?.();
  };

  // Send chat message
  const sendChatMessage = () => {
    if (!chatInput.trim()) return;

    const message: ChatMessage = {
      from: displayName,
      message: chatInput,
      timestamp: Date.now(),
      isOwn: true,
    };

    setChatMessages(prev => [...prev, message]);
    socketRef.current?.emit('chat-message', {
      sessionId,
      message: chatInput,
      timestamp: Date.now(),
    });
    setChatInput('');
  };

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeRemaining('Time ended');
        if (phase === 'live') {
          endCall();
        }
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, phase]);

  return (
    <div className="w-full h-screen bg-black flex flex-col">
      {/* Video Container */}
      <div className="flex-1 relative overflow-hidden">
        {/* Remote Video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Local Video (Picture in Picture) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute bottom-4 right-4 w-32 h-32 md:w-48 md:h-48 bg-gray-900 rounded-lg overflow-hidden border-2 border-white shadow-lg"
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Status Overlay */}
        {phase !== 'live' && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-center text-white">
              <Loader className="animate-spin mx-auto mb-4" size={48} />
              <p className="text-xl font-semibold">{statusMsg}</p>
              {error && <p className="text-red-400 mt-2">{error}</p>}
            </div>
          </div>
        )}

        {/* Timer */}
        {phase === 'live' && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg font-mono">
            {timeRemaining}
          </div>
        )}

        {/* Remote Name */}
        {phase === 'live' && (
          <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg">
            {remoteDisplayName}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-900 border-t border-gray-700 p-4">
        <div className="flex items-center justify-center gap-4">
          {/* Mute Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleAudio}
            className={`p-3 rounded-full transition ${
              isMuted
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </motion.button>

          {/* Camera Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleVideo}
            className={`p-3 rounded-full transition ${
              isCameraOff
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {isCameraOff ? <VideoOff size={24} /> : <Video size={24} />}
          </motion.button>

          {/* Chat Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowChat(!showChat);
              if (!showChat) setUnreadCount(0);
            }}
            className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 relative"
          >
            <MessageCircle size={24} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </motion.button>

          {/* Early Start Button (Alumni only) */}
          {role === 'initiator' && phase === 'waiting' && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEarlyStart}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-full font-semibold"
            >
              Start Now
            </motion.button>
          )}

          {/* End Call Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={endCall}
            className="p-3 rounded-full bg-red-600 hover:bg-red-700"
          >
            <PhoneOff size={24} />
          </motion.button>
        </div>
      </div>

      {/* Chat Panel */}
      {showChat && (
        <motion.div
          initial={{ x: 400 }}
          animate={{ x: 0 }}
          exit={{ x: 400 }}
          className="absolute right-0 top-0 bottom-0 w-80 bg-gray-900 border-l border-gray-700 flex flex-col"
        >
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="font-semibold text-white">Chat</h3>
            <button
              onClick={() => setShowChat(false)}
              className="text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    msg.isOwn
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-700 text-gray-100'
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-700 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
              placeholder="Type message..."
              className="flex-1 bg-gray-800 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={sendChatMessage}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded"
            >
              <Send size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
