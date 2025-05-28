import { useState, useRef, useEffect } from "react";
import ReactPlayer from "react-player";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize, Settings, Languages, AudioLines } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";

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
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<number>(0);
  const [selectedSubtitleTrack, setSelectedSubtitleTrack] = useState<number>(-1); // -1 means no subtitles
  const [availableAudioTracks, setAvailableAudioTracks] = useState<any[]>([]);
  const [availableSubtitleTracks, setAvailableSubtitleTracks] = useState<any[]>([]);
  const playerRef = useRef<ReactPlayer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

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

  // Handle video metadata when video loads
  const handleVideoReady = () => {
    if (playerRef.current && playerRef.current.getInternalPlayer) {
      const internalPlayer = playerRef.current.getInternalPlayer();
      
      // Reset tracks
      setAvailableAudioTracks([]);
      setAvailableSubtitleTracks([]);
      
      // Use setTimeout to allow the video element to fully load
      setTimeout(() => {
        // For HTML5 video elements, we can access audio and text tracks
        if (internalPlayer && internalPlayer.audioTracks && internalPlayer.audioTracks.length > 0) {
          const audioTracks = Array.from(internalPlayer.audioTracks).map((track: any, index: number) => ({
            index,
            label: track.label || track.language || `Audio Track ${index + 1}`,
            language: track.language,
            enabled: track.enabled
          }));
          setAvailableAudioTracks(audioTracks);
        }

        if (internalPlayer && internalPlayer.textTracks && internalPlayer.textTracks.length > 0) {
          const textTracks = Array.from(internalPlayer.textTracks)
            .filter((track: any) => track.kind === 'subtitles' || track.kind === 'captions')
            .map((track: any, index: number) => ({
              index,
              label: track.label || track.language || `${track.kind === 'captions' ? 'Caption' : 'Subtitle'} Track ${index + 1}`,
              language: track.language,
              kind: track.kind
            }));
          setAvailableSubtitleTracks(textTracks);
        }
      }, 1000);
    }
  };

  // Handle audio track selection
  const handleAudioTrackChange = (trackIndex: number) => {
    setSelectedAudioTrack(trackIndex);
    if (playerRef.current && playerRef.current.getInternalPlayer) {
      const internalPlayer = playerRef.current.getInternalPlayer();
      if (internalPlayer && internalPlayer.audioTracks) {
        Array.from(internalPlayer.audioTracks).forEach((track: any, index: number) => {
          track.enabled = index === trackIndex;
        });
      }
    }
  };

  // Handle subtitle track selection
  const handleSubtitleTrackChange = (trackIndex: number) => {
    setSelectedSubtitleTrack(trackIndex);
    if (playerRef.current && playerRef.current.getInternalPlayer) {
      const internalPlayer = playerRef.current.getInternalPlayer();
      if (internalPlayer && internalPlayer.textTracks) {
        Array.from(internalPlayer.textTracks).forEach((track: any, index: number) => {
          track.mode = index === trackIndex ? 'showing' : 'hidden';
        });
      }
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
            width="100%"
            height="100%"
            onProgress={({ played }) => onProgress(played)}
            onDuration={onDuration}
            onReady={handleVideoReady}
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
                  crossOrigin: 'anonymous'
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
                {/* Audio & Subtitle Settings */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 hover:bg-gray-700 rounded-lg"
                    >
                      <Settings className="h-4 w-4 on-surface-variant" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 surface-variant border-gray-600" align="end">
                    {/* Audio Tracks */}
                    {availableAudioTracks.length > 0 && (
                      <>
                        <DropdownMenuLabel className="flex items-center space-x-2">
                          <AudioLines className="h-4 w-4" />
                          <span>Audio Track</span>
                        </DropdownMenuLabel>
                        {availableAudioTracks.map((track) => (
                          <DropdownMenuItem
                            key={track.index}
                            onClick={() => handleAudioTrackChange(track.index)}
                            className={`cursor-pointer ${
                              selectedAudioTrack === track.index 
                                ? 'bg-primary text-white' 
                                : 'hover:bg-gray-700'
                            }`}
                          >
                            {track.label}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator className="border-gray-600" />
                      </>
                    )}
                    
                    {/* Subtitle Tracks */}
                    <DropdownMenuLabel className="flex items-center space-x-2">
                      <Languages className="h-4 w-4" />
                      <span>Subtitles</span>
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => handleSubtitleTrackChange(-1)}
                      className={`cursor-pointer ${
                        selectedSubtitleTrack === -1 
                          ? 'bg-primary text-white' 
                          : 'hover:bg-gray-700'
                      }`}
                    >
                      Off
                    </DropdownMenuItem>
                    {availableSubtitleTracks.map((track) => (
                      <DropdownMenuItem
                        key={track.index}
                        onClick={() => handleSubtitleTrackChange(track.index)}
                        className={`cursor-pointer ${
                          selectedSubtitleTrack === track.index 
                            ? 'bg-primary text-white' 
                            : 'hover:bg-gray-700'
                        }`}
                      >
                        {track.label}
                      </DropdownMenuItem>
                    ))}
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
