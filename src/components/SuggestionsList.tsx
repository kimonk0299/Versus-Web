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
        className="absolute z-10 w-full mt-2 bg-white border-2 border-card-border rounded-xl shadow-lg max-h-60 overflow-y-auto"
      >
        {suggestions.map((actor) => (
          <button
            key={actor.id}
            onClick={() => onSelect(actor)}
            className="w-full px-4 py-3 text-left hover:bg-surface-variant transition-colors border-b border-card-border last:border-b-0 font-nunito"
          >
            <div className="font-semibold text-foreground">{actor.name}</div>
            {actor.aliases.length > 0 && (
              <div className="text-sm text-foreground/60 mt-1">
                Also known as: {actor.aliases.join(', ')}
              </div>
            )}
          </button>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
