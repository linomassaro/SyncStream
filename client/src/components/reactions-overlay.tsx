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
  const [activeReactions, setActiveReactions] = useState<Reaction[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    // Find only NEW reactions that haven't been processed yet
    const newReactions = reactions.filter(
      reaction => !timeoutsRef.current.has(reaction.id)
    );

    if (newReactions.length > 0) {
      // Add only new reactions to active reactions
      setActiveReactions(prev => [...prev, ...newReactions]);

      // Set timeouts only for new reactions
      newReactions.forEach(reaction => {
        const timeoutId = setTimeout(() => {
          setActiveReactions(prev => prev.filter(r => r.id !== reaction.id));
          timeoutsRef.current.delete(reaction.id);
        }, 5000);
        
        timeoutsRef.current.set(reaction.id, timeoutId);
      });
    }

    // Cleanup function
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, [reactions]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
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