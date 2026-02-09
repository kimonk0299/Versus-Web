'use client';

import { ChangeEvent } from 'react';

interface ActorSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export default function ActorSearchField({
  value,
  onChange,
  placeholder,
}: ActorSearchFieldProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="relative w-full">
      {/* Search Icon - Leading Icon */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg
          className="w-5 h-5 text-foreground/40"
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

      {/* Input Field */}
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-16 pr-4 py-3.5 bg-white border-2 border-foreground/20 rounded-xl focus:border-primary focus:outline-none transition-colors font-nunito text-base text-foreground placeholder:text-foreground/40"
      />
    </div>
  );
}
