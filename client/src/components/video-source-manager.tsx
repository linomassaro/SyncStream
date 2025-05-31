import { useState } from "react";
import { Plus, Trash2, Play, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { VideoSource } from "@shared/schema";

interface VideoSourceManagerProps {
  sources: VideoSource[];
  selectedSourceId: string | null;
  onAddSource: (url: string, title: string) => void;
  onRemoveSource: (sourceId: string) => void;
  onSelectSource: (sourceId: string) => void;
  onClose: () => void;
}

export function VideoSourceManager({
  sources,
  selectedSourceId,
  onAddSource,
  onRemoveSource,
  onSelectSource,
  onClose
}: VideoSourceManagerProps) {
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddSource = () => {
    if (!newUrl.trim()) return;
    
    setIsAdding(true);
    try {
      onAddSource(newUrl.trim(), newTitle.trim() || "Untitled Video");
      setNewUrl("");
      setNewTitle("");
    } finally {
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddSource();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] surface-variant border-gray-600 overflow-hidden">
        <CardHeader className="border-b border-gray-600">
          <div className="flex items-center justify-between">
            <CardTitle className="on-surface">Video Sources</CardTitle>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="hover:bg-gray-700"
            >
              ×
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Add New Source */}
          <div className="space-y-3 pb-4 border-b border-gray-600">
            <h3 className="text-sm font-medium on-surface">Add New Video Source</h3>
            <div className="space-y-2">
              <Input
                type="url"
                placeholder="Video URL (YouTube, direct link, etc.)"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                className="surface border-gray-600 on-surface placeholder-gray-400"
              />
              <Input
                type="text"
                placeholder="Video title (optional)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="surface border-gray-600 on-surface placeholder-gray-400"
              />
              <Button
                onClick={handleAddSource}
                disabled={!newUrl.trim() || isAdding}
                className="w-full bg-primary hover:bg-blue-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                {isAdding ? "Adding..." : "Add Source"}
              </Button>
            </div>
          </div>

          {/* Source List */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium on-surface">
              Available Sources ({sources.length})
            </h3>
            
            {sources.length === 0 ? (
              <div className="text-center py-8">
                <Play className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">No video sources added yet</p>
                <p className="text-gray-500 text-sm">Add your first video source above</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sources.map((source) => (
                  <div
                    key={source.id}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      selectedSourceId === source.id
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-600 surface hover:border-gray-500'
                    }`}
                    onClick={() => onSelectSource(source.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium on-surface truncate">
                            {source.title}
                          </h4>
                          {selectedSourceId === source.id && (
                            <Badge variant="default" className="bg-primary text-white">
                              <Check className="h-3 w-3 mr-1" />
                              Playing
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs on-surface-variant truncate">
                          {source.url}
                        </p>
                        {source.addedBy && (
                          <p className="text-xs text-gray-500 mt-1">
                            Added by {source.addedBy}
                          </p>
                        )}
                      </div>
                      
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveSource(source.id);
                        }}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}