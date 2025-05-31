import { useState } from "react";
import { Plus, Trash2, Play, Check, Clock, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { VideoSource } from "@shared/schema";

interface VideoSourceManagerProps {
  sources: VideoSource[];
  selectedSourceId: string | null;
  onAddSource: (url: string, title: string, delay?: number) => void;
  onRemoveSource: (sourceId: string) => void;
  onSelectSource: (sourceId: string) => void;
  onUpdateSourceDelay: (sourceId: string, delay: number) => void;
  onClose: () => void;
}

export function VideoSourceManager({
  sources,
  selectedSourceId,
  onAddSource,
  onRemoveSource,
  onSelectSource,
  onUpdateSourceDelay,
  onClose
}: VideoSourceManagerProps) {
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDelay, setNewDelay] = useState("0");
  const [isAdding, setIsAdding] = useState(false);
  const [editingDelayId, setEditingDelayId] = useState<string | null>(null);
  const [editDelay, setEditDelay] = useState("0");

  const handleAddSource = () => {
    if (!newUrl.trim()) return;
    
    setIsAdding(true);
    try {
      const delay = parseFloat(newDelay) || 0;
      onAddSource(newUrl.trim(), newTitle.trim() || "Untitled Video", delay);
      setNewUrl("");
      setNewTitle("");
      setNewDelay("0");
    } finally {
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddSource();
    }
  };

  const handleEditDelay = (sourceId: string, currentDelay: number) => {
    setEditingDelayId(sourceId);
    setEditDelay(currentDelay.toString());
  };

  const handleSaveDelay = (sourceId: string) => {
    const delay = parseFloat(editDelay) || 0;
    onUpdateSourceDelay(sourceId, delay);
    setEditingDelayId(null);
    setEditDelay("0");
  };

  const handleCancelEdit = () => {
    setEditingDelayId(null);
    setEditDelay("0");
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
              <Input
                type="number"
                placeholder="Delay in seconds (e.g., -2.5, 0, 3)"
                value={newDelay}
                onChange={(e) => setNewDelay(e.target.value)}
                onKeyDown={handleKeyDown}
                step="0.1"
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
                        <div className="flex items-center gap-2 mt-1">
                          {source.addedBy && (
                            <p className="text-xs text-gray-500">
                              Added by {source.addedBy}
                            </p>
                          )}
                          {editingDelayId === source.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                value={editDelay}
                                onChange={(e) => setEditDelay(e.target.value)}
                                className="h-6 w-16 text-xs"
                                step="0.1"
                              />
                              <Button
                                onClick={() => handleSaveDelay(source.id)}
                                size="sm"
                                className="h-6 px-2 text-xs"
                              >
                                ✓
                              </Button>
                              <Button
                                onClick={handleCancelEdit}
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-xs"
                              >
                                ✕
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-gray-500" />
                              <span className="text-xs text-gray-500">
                                {source.delay ? `${source.delay > 0 ? '+' : ''}${source.delay}s` : '0s'}
                              </span>
                              <Button
                                onClick={() => handleEditDelay(source.id, source.delay || 0)}
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0 text-gray-500 hover:text-gray-300"
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
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