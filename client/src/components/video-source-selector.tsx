import { Globe, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { VideoSource } from "@shared/schema";

interface VideoSourceSelectorProps {
  videoSources: VideoSource[];
  selectedSourceId: string | null;
  onSourceSelect: (sourceId: string) => void;
}

export function VideoSourceSelector({ videoSources, selectedSourceId, onSourceSelect }: VideoSourceSelectorProps) {
  if (videoSources.length === 0) return null;

  const selectedSource = videoSources.find(source => source.id === selectedSourceId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="p-2 hover:bg-gray-700 rounded-lg"
          title="Select video source"
        >
          <Globe className="h-4 w-4 on-surface-variant" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="surface-variant border-gray-600 min-w-[200px]">
        <DropdownMenuLabel className="on-surface">Video Sources</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-600" />
        {videoSources.map((source) => (
          <DropdownMenuItem
            key={source.id}
            onClick={() => onSourceSelect(source.id)}
            className={`on-surface hover:bg-gray-700 ${
              selectedSourceId === source.id ? 'bg-gray-700' : ''
            }`}
          >
            <div className="flex items-center space-x-2 w-full">
              <Play className="h-3 w-3 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{source.title}</div>
                {source.language && (
                  <div className="text-xs on-surface-variant">{source.language}</div>
                )}
              </div>
              {selectedSourceId === source.id && (
                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}