'use client';

import { ChangeEvent } from 'react';

interface ActorSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
}

export default function ActorSearchField({
  value,
  onChange,
  placeholder = 'Type actor name...',
  label,
}: ActorSearchFieldProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="w-full">
      <label className="block text-xs font-nunito font-semibold text-foreground/70 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 bg-surface-variant border-2 border-surface-variant rounded-xl focus:border-primary focus:bg-white focus:outline-none transition-all font-nunito text-base text-foreground placeholder:text-foreground/40"
        />
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/30"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
    </div>
  );
}
