import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { SessionHeader } from "@/components/session-header";
import { VideoPlayer } from "@/components/video-player";
import { VideoUrlPanel } from "@/components/video-url-panel";
import { VideoSourcesPanel } from "@/components/video-sources-panel";
import { VideoSourceSelector } from "@/components/video-source-selector";
import { StatusToast } from "@/components/status-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

export default function StreamPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const [sessionId, setSessionId] = useState(params.sessionId || '');
  const [viewerId] = useState(() => nanoid());
  const [showUrlPanel, setShowUrlPanel] = useState(false);
  const [showSourcesPanel, setShowSourcesPanel] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoSources, setVideoSources] = useState<any[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // WebSocket connection for real-time sync
  const { 
    isConnected, 
    sendMessage, 
    lastMessage,
    connectionStatus 
  } = useWebSocket(sessionId, viewerId);

  // Query session data
  const { data: session, isLoading } = useQuery({
    queryKey: ['/api/sessions', sessionId],
    enabled: !!sessionId,
  });

  // Query viewer count
  const { data: viewers = [] } = useQuery({
    queryKey: ['/api/sessions', sessionId, 'viewers'],
    enabled: !!sessionId,
    refetchInterval: 5000,
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (data: { sessionId?: string; videoUrl?: string }) => {
      const response = await apiRequest('POST', '/api/sessions', data);
      return response.json();
    },
    onSuccess: (data) => {
      setSessionId(data.id);
      if (!params.sessionId) {
        setLocation(`/session/${data.id}`);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
    },
  });

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    const message = lastMessage;
    switch (message.type) {
      case 'sync':
        if (message.data) {
          setCurrentTime(message.data.currentTime || 0);
          setIsPlaying(message.data.isPlaying || false);
          if (message.data.videoUrl) {
            setVideoUrl(message.data.videoUrl);
          }
          if (message.data.videoSources) {
            setVideoSources(message.data.videoSources);
          }
          if (message.data.selectedSourceId) {
            setSelectedSourceId(message.data.selectedSourceId);
          }
        }
        break;
      case 'play':
        setIsPlaying(true);
        if (message.data?.currentTime !== undefined) {
          setCurrentTime(message.data.currentTime);
        }
        break;
      case 'pause':
        setIsPlaying(false);
        if (message.data?.currentTime !== undefined) {
          setCurrentTime(message.data.currentTime);
        }
        break;
      case 'seek':
        if (message.data?.currentTime !== undefined) {
          setCurrentTime(message.data.currentTime);
        }
        break;
      case 'video-change':
        if (message.data?.videoUrl) {
          setVideoUrl(message.data.videoUrl);
          setCurrentTime(0);
          setIsPlaying(false);
        }
        break;
      case 'source-change':
        if (message.data?.videoSources) {
          setVideoSources(message.data.videoSources);
        }
        break;
      case 'viewer-join':
      case 'viewer-leave':
        queryClient.invalidateQueries({ queryKey: ['/api/sessions', sessionId, 'viewers'] });
        break;
    }
  }, [lastMessage, sessionId]);

  // Initialize session data
  useEffect(() => {
    if (session && typeof session === 'object') {
      const sessionData = session as any;
      setVideoUrl(sessionData.videoUrl || '');
      setVideoSources(sessionData.videoSources || []);
      setIsPlaying(sessionData.isPlaying || false);
      setCurrentTime(sessionData.currentTime || 0);
      
      // Set selected source to the first available source if none selected
      if (sessionData.videoSources && sessionData.videoSources.length > 0 && !selectedSourceId) {
        setSelectedSourceId(sessionData.videoSources[0].id);
        setVideoUrl(sessionData.videoSources[0].url);
      }
    }
  }, [session, selectedSourceId]);

  const handleCreateSession = () => {
    const newSessionId = nanoid();
    createSessionMutation.mutate({ sessionId: newSessionId });
  };

  const handleJoinSession = (inputSessionId: string) => {
    createSessionMutation.mutate({ sessionId: inputSessionId });
  };

  const handleVideoLoad = (url: string) => {
    setVideoUrl(url);
    setShowUrlPanel(false);
    
    sendMessage({
      type: 'video-change',
      sessionId,
      data: { videoUrl: url }
    });
  };

  const handleSourcesUpdate = (sources: any[]) => {
    setVideoSources(sources);
    
    sendMessage({
      type: 'source-change',
      sessionId,
      data: { videoSources: sources }
    });
  };

  const handleSourceSelect = (sourceId: string) => {
    const source = videoSources.find(s => s.id === sourceId);
    if (source) {
      setSelectedSourceId(sourceId);
      setVideoUrl(source.url);
      setCurrentTime(0);
      setIsPlaying(false);
      
      sendMessage({
        type: 'video-change',
        sessionId,
        data: { 
          videoUrl: source.url,
          selectedSourceId: sourceId 
        }
      });
    }
  };

  const handlePlayPause = () => {
    const newIsPlaying = !isPlaying;
    setIsPlaying(newIsPlaying);
    
    sendMessage({
      type: newIsPlaying ? 'play' : 'pause',
      sessionId,
      data: { 
        isPlaying: newIsPlaying,
        currentTime 
      }
    });
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    
    sendMessage({
      type: 'seek',
      sessionId,
      data: { currentTime: time }
    });
  };

  const handleProgress = (played: number) => {
    if (Math.abs(played * duration - currentTime) > 2) {
      // Only update if there's a significant difference to avoid constant updates
      setCurrentTime(played * duration);
    }
  };

  // Landing page for new users
  if (!sessionId) {
    return (
      <div className="min-h-screen surface flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Play className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold on-surface">SyncStream</h1>
            </div>
            <p className="on-surface-variant">
              Watch videos together in perfect sync with friends and family
            </p>
          </div>
          
          <div className="space-y-4">
            <Button 
              onClick={handleCreateSession}
              className="w-full bg-primary hover:bg-blue-600 text-white"
              disabled={createSessionMutation.isPending}
            >
              {createSessionMutation.isPending ? 'Creating...' : 'Start New Session'}
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="surface px-2 on-surface-variant">or</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Enter session ID to join"
                className="w-full px-4 py-2 surface-variant border border-gray-600 rounded-lg on-surface placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    handleJoinSession(e.currentTarget.value.trim());
                  }
                }}
              />
              <p className="text-xs on-surface-variant">
                Get the session ID from a friend to join their stream
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen surface flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="on-surface-variant">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen flex flex-col surface overflow-hidden">
      <SessionHeader 
        sessionId={sessionId}
        syncStatus={isConnected ? 'synced' : 'syncing'}
      />
      
      {/* Always show video player interface for all viewers */}
      <VideoPlayer
        videoUrl={videoUrl}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        videoSources={videoSources}
        selectedSourceId={selectedSourceId}
        onPlayPause={handlePlayPause}
        onSeek={handleSeek}
        onProgress={handleProgress}
        onDuration={setDuration}
        onSourceSelect={handleSourceSelect}
      />
      
      {showUrlPanel && (
        <VideoUrlPanel
          onVideoLoad={handleVideoLoad}
          onClose={() => setShowUrlPanel(false)}
        />
      )}
      
      {showSourcesPanel && (
        <VideoSourcesPanel
          videoSources={videoSources}
          onSourcesUpdate={handleSourcesUpdate}
          onClose={() => setShowSourcesPanel(false)}
        />
      )}
      
      <StatusToast
        status={connectionStatus}
        isVisible={connectionStatus !== 'connected'}
      />
      
      {/* Video Management Buttons - Upper Right Corner */}
      <div className="fixed top-20 right-6 flex flex-col space-y-3 z-30">
        <button
          onClick={() => setShowSourcesPanel(true)}
          className="w-12 h-12 bg-primary hover:bg-blue-600 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
          title="Manage video sources"
        >
          <span className="text-white text-xl font-light">⚙</span>
        </button>
        
        <button
          onClick={() => setShowUrlPanel(true)}
          className="w-12 h-12 bg-green-600 hover:bg-green-700 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
          title="Add single video"
        >
          <span className="text-white text-xl font-light">+</span>
        </button>
      </div>
    </div>
  );
}
