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
      {/* Input Field */}
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full px-6 py-4 bg-white border-2 border-foreground/20 rounded-xl focus:border-primary focus:outline-none transition-colors font-nunito text-base text-foreground placeholder:text-foreground/40"
      />
    </div>
  );
}
