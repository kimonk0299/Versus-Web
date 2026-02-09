'use client';

import Image from 'next/image';
import { TmdbPerson } from '@/lib/tmdb/types';
import { TMDB_IMAGE_BASE_URL, IMAGE_SIZES } from '@/lib/constants';
import { motion } from 'framer-motion';

interface ActorResultCardProps {
  actor: TmdbPerson;
  onClick: () => void;
}

export default function ActorResultCard({ actor, onClick }: ActorResultCardProps) {
  const profileUrl = actor.profile_path
    ? `${TMDB_IMAGE_BASE_URL}/${IMAGE_SIZES.profile.medium}${actor.profile_path}`
    : '/placeholder-profile.png';

  const knownForMovies = actor.known_for
    ?.filter(item => item.title)
    .slice(0, 3)
    .map(item => item.title)
    .join(', ');

  return (
    <motion.button
      onClick={onClick}
      className="w-full bg-white border-2 border-card-border rounded-2xl p-6 hover:border-primary hover:shadow-lg transition-all text-left"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-4">
        <div className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0">
          <Image
            src={profileUrl}
            alt={actor.name}
            fill
            className="object-cover"
            sizes="80px"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-fredoka font-bold text-foreground mb-1">
            {actor.name}
          </h3>
          <p className="text-sm text-foreground/60 mb-2">
            {actor.known_for_department}
          </p>
          {knownForMovies && (
            <p className="text-sm text-foreground/80 line-clamp-2">
              Known for: {knownForMovies}
            </p>
          )}
        </div>
      </div>
    </motion.button>
  );
}
