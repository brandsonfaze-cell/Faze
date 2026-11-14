import { BookOpen } from 'lucide-react';
import { useState } from 'react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function ResilientImage({
  src,
  alt,
  className = '',
  fallbackTitle = 'Selah Sanctuary',
}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-zinc-100 via-zinc-200 to-zinc-100 p-6 text-zinc-500 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 dark:text-zinc-400 ${className}`}
        role="img"
        aria-label={alt}
      >
        <BookOpen className="mb-2 h-7 w-7 opacity-60" />
        <span className="font-serif text-sm italic">{fallbackTitle}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
