import { Button } from "@/components/ui/button";

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
    <div className="flex items-center space-x-1">
      {EMOJI_REACTIONS.map((emoji) => (
        <Button
          key={emoji}
          onClick={() => onReaction(emoji)}
          variant="ghost"
          size="sm"
          className="p-2 hover:bg-gray-700 rounded-lg text-lg hover:scale-110 transition-transform"
          title={`React with ${emoji}`}
        >
          {emoji}
        </Button>
      ))}
    </div>
  );
}