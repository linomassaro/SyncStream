import { useState } from "react";
import { X, Plus, Play, Trash2, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { isValidVideoUrl, getVideoType } from "@/lib/video-utils";
import type { VideoSource } from "@shared/schema";

interface VideoSourceManagerProps {
  videoSources: VideoSource[];
  selectedSourceId: string;
  onSourceAdd: (source: VideoSource) => void;
  onSourceRemove: (sourceId: string) => void;
  onSourceSelect: (sourceId: string) => void;
  onClose: () => void;
}

export function VideoSourceManager({
  videoSources,
  selectedSourceId,
  onSourceAdd,
  onSourceRemove,
  onSourceSelect,
  onClose
}: VideoSourceManagerProps) {
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newQuality, setNewQuality] = useState("");
  const [newLanguage, setNewLanguage] = useState("");
  const [error, setError] = useState("");

  const handleAddSource = () => {
    if (!newUrl.trim()) {
      setError("Please enter a video URL");
      return;
    }

    if (!isValidVideoUrl(newUrl)) {
      setError("Please enter a valid video URL");
      return;
    }

    if (!newTitle.trim()) {
      setError("Please enter a title for this source");
      return;
    }

    const newSource: VideoSource = {
      id: Date.now().toString(),
      url: newUrl.trim(),
      title: newTitle.trim(),
      quality: newQuality.trim() || undefined,
      language: newLanguage.trim() || undefined
    };

    onSourceAdd(newSource);
    
    // Reset form
    setNewUrl("");
    setNewTitle("");
    setNewQuality("");
    setNewLanguage("");
    setError("");
  };

  const videoType = getVideoType(newUrl);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="surface-variant rounded-lg shadow-xl border border-gray-700 p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold on-surface">Video Sources</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-gray-700 rounded"
          >
            <X className="h-5 w-5 on-surface-variant" />
          </Button>
        </div>

        {/* Current Sources */}
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-medium on-surface">Available Sources</h3>
          {videoSources.length === 0 ? (
            <p className="text-center on-surface-variant py-8">
              No video sources added yet. Add your first source below.
            </p>
          ) : (
            <div className="space-y-3">
              {videoSources.map((source) => (
                <div
                  key={source.id}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    selectedSourceId === source.id
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                  onClick={() => onSourceSelect(source.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium on-surface">{source.title}</h4>
                        {selectedSourceId === source.id && (
                          <Badge variant="secondary" className="bg-primary text-white">
                            <Monitor className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                        {source.quality && (
                          <Badge variant="outline" className="border-gray-500 text-gray-300">
                            {source.quality}
                          </Badge>
                        )}
                        {source.language && (
                          <Badge variant="outline" className="border-gray-500 text-gray-300">
                            {source.language}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm on-surface-variant mt-1 truncate">
                        {source.url}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSourceSelect(source.id);
                        }}
                        variant="ghost"
                        size="sm"
                        className="p-2 hover:bg-gray-700"
                        title="Select this source"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSourceRemove(source.id);
                        }}
                        variant="ghost"
                        size="sm"
                        className="p-2 hover:bg-red-600 text-red-400"
                        title="Remove source"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add New Source */}
        <div className="border-t border-gray-600 pt-6">
          <h3 className="text-lg font-medium on-surface mb-4">Add New Source</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm on-surface-variant mb-2">Video URL *</label>
              <Input
                type="url"
                placeholder="YouTube URL or direct video link"
                value={newUrl}
                onChange={(e) => {
                  setNewUrl(e.target.value);
                  setError("");
                }}
                className="w-full surface border-gray-600 on-surface"
              />
            </div>

            <div>
              <label className="block text-sm on-surface-variant mb-2">Title *</label>
              <Input
                type="text"
                placeholder="e.g., English Version, HD Quality, etc."
                value={newTitle}
                onChange={(e) => {
                  setNewTitle(e.target.value);
                  setError("");
                }}
                className="w-full surface border-gray-600 on-surface"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm on-surface-variant mb-2">Quality (optional)</label>
                <Input
                  type="text"
                  placeholder="e.g., 1080p, 4K, HD"
                  value={newQuality}
                  onChange={(e) => setNewQuality(e.target.value)}
                  className="w-full surface border-gray-600 on-surface"
                />
              </div>
              <div>
                <label className="block text-sm on-surface-variant mb-2">Language (optional)</label>
                <Input
                  type="text"
                  placeholder="e.g., English, French, Spanish"
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  className="w-full surface border-gray-600 on-surface"
                />
              </div>
            </div>

            {error && (
              <p className="text-error text-sm">{error}</p>
            )}

            <Button
              onClick={handleAddSource}
              className="w-full bg-primary hover:bg-blue-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Source
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="border-t border-gray-600 pt-4 mt-6">
          <p className="text-xs on-surface-variant">
            💡 Add multiple sources of the same content (different qualities, languages, or platforms). 
            All viewers will stay synchronized regardless of which source they choose.
          </p>
        </div>
      </div>
    </div>
  );
}