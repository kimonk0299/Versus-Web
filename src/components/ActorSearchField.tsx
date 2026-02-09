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
      <label className="block text-sm font-nunito font-semibold text-foreground/80 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-white border-2 border-card-border rounded-xl focus:border-primary focus:outline-none transition-colors font-nunito text-lg"
        />
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-foreground/40"
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
