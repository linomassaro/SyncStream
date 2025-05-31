import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SyncMessage } from "@shared/schema";

interface AudioChatProps {
  sessionId: string;
  viewerId: string;
  isConnected: boolean;
  sendMessage: (message: SyncMessage) => void;
  lastMessage: SyncMessage | null;
}

export function AudioChat({ sessionId, viewerId, isConnected, sendMessage, lastMessage }: AudioChatProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [isInCall, setIsInCall] = useState(false);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [hasPermission, setHasPermission] = useState(false);
  const [connectedPeers, setConnectedPeers] = useState<Set<string>>(new Set());
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  // Get available audio devices
  useEffect(() => {
    const getAudioDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        setAudioDevices(audioInputs);
      } catch (error) {
        console.error('Error getting audio devices:', error);
      }
    };

    getAudioDevices();
  }, []);

  // Request microphone permission
  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      localStreamRef.current = stream;
      setHasPermission(true);
      return stream;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setHasPermission(false);
      return null;
    }
  };

  // WebRTC Configuration
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // Create peer connection
  const createPeerConnection = (remoteViewerId: string) => {
    const pc = new RTCPeerConnection(rtcConfig);
    
    // Add local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (remoteStream) {
        const audioElement = new Audio();
        audioElement.srcObject = remoteStream;
        audioElement.autoplay = true;
        audioElementsRef.current.set(remoteViewerId, audioElement);
        setConnectedPeers(prev => {
          const newSet = new Set(prev);
          newSet.add(remoteViewerId);
          return newSet;
        });
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendMessage({
          type: 'webrtc-ice-candidate',
          sessionId,
          data: {
            targetViewerId: remoteViewerId,
            viewerId,
            iceCandidate: event.candidate.toJSON()
          }
        });
      }
    };

    peerConnectionsRef.current.set(remoteViewerId, pc);
    return pc;
  };

  // Start audio call
  const startCall = async () => {
    if (!hasPermission) {
      const stream = await requestMicrophonePermission();
      if (!stream) return;
    }

    setIsInCall(true);
    setIsMuted(false);
    
    // Enable audio track
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = true;
      });
    }
  };

  // Handle WebRTC messages
  useEffect(() => {
    if (!lastMessage) return;

    const handleWebRTCMessage = async (message: SyncMessage) => {
      if (!message.data?.viewerId || message.data.viewerId === viewerId) return;

      const remoteViewerId = message.data.viewerId;

      switch (message.type) {
        case 'webrtc-offer':
          if (message.data.targetViewerId === viewerId && message.data.offer) {
            const pc = createPeerConnection(remoteViewerId);
            await pc.setRemoteDescription(message.data.offer);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            sendMessage({
              type: 'webrtc-answer',
              sessionId,
              data: {
                targetViewerId: remoteViewerId,
                viewerId,
                answer
              }
            });
          }
          break;

        case 'webrtc-answer':
          if (message.data.targetViewerId === viewerId && message.data.answer) {
            const pc = peerConnectionsRef.current.get(remoteViewerId);
            if (pc) {
              await pc.setRemoteDescription(message.data.answer);
            }
          }
          break;

        case 'webrtc-ice-candidate':
          if (message.data.targetViewerId === viewerId && message.data.iceCandidate) {
            const pc = peerConnectionsRef.current.get(remoteViewerId);
            if (pc) {
              await pc.addIceCandidate(new RTCIceCandidate(message.data.iceCandidate));
            }
          }
          break;
      }
    };

    if (isInCall) {
      handleWebRTCMessage(lastMessage);
    }
  }, [lastMessage, isInCall, sessionId, viewerId, sendMessage]);

  // End audio call
  const endCall = () => {
    setIsInCall(false);
    setIsMuted(true);

    // Close all peer connections
    peerConnectionsRef.current.forEach(pc => {
      pc.close();
    });
    peerConnectionsRef.current.clear();

    // Stop all audio tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      localStreamRef.current = null;
    }

    // Clean up audio elements
    audioElementsRef.current.forEach(audio => {
      audio.pause();
      audio.srcObject = null;
    });
    audioElementsRef.current.clear();
    setConnectedPeers(new Set());
    
    setHasPermission(false);
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {!isInCall ? (
        <Button
          onClick={startCall}
          variant="ghost"
          size="sm"
          className="p-2 hover:bg-gray-700 rounded-lg"
          title="Join voice chat"
          disabled={!isConnected}
        >
          <Phone className="h-4 w-4 on-surface-variant" />
        </Button>
      ) : (
        <>
          <Button
            onClick={toggleMute}
            variant="ghost"
            size="sm"
            className={`p-2 rounded-lg ${
              isMuted 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'hover:bg-gray-700 text-green-400'
            }`}
            title={isMuted ? "Unmute microphone" : "Mute microphone"}
          >
            {isMuted ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
          
          <Button
            onClick={endCall}
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-gray-700 rounded-lg text-red-400 hover:text-red-300"
            title="Leave voice chat"
          >
            <PhoneOff className="h-4 w-4" />
          </Button>
        </>
      )}
      
      {isInCall && (
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-green-400 hidden md:inline">Live</span>
        </div>
      )}
    </div>
  );
}