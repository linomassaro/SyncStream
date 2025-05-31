import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

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
  const [activeReactions, setActiveReactions] = useState<Reaction[]>([]);

  useEffect(() => {
    // Add new reactions to active list
    const newReactions = reactions.filter(
      reaction => !activeReactions.find(active => active.id === reaction.id)
    );

    if (newReactions.length > 0) {
      setActiveReactions(prev => [...prev, ...newReactions]);

      // Remove reactions after animation duration
      newReactions.forEach(reaction => {
        setTimeout(() => {
          setActiveReactions(prev => prev.filter(r => r.id !== reaction.id));
        }, 3000);
      });
    }
  }, [reactions, activeReactions]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {activeReactions.map((reaction) => (
          <motion.div
            key={reaction.id}
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
              duration: 3,
              ease: "easeOut"
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