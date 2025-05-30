import { useState, useRef, useEffect } from "react";
import ReactPlayer from "react-player";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize, Settings, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VideoPlayerProps {
  videoUrl: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onProgress: (played: number) => void;
  onDuration: (duration: number) => void;
}

export function VideoPlayer({
  videoUrl,
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onSeek,
  onProgress,
  onDuration
}: VideoPlayerProps) {
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<string>('auto');
  const playerRef = useRef<ReactPlayer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-hide controls
  useEffect(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    if (isPlaying && showControls) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, showControls]);

  // Sync video time with external currentTime
  useEffect(() => {
    if (playerRef.current && Math.abs(playerRef.current.getCurrentTime() - currentTime) > 2) {
      playerRef.current.seekTo(currentTime, 'seconds');
    }
  }, [currentTime]);

  const handleMouseMove = () => {
    setShowControls(true);
  };

  const handleSkip = (seconds: number) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    onSeek(newTime);
  };

  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const progress = clickX / rect.width;
    const newTime = progress * duration;
    onSeek(newTime);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleDoubleClick = () => {
    toggleFullscreen();
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00:00";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get video element for track access
  const getVideoElement = () => {
    if (playerRef.current) {
      const player = playerRef.current.getInternalPlayer();
      if (player && player.tagName === 'VIDEO') {
        return player as HTMLVideoElement;
      }
    }
    return null;
  };

  // Get available audio tracks
  const getAudioTracks = () => {
    const video = getVideoElement();
    if (video && video.audioTracks) {
      return Array.from(video.audioTracks).map((track, index) => ({
        id: index,
        label: track.label || `Audio Track ${index + 1}`,
        language: track.language || 'unknown',
        enabled: track.enabled
      }));
    }
    return [];
  };

  // Get available text tracks (subtitles)
  const getTextTracks = () => {
    const video = getVideoElement();
    if (video && video.textTracks) {
      return Array.from(video.textTracks).map((track, index) => ({
        id: index,
        label: track.label || `Subtitle ${index + 1}`,
        language: track.language || 'unknown',
        kind: track.kind,
        mode: track.mode
      }));
    }
    return [];
  };

  // Set audio track
  const setAudioTrack = (trackId: number) => {
    const video = getVideoElement();
    if (video && video.audioTracks) {
      Array.from(video.audioTracks).forEach((track, index) => {
        track.enabled = index === trackId;
      });
    }
  };

  // Set subtitle track
  const setSubtitleTrack = (trackId: number | null) => {
    const video = getVideoElement();
    if (video && video.textTracks) {
      Array.from(video.textTracks).forEach((track, index) => {
        track.mode = index === trackId ? 'showing' : 'hidden';
      });
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative flex-1 bg-black group"
      onMouseMove={handleMouseMove}
      onDoubleClick={handleDoubleClick}
    >
      {/* Video Player */}
      <div className="w-full h-full">
        {videoUrl ? (
          <ReactPlayer
            ref={playerRef}
            url={videoUrl}
            playing={isPlaying}
            volume={muted ? 0 : volume}
            playbackRate={playbackRate}
            width="100%"
            height="100%"
            onProgress={({ played }) => onProgress(played)}
            onDuration={onDuration}
            config={{
              youtube: {
                playerVars: {
                  showinfo: 0,
                  controls: 0,
                  modestbranding: 1,
                  rel: 0
                }
              },
              file: {
                attributes: {
                  crossOrigin: 'anonymous',
                  preload: 'metadata'
                }
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <div className="text-center space-y-4">
              <Play className="h-16 w-16 text-gray-500 mx-auto" />
              <p className="text-gray-400 text-lg">No video loaded</p>
              <p className="text-gray-500 text-sm">Click the + button to add a video URL</p>
            </div>
          </div>
        )}
      </div>

      {/* Video Controls Overlay */}
      <div 
        className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Center Play/Pause Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            onClick={onPlayPause}
            variant="ghost"
            size="lg"
            className="w-20 h-20 bg-black/50 hover:bg-black/70 rounded-full transition-all duration-200 hover:scale-110"
          >
            {isPlaying ? (
              <Pause className="h-8 w-8 text-white" />
            ) : (
              <Play className="h-8 w-8 text-white ml-1" />
            )}
          </Button>
        </div>

        {/* Bottom Control Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
          <div className="surface-variant/90 backdrop-blur-sm rounded-lg p-4 space-y-3">
            
            {/* Progress Bar */}
            <div className="flex items-center space-x-3">
              <span className="text-xs on-surface-variant w-16 text-right">
                {formatTime(currentTime)}
              </span>
              <div 
                className="flex-1 relative cursor-pointer"
                onClick={handleProgressClick}
              >
                <div className="w-full h-1 bg-gray-600 rounded-full">
                  <div 
                    className="h-full bg-primary rounded-full relative transition-all duration-100"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  >
                    <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-lg"></div>
                  </div>
                </div>
              </div>
              <span className="text-xs on-surface-variant w-16">
                {formatTime(duration)}
              </span>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Play/Pause */}
                <Button
                  onClick={onPlayPause}
                  className="w-10 h-10 bg-primary hover:bg-blue-600 rounded-lg"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4 text-white" />
                  ) : (
                    <Play className="h-4 w-4 text-white" />
                  )}
                </Button>
                
                {/* Skip Buttons */}
                <Button
                  onClick={() => handleSkip(-10)}
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-gray-700 rounded-lg"
                >
                  <SkipBack className="h-4 w-4 on-surface-variant" />
                </Button>
                <Button
                  onClick={() => handleSkip(10)}
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-gray-700 rounded-lg"
                >
                  <SkipForward className="h-4 w-4 on-surface-variant" />
                </Button>
                
                {/* Volume Control */}
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => setMuted(!muted)}
                    variant="ghost"
                    size="sm"
                    className="p-2 hover:bg-gray-700 rounded-lg"
                  >
                    {muted ? (
                      <VolumeX className="h-4 w-4 on-surface-variant" />
                    ) : (
                      <Volume2 className="h-4 w-4 on-surface-variant" />
                    )}
                  </Button>
                  <div className="w-20 hidden md:block">
                    <Slider
                      value={[muted ? 0 : volume * 100]}
                      onValueChange={([value]) => {
                        setVolume(value / 100);
                        setMuted(value === 0);
                      }}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Playback Speed */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 hover:bg-gray-700 rounded-lg text-xs"
                    >
                      {playbackRate}x
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="surface-variant border-gray-600">
                    <DropdownMenuLabel className="on-surface">Playback Speed</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-600" />
                    {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                      <DropdownMenuItem
                        key={rate}
                        onClick={() => setPlaybackRate(rate)}
                        className="on-surface hover:bg-gray-700"
                      >
                        {rate}x {rate === 1 && '(Normal)'}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Audio/Subtitle Settings */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 hover:bg-gray-700 rounded-lg"
                    >
                      <Languages className="h-4 w-4 on-surface-variant" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="surface-variant border-gray-600 w-56">
                    <DropdownMenuLabel className="on-surface">Audio & Subtitles</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-600" />
                    
                    {/* Audio Tracks */}
                    <DropdownMenuLabel className="on-surface-variant text-xs">Audio Track</DropdownMenuLabel>
                    {getAudioTracks().length > 0 ? (
                      getAudioTracks().map((track) => (
                        <DropdownMenuItem
                          key={track.id}
                          onClick={() => setAudioTrack(track.id)}
                          className={`on-surface hover:bg-gray-700 ${track.enabled ? 'bg-gray-700' : ''}`}
                        >
                          {track.label} {track.language && `(${track.language})`}
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem className="on-surface-variant text-xs" disabled>
                        No audio tracks available
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuSeparator className="bg-gray-600" />
                    
                    {/* Subtitle Tracks */}
                    <DropdownMenuLabel className="on-surface-variant text-xs">Subtitles</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => setSubtitleTrack(null)}
                      className="on-surface hover:bg-gray-700"
                    >
                      Off
                    </DropdownMenuItem>
                    {getTextTracks().length > 0 ? (
                      getTextTracks().map((track) => (
                        <DropdownMenuItem
                          key={track.id}
                          onClick={() => setSubtitleTrack(track.id)}
                          className={`on-surface hover:bg-gray-700 ${track.mode === 'showing' ? 'bg-gray-700' : ''}`}
                        >
                          {track.label} {track.language && `(${track.language})`}
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem className="on-surface-variant text-xs" disabled>
                        No subtitles available
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Sync Status Indicator */}
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <span className="text-success text-xs hidden md:inline">Synced</span>
                </div>
                
                {/* Fullscreen */}
                <Button
                  onClick={toggleFullscreen}
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-gray-700 rounded-lg"
                >
                  <Maximize className="h-4 w-4 on-surface-variant" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
