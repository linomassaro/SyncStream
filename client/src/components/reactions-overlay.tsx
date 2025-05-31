import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";

export interface Reaction {
  id: string;
  emoji: string;
  viewerId: string;
  timestamp: number;
  x: number;
  y: number;
}

interface ReactionsOverlayProps {
  reactions: Reaction[];
}

export function ReactionsOverlay({ reactions }: ReactionsOverlayProps) {
  useEffect(() => {
    // Clear all previous reactions when new ones arrive
    reactions.forEach(reaction => {
      // Set timeout to remove each reaction after 5 seconds
      setTimeout(() => {
        const element = document.getElementById(`reaction-${reaction.id}`);
        if (element) {
          element.remove();
        }
      }, 5000);
    });
  }, [reactions]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {reactions.map((reaction) => (
          <motion.div
            key={reaction.id}
            id={`reaction-${reaction.id}`}
            initial={{ 
              opacity: 0, 
              scale: 0,
              x: reaction.x,
              y: reaction.y
            }}
            animate={{ 
              opacity: [0, 1, 1, 0], 
              scale: [0, 1.2, 1, 0.8],
              y: reaction.y - 100,
              x: reaction.x + (Math.random() - 0.5) * 50
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ 
              duration: 5,
              ease: "easeOut",
              times: [0, 0.1, 0.8, 1]
            }}
            className="absolute text-4xl select-none"
            style={{
              filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.8))"
            }}
          >
            {reaction.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}