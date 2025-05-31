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

export function AudioChat({ sessionId, viewerId, isConnected }: AudioChatProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [isInCall, setIsInCall] = useState(false);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [hasPermission, setHasPermission] = useState(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

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

  // End audio call
  const endCall = () => {
    setIsInCall(false);
    setIsMuted(true);

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