'use client';

import Image from 'next/image';
import { Movie } from '@/lib/tmdb/types';
import { TMDB_IMAGE_BASE_URL, IMAGE_SIZES } from '@/lib/constants';
import { motion } from 'framer-motion';

interface MovieCardProps {
  movie: Movie;
  onClick?: () => void;
  isSelected?: boolean;
}

export default function MovieCard({ movie, onClick, isSelected }: MovieCardProps) {
  const posterUrl = movie.posterPath
    ? `${TMDB_IMAGE_BASE_URL}/${IMAGE_SIZES.poster.medium}${movie.posterPath}`
    : '/placeholder-poster.png';

  return (
    <motion.div
      className={`relative cursor-pointer rounded-2xl overflow-hidden shadow-xl transition-all duration-300 ${
        isSelected ? 'ring-4 ring-secondary' : ''
      }`}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      style={{ aspectRatio: '2/3', width: '100%' }}
    >
      <Image
        src={posterUrl}
        alt={movie.title}
        fill
        className="object-cover"
        sizes="400px"
        priority
      />

      {/* Gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4">
        <h3 className="text-white font-fredoka font-bold text-lg line-clamp-2 leading-tight">
          {movie.title}
        </h3>
        {movie.releaseYear > 0 && (
          <p className="text-white/90 text-sm mt-1">{movie.releaseYear}</p>
        )}
      </div>

      {/* Click effect ripple */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 bg-secondary/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.6 }}
        />
      )}
    </motion.div>
  );
}
