import { useState, useRef, useEffect } from "react";
import ReactPlayer from "react-player";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize, Settings, AudioLines, Subtitles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  const [showSettings, setShowSettings] = useState(false);
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

  // Handle audio track switching
  useEffect(() => {
    const player = playerRef.current;
    if (player && player.getInternalPlayer && selectedAudioTrack) {
      const internalPlayer = player.getInternalPlayer();
      if (internalPlayer && internalPlayer.audioTracks) {
        const tracks = internalPlayer.audioTracks;
        for (let i = 0; i < tracks.length; i++) {
          tracks[i].enabled = tracks[i].id === selectedAudioTrack || i.toString() === selectedAudioTrack;
        }
      }
    }
  }, [selectedAudioTrack]);

  // Handle subtitle track switching
  useEffect(() => {
    const player = playerRef.current;
    if (player && player.getInternalPlayer && selectedSubtitleTrack) {
      const internalPlayer = player.getInternalPlayer();
      if (internalPlayer && internalPlayer.textTracks) {
        const tracks = internalPlayer.textTracks;
        for (let i = 0; i < tracks.length; i++) {
          if (selectedSubtitleTrack === 'off') {
            tracks[i].mode = 'disabled';
          } else {
            tracks[i].mode = tracks[i].id === selectedSubtitleTrack || i.toString() === selectedSubtitleTrack ? 'showing' : 'disabled';
          }
        }
      }
    }
  }, [selectedSubtitleTrack]);

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
            onReady={() => {
              // Get available tracks when video is ready
              const player = playerRef.current;
              if (player && player.getInternalPlayer) {
                const internalPlayer = player.getInternalPlayer();
                if (internalPlayer && internalPlayer.videoTracks) {
                  // Get audio tracks
                  const audioTracks = internalPlayer.audioTracks || [];
                  setAudioTracks(Array.from(audioTracks));
                  
                  // Get subtitle tracks
                  const textTracks = internalPlayer.textTracks || [];
                  setSubtitleTracks(Array.from(textTracks));
                }
              }
            }}
            config={{
              file: {
                attributes: {
                  crossOrigin: 'anonymous',
                  preload: 'metadata',
                  // Force audio loading for MKV files
                  onLoadedMetadata: (e: any) => {
                    const video = e.target;
                    if (video.audioTracks && video.audioTracks.length > 0) {
                      setAudioTracks(Array.from(video.audioTracks));
                      // Enable first audio track by default
                      video.audioTracks[0].enabled = true;
                    }
                    if (video.textTracks && video.textTracks.length > 0) {
                      setSubtitleTracks(Array.from(video.textTracks));
                    }
                  }
                },
                tracks: subtitleTracks.map((track, index) => ({
                  kind: 'subtitles',
                  src: track.src || '',
                  srcLang: track.language || 'en',
                  label: track.label || `Track ${index + 1}`,
                  default: selectedSubtitleTrack === track.id
                })),
                forceAudio: true,
                forceHLS: false,
                forceDASH: false
              },
              youtube: {
                playerVars: {
                  showinfo: 0,
                  controls: 0,
                  modestbranding: 1,
                  rel: 0
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
                {/* Audio/Subtitle Settings */}
                <Popover open={showSettings} onOpenChange={setShowSettings}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 hover:bg-gray-700 rounded-lg"
                    >
                      <Settings className="h-4 w-4 on-surface-variant" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 surface-variant border-gray-600" align="end">
                    <div className="space-y-4">
                      <h4 className="font-medium on-surface">Audio & Subtitles</h4>
                      
                      {/* Audio Track Selection */}
                      <div className="space-y-2">
                        <label className="text-sm on-surface-variant flex items-center gap-2">
                          <AudioLines className="h-4 w-4" />
                          Audio Track
                        </label>
                        <Select value={selectedAudioTrack} onValueChange={setSelectedAudioTrack}>
                          <SelectTrigger className="surface border-gray-600">
                            <SelectValue placeholder="Select audio track" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default</SelectItem>
                            {audioTracks.map((track, index) => (
                              <SelectItem key={index} value={track.id || index.toString()}>
                                {track.label || track.language || `Track ${index + 1}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Subtitle Track Selection */}
                      <div className="space-y-2">
                        <label className="text-sm on-surface-variant flex items-center gap-2">
                          <Subtitles className="h-4 w-4" />
                          Subtitles
                        </label>
                        <Select value={selectedSubtitleTrack} onValueChange={setSelectedSubtitleTrack}>
                          <SelectTrigger className="surface border-gray-600">
                            <SelectValue placeholder="Select subtitles" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="off">Off</SelectItem>
                            {subtitleTracks.map((track, index) => (
                              <SelectItem key={index} value={track.id || index.toString()}>
                                {track.label || track.language || `Subtitle ${index + 1}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

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
