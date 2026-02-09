'use client';

import { PresetActor } from '@/lib/tmdb/types';
import { motion, AnimatePresence } from 'framer-motion';

interface SuggestionsListProps {
  suggestions: PresetActor[];
  onSelect: (actor: PresetActor) => void;
}

export default function SuggestionsList({ suggestions, onSelect }: SuggestionsListProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute z-10 w-full mt-1 bg-white border-2 border-primary/20 rounded-xl shadow-lg max-h-48 overflow-y-auto"
      >
        {suggestions.map((actor) => (
          <button
            key={actor.id}
            onClick={() => onSelect(actor)}
            className="w-full px-3 py-2 text-left hover:bg-primary/10 active:bg-primary/20 transition-colors border-b border-surface-variant last:border-b-0 font-nunito"
          >
            <div className="font-semibold text-foreground text-sm">{actor.name}</div>
            {actor.aliases.length > 0 && (
              <div className="text-xs text-foreground/50 mt-0.5 truncate">
                aka: {actor.aliases.slice(0, 2).join(', ')}
              </div>
            )}
          </button>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
