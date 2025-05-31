import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Smile } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [sentEmoji, setSentEmoji] = useState<string | null>(null);

  const handleReaction = (emoji: string) => {
    onReaction(emoji);
    setSentEmoji(emoji);
    setTimeout(() => setSentEmoji(null), 1000);
  };

  return (
    <div className="relative">
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
                onClick={() => handleReaction(emoji)}
                className="flex items-center justify-center p-2 hover:bg-gray-700 rounded cursor-pointer text-xl"
                title={`React with ${emoji}`}
              >
                {emoji}
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Reaction sent animation */}
      <AnimatePresence>
        {sentEmoji && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 0 }}
            animate={{ opacity: 1, scale: 1.2, y: -20 }}
            exit={{ opacity: 0, scale: 0.5, y: -40 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-2xl pointer-events-none"
            style={{
              filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.8))"
            }}
          >
            {sentEmoji}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}