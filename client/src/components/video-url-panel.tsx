import { useState } from "react";
import { X, Play, Youtube, Link, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isValidVideoUrl, getVideoType } from "@/lib/video-utils";
import { nanoid } from "nanoid";
import type { VideoSource } from "@shared/schema";

interface VideoUrlPanelProps {
  onVideoLoad: (url: string, sources?: VideoSource[]) => void;
  onClose: () => void;
}

export function VideoUrlPanel({ onVideoLoad, onClose }: VideoUrlPanelProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [videoSources, setVideoSources] = useState<VideoSource[]>([]);
  const [showMultipleSources, setShowMultipleSources] = useState(false);

  const handleLoadVideo = async () => {
    if (showMultipleSources) {
      if (videoSources.length === 0) {
        setError("Please add at least one video source");
        return;
      }

      const invalidSources = videoSources.filter(source => !isValidVideoUrl(source.url));
      if (invalidSources.length > 0) {
        setError("Please check that all video URLs are valid");
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        // Use first source as primary URL for compatibility
        onVideoLoad(videoSources[0].url, videoSources);
      } catch (error) {
        setError("Failed to load video sources. Please check the URLs and try again.");
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!url.trim()) {
        setError("Please enter a video URL");
        return;
      }

      if (!isValidVideoUrl(url)) {
        setError("Please enter a valid YouTube URL or direct video link");
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        onVideoLoad(url.trim());
      } catch (error) {
        setError("Failed to load video. Please check the URL and try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const addVideoSource = () => {
    if (!url.trim()) {
      setError("Please enter a video URL");
      return;
    }

    if (!isValidVideoUrl(url)) {
      setError("Please enter a valid video URL");
      return;
    }

    const newSource: VideoSource = {
      id: nanoid(),
      url: url.trim(),
      title: `Source ${videoSources.length + 1}`,
      language: "",
      delay: 0
    };

    setVideoSources([...videoSources, newSource]);
    setUrl("");
    setError("");
  };

  const removeVideoSource = (id: string) => {
    setVideoSources(videoSources.filter(source => source.id !== id));
  };

  const updateVideoSource = (id: string, field: keyof VideoSource, value: string | number) => {
    setVideoSources(videoSources.map(source => 
      source.id === id ? { ...source, [field]: value } : source
    ));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setError("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLoadVideo();
    }
  };

  const videoType = getVideoType(url);

  return (
    <div className="fixed top-20 right-4 surface-variant rounded-lg shadow-xl border border-gray-700 p-4 w-96 z-40 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium on-surface">Load Video</h3>
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="p-1 hover:bg-gray-700 rounded"
        >
          <X className="h-4 w-4 on-surface-variant" />
        </Button>
      </div>
      
      <div className="space-y-3">
        {/* Toggle between single and multiple sources */}
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setShowMultipleSources(false)}
            variant={!showMultipleSources ? "default" : "ghost"}
            size="sm"
            className="flex-1"
          >
            Single Video
          </Button>
          <Button
            onClick={() => setShowMultipleSources(true)}
            variant={showMultipleSources ? "default" : "ghost"}
            size="sm"
            className="flex-1"
          >
            Multiple Sources
          </Button>
        </div>

        {showMultipleSources ? (
          /* Multiple Sources Mode */
          <div className="space-y-3">
            <div>
              <label className="block text-sm on-surface-variant mb-2">Add Video Source</label>
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <Input
                    type="url"
                    placeholder="Video URL"
                    value={url}
                    onChange={handleInputChange}
                    onKeyDown={(e) => e.key === 'Enter' && addVideoSource()}
                    className="w-full surface border-gray-600 on-surface placeholder-gray-400 focus:ring-primary focus:border-primary"
                  />
                </div>
                <Button
                  onClick={addVideoSource}
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-gray-700 rounded-lg"
                  disabled={!url.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Video Sources List */}
            {videoSources.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm on-surface-variant">Video Sources:</label>
                {videoSources.map((source, index) => (
                  <div key={source.id} className="surface p-3 rounded border border-gray-600 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium on-surface">Source {index + 1}</span>
                      <Button
                        onClick={() => removeVideoSource(source.id)}
                        variant="ghost"
                        size="sm"
                        className="p-1 hover:bg-gray-700 rounded text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Title (e.g., English, French)"
                      value={source.title}
                      onChange={(e) => updateVideoSource(source.id, 'title', e.target.value)}
                      className="text-xs surface border-gray-600 on-surface placeholder-gray-400"
                    />
                    <Input
                      placeholder="Language (optional)"
                      value={source.language || ''}
                      onChange={(e) => updateVideoSource(source.id, 'language', e.target.value)}
                      className="text-xs surface border-gray-600 on-surface placeholder-gray-400"
                    />
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Delay (seconds)"
                          value={source.delay || 0}
                          onChange={(e) => updateVideoSource(source.id, 'delay', parseFloat(e.target.value) || 0)}
                          className="text-xs surface border-gray-600 on-surface placeholder-gray-400"
                        />
                      </div>
                      <div className="text-xs on-surface-variant self-center">
                        {(source.delay || 0) > 0 ? `+${source.delay}s` : (source.delay || 0) < 0 ? `${source.delay}s` : '0s'}
                      </div>
                    </div>
                    <div className="text-xs on-surface-variant truncate">
                      {source.url}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <p className="text-error text-xs">{error}</p>
            )}

            <Button
              onClick={handleLoadVideo}
              disabled={isLoading || videoSources.length === 0}
              className="w-full bg-primary hover:bg-blue-600 text-white"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Loading...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Load {videoSources.length} Source{videoSources.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        ) : (
          /* Single Video Mode */
          <div className="space-y-3">
            <div>
              <label className="block text-sm on-surface-variant mb-2">Video URL</label>
              <div className="relative">
                <Input
                  type="url"
                  placeholder="YouTube URL or direct video link"
                  value={url}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="w-full surface border-gray-600 on-surface placeholder-gray-400 focus:ring-primary focus:border-primary pr-10"
                />
                {url && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {videoType === 'youtube' ? (
                      <Youtube className="h-4 w-4 text-red-500" />
                    ) : videoType === 'direct' ? (
                      <Link className="h-4 w-4 text-blue-500" />
                    ) : null}
                  </div>
                )}
              </div>
              {error && (
                <p className="text-error text-xs mt-1">{error}</p>
              )}
            </div>
            
            <Button
              onClick={handleLoadVideo}
              disabled={isLoading || !url.trim()}
              className="w-full bg-primary hover:bg-blue-600 text-white"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Loading...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Load & Sync
                </>
              )}
            </Button>
          </div>
        )}
        
        {/* Example URLs */}
        <div className="border-t border-gray-600 pt-3">
          <span className="text-xs on-surface-variant">
            {showMultipleSources ? 'Add multiple video sources with different languages' : 'Supported formats:'}
          </span>
          {!showMultipleSources && (
            <div className="mt-2 space-y-1">
              <div className="text-xs on-surface-variant">
                • YouTube videos
              </div>
              <div className="text-xs on-surface-variant">
                • Direct video links (MP4, WebM, etc.)
              </div>
              <div className="text-xs on-surface-variant">
                • Vimeo, Dailymotion, and more
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
