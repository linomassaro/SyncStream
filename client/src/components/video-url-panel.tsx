import { useState } from "react";
import { X, Play, Youtube, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isValidVideoUrl, getVideoType, normalizeVideoUrl } from "@/lib/video-utils";

interface VideoUrlPanelProps {
  onVideoLoad: (url: string) => void;
  onClose: () => void;
}

export function VideoUrlPanel({ onVideoLoad, onClose }: VideoUrlPanelProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLoadVideo = async () => {
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
      const normalizedUrl = normalizeVideoUrl(url);
      onVideoLoad(normalizedUrl);
    } catch (error) {
      setError("Failed to load video. Please check the URL and try again.");
    } finally {
      setIsLoading(false);
    }
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
    <div className="fixed top-20 right-4 surface-variant rounded-lg shadow-xl border border-gray-700 p-4 w-80 z-40">
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
        
        {/* Example URLs */}
        <div className="border-t border-gray-600 pt-3">
          <span className="text-xs on-surface-variant">Supported formats:</span>
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
        </div>
      </div>
    </div>
  );
}
