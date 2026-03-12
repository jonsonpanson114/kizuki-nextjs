'use client';

import { useState, useEffect } from 'react';

interface HandwritingTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
}

export function HandwritingText({ text, speed = 50, onComplete, className = '' }: HandwritingTextProps) {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    setDisplayText('');
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <p className={`font-serif text-[#2D2D2D] ${className}`}>
      {displayText}
      <span className="inline-block w-0.5 h-5 bg-[#2D2D2D] ml-0.5 animate-pulse" />
    </p>
  );
}
