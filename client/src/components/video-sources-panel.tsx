import { useState } from "react";
import { X, Plus, Trash2, Globe, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nanoid } from "nanoid";
import type { VideoSource } from "@shared/schema";

interface VideoSourcesPanelProps {
  videoSources: VideoSource[];
  onSourcesUpdate: (sources: VideoSource[]) => void;
  onClose: () => void;
}

export function VideoSourcesPanel({ videoSources, onSourcesUpdate, onClose }: VideoSourcesPanelProps) {
  const [sources, setSources] = useState<VideoSource[]>(videoSources);
  const [newSource, setNewSource] = useState({ url: '', title: '', language: '' });

  const handleAddSource = () => {
    if (!newSource.url.trim() || !newSource.title.trim()) return;

    const source: VideoSource = {
      id: nanoid(),
      url: newSource.url.trim(),
      title: newSource.title.trim(),
      language: newSource.language.trim() || undefined
    };

    const updatedSources = [...sources, source];
    setSources(updatedSources);
    setNewSource({ url: '', title: '', language: '' });
  };

  const handleRemoveSource = (sourceId: string) => {
    const updatedSources = sources.filter(source => source.id !== sourceId);
    setSources(updatedSources);
  };

  const handleSave = () => {
    onSourcesUpdate(sources);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="surface-variant rounded-lg shadow-xl border border-gray-700 p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold on-surface">Manage Video Sources</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-gray-700 rounded"
          >
            <X className="h-4 w-4 on-surface-variant" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Add New Source */}
          <div className="border border-gray-600 rounded-lg p-4 space-y-4">
            <h3 className="font-medium on-surface">Add New Video Source</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title" className="text-sm on-surface-variant">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., French Version, English Dub"
                  value={newSource.title}
                  onChange={(e) => setNewSource(prev => ({ ...prev, title: e.target.value }))}
                  className="surface border-gray-600 on-surface"
                />
              </div>
              
              <div>
                <Label htmlFor="language" className="text-sm on-surface-variant">Language (optional)</Label>
                <Input
                  id="language"
                  placeholder="e.g., French, English, Spanish"
                  value={newSource.language}
                  onChange={(e) => setNewSource(prev => ({ ...prev, language: e.target.value }))}
                  className="surface border-gray-600 on-surface"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="url" className="text-sm on-surface-variant">Video URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="YouTube URL or direct video link"
                value={newSource.url}
                onChange={(e) => setNewSource(prev => ({ ...prev, url: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSource()}
                className="surface border-gray-600 on-surface"
              />
            </div>
            
            <Button
              onClick={handleAddSource}
              disabled={!newSource.url.trim() || !newSource.title.trim()}
              className="w-full bg-primary hover:bg-blue-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Source
            </Button>
          </div>

          {/* Existing Sources */}
          {sources.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium on-surface">Current Sources ({sources.length})</h3>
              
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="border border-gray-600 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Play className="h-4 w-4 text-primary" />
                      <span className="font-medium on-surface">{source.title}</span>
                      {source.language && (
                        <span className="flex items-center space-x-1 text-xs on-surface-variant">
                          <Globe className="h-3 w-3" />
                          <span>{source.language}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs on-surface-variant truncate">{source.url}</p>
                  </div>
                  
                  <Button
                    onClick={() => handleRemoveSource(source.id)}
                    variant="ghost"
                    size="sm"
                    className="p-2 hover:bg-red-700 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-600">
            <Button
              onClick={onClose}
              variant="ghost"
              className="hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-primary hover:bg-blue-600 text-white"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}