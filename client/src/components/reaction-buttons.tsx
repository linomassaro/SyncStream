import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Smile } from "lucide-react";

interface ReactionButtonsProps {
  onReaction: (emoji: string) => void;
}

const EMOJI_REACTIONS = [
  "🔥", // fire
  "❤️", // heart
  "😂", // laugh
  "👏", // clap
  "😮", // wow
  "👍", // thumbs up
  "👎", // thumbs down
  "😢", // sad
];

export function ReactionButtons({ onReaction }: ReactionButtonsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="p-2 hover:bg-gray-700 rounded-lg"
          title="React"
        >
          <Smile className="h-4 w-4 on-surface-variant" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="surface-variant border-gray-600">
        <div className="grid grid-cols-4 gap-1 p-2">
          {EMOJI_REACTIONS.map((emoji) => (
            <DropdownMenuItem
              key={emoji}
              onClick={() => onReaction(emoji)}
              className="flex items-center justify-center p-2 hover:bg-gray-700 rounded cursor-pointer text-xl"
              title={`React with ${emoji}`}
            >
              {emoji}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}