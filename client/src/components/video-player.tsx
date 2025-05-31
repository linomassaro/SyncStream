import { useState, useRef, useEffect } from "react";
import ReactPlayer from "react-player";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize, Settings, Languages, Subtitles } from "lucide-react";
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
  const [audioTracks, setAudioTracks] = useState<any[]>([]);
  const [subtitleTracks, setSubtitleTracks] = useState<any[]>([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<string>('');
  const [selectedSubtitleTrack, setSelectedSubtitleTrack] = useState<string>('off');
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

  // Handle video ready event to get available tracks
  const handleReady = () => {
    if (playerRef.current) {
      const player = playerRef.current.getInternalPlayer();
      
      // For YouTube videos
      if (player && typeof player.getAvailableAudioTracks === 'function') {
        try {
          const audioTracks = player.getAvailableAudioTracks() || [];
          setAudioTracks(audioTracks);
        } catch (error) {
          console.log('Audio tracks not available');
        }
      }
      
      // For videos with subtitle tracks
      if (player && typeof player.getOption === 'function') {
        try {
          const captions = player.getOption('captions', 'tracklist') || [];
          setSubtitleTracks(captions);
        } catch (error) {
          console.log('Subtitle tracks not available');
        }
      }
      
      // For HTML5 video element (direct video files)
      if (player && player.tagName === 'VIDEO') {
        // Check for audio tracks
        if (player.audioTracks && player.audioTracks.length > 1) {
          const audioTracks = Array.from(player.audioTracks).map((track: any, index: number) => ({
            id: index.toString(),
            label: track.label || track.language || `Audio ${index + 1}`,
            language: track.language,
            enabled: track.enabled
          }));
          setAudioTracks(audioTracks);
        }
        
        // Check for subtitle tracks
        if (player.textTracks && player.textTracks.length > 0) {
          const tracks = Array.from(player.textTracks).map((track: any, index: number) => ({
            id: index.toString(),
            label: track.label || track.language || `Subtitle ${index + 1}`,
            language: track.language,
            kind: track.kind
          }));
          setSubtitleTracks(tracks);
        }
        
        // For .mkv files, try to detect embedded tracks
        setTimeout(() => {
          if (player.audioTracks && player.audioTracks.length > 1) {
            const audioTracks = Array.from(player.audioTracks).map((track: any, index: number) => ({
              id: index.toString(),
              label: track.label || track.language || `Audio ${index + 1}`,
              language: track.language,
              enabled: track.enabled
            }));
            setAudioTracks(audioTracks);
          }
          
          if (player.textTracks && player.textTracks.length > 0) {
            const tracks = Array.from(player.textTracks).map((track: any, index: number) => ({
              id: index.toString(),
              label: track.label || track.language || `Subtitle ${index + 1}`,
              language: track.language,
              kind: track.kind
            }));
            setSubtitleTracks(tracks);
          }
        }, 1000);
      }
    }
  };

  const handleAudioTrackChange = (trackId: string) => {
    setSelectedAudioTrack(trackId);
    if (playerRef.current) {
      const player = playerRef.current.getInternalPlayer();
      
      // For YouTube videos
      if (player && typeof player.setAudioTrack === 'function') {
        player.setAudioTrack(trackId);
      }
      
      // For HTML5 video element (direct files)
      if (player && player.tagName === 'VIDEO' && player.audioTracks) {
        const trackIndex = parseInt(trackId);
        Array.from(player.audioTracks).forEach((track: any, index: number) => {
          track.enabled = index === trackIndex;
        });
      }
    }
  };

  const handleSubtitleTrackChange = (trackId: string) => {
    setSelectedSubtitleTrack(trackId);
    if (playerRef.current) {
      const player = playerRef.current.getInternalPlayer();
      
      // For YouTube videos
      if (player && typeof player.setOption === 'function') {
        if (trackId === 'off') {
          player.setOption('captions', 'reload', true);
          player.setOption('captions', 'displaySettings', {});
        } else {
          player.setOption('captions', 'track', { languageCode: trackId });
        }
      }
      
      // For HTML5 video element
      if (player && player.textTracks) {
        Array.from(player.textTracks).forEach((track: any, index: number) => {
          if (index.toString() === trackId) {
            track.mode = 'showing';
          } else {
            track.mode = 'hidden';
          }
        });
      }
    }
  };

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
            onReady={handleReady}
            config={{
              youtube: {
                playerVars: {
                  showinfo: 0,
                  controls: 0,
                  modestbranding: 1,
                  rel: 0,
                  cc_load_policy: 1 // Enable captions
                }
              },
              file: {
                tracks: subtitleTracks.map((track, index) => ({
                  kind: 'subtitles',
                  src: track.src,
                  srcLang: track.language || 'en',
                  label: track.label || `Track ${index + 1}`,
                  default: selectedSubtitleTrack === track.id
                }))
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
                {/* Audio Track Selection */}
                {audioTracks.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 hover:bg-gray-700 rounded-lg"
                        title="Audio tracks"
                      >
                        <Languages className="h-4 w-4 on-surface-variant" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="surface-variant border-gray-600">
                      <DropdownMenuLabel className="on-surface">Audio Tracks</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-gray-600" />
                      {audioTracks.map((track, index) => (
                        <DropdownMenuItem
                          key={track.id || index}
                          onClick={() => handleAudioTrackChange(track.id || index.toString())}
                          className={`on-surface hover:bg-gray-700 ${
                            selectedAudioTrack === (track.id || index.toString()) ? 'bg-gray-700' : ''
                          }`}
                        >
                          {track.label || track.language || `Track ${index + 1}`}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* Subtitle Track Selection */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 hover:bg-gray-700 rounded-lg"
                      title="Subtitles"
                    >
                      <Subtitles className="h-4 w-4 on-surface-variant" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="surface-variant border-gray-600">
                    <DropdownMenuLabel className="on-surface">Subtitles</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-600" />
                    <DropdownMenuItem
                      onClick={() => handleSubtitleTrackChange('off')}
                      className={`on-surface hover:bg-gray-700 ${
                        selectedSubtitleTrack === 'off' ? 'bg-gray-700' : ''
                      }`}
                    >
                      Off
                    </DropdownMenuItem>
                    {subtitleTracks.map((track, index) => (
                      <DropdownMenuItem
                        key={track.id || index}
                        onClick={() => handleSubtitleTrackChange(track.id || index.toString())}
                        className={`on-surface hover:bg-gray-700 ${
                          selectedSubtitleTrack === (track.id || index.toString()) ? 'bg-gray-700' : ''
                        }`}
                      >
                        {track.label || track.language || `Track ${index + 1}`}
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
