'use client';

import { useCatStore } from '@/lib/catStore';
import { useEffect, useRef } from 'react';

export function CatCharacter({ size = 80 }: { size?: number }) {
  const { currentReaction, isAnimating, setReaction } = useCatStore();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAnimating && containerRef.current) {
      const animations: Record<string, string> = {
        happy: 'cat-happy 0.4s ease-in-out',
        curious: 'cat-curious 0.3s ease-in-out',
        sleeping: 'cat-sleep 0.5s ease-in-out',
        staring: 'cat-stare 0.3s ease-in-out',
        stretching: 'cat-stretch 0.4s ease-in-out',
        grooming: 'cat-groom 0.4s ease-in-out',
        watching: 'cat-watch 0.3s ease-in-out',
      };

      containerRef.current.style.animation = animations[currentReaction] || '';

      setTimeout(() => {
        setReaction('sleeping');
      }, 2000);
    }
  }, [currentReaction, isAnimating, setReaction]);

  const tailPaths: Record<string, string> = {
    happy: 'M95 85 Q115 60 100 75 Q120 55 105 65',
    curious: 'M95 85 Q105 70 95 80',
    sleeping: 'M95 85 Q98 88 95 85',
    staring: 'M95 85 L110 70',
    stretching: 'M90 90 Q85 100 90 95',
    grooming: 'M95 85 Q90 78 95 85 Q88 70 93 75',
    watching: 'M95 85 Q103 78 95 85',
  };

  const renderEyes = () => {
    if (currentReaction === 'sleeping') {
      return (
        <>
          <line x1="43" y1="45" x2="53" y2="45" stroke="#333" strokeWidth={2} strokeLinecap="round" />
          <line x1="67" y1="45" x2="77" y2="45" stroke="#333" strokeWidth={2} strokeLinecap="round" />
        </>
      );
    }

    const pupilY = currentReaction === 'curious' ? 43 : 45;
    return (
      <>
        <circle cx="48" cy="45" r={5} fill="#FFD700" />
        <circle cx="72" cy="45" r={5} fill="#FFD700" />
        <circle cx="47" cy={pupilY - 1} r={2} fill="#333" />
        <circle cx="71" cy={pupilY - 1} r={2} fill="#333" />
      </>
    );
  };

  const renderMouth = () => {
    if (currentReaction === 'happy') {
      return <path d="M53 60 Q60 66 67 60" stroke="#333" strokeWidth={2} fill="none" strokeLinecap="round" />;
    }
    return <line x1="58" y1="62" x2="62" y2="62" stroke="#333" strokeWidth={1.5} strokeLinecap="round" />;
  };

  return (
    <>
      <style>{`
        @keyframes cat-happy {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes cat-curious {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(5deg); }
        }
        @keyframes cat-sleep {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(0.95); }
        }
        @keyframes cat-stare {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes cat-stretch {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15, 0.95); }
        }
        @keyframes cat-groom {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(0.95, 1.05); }
        }
        @keyframes cat-watch {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
      `}</style>
      <div className="flex flex-col items-center p-2" ref={containerRef}>
        <svg width={size} height={size} viewBox="0 0 120 120">
          {/* 尻尾 */}
          <path
            d={tailPaths[currentReaction] || tailPaths.watching}
            stroke="#6B4E3D"
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
          />

          {/* 体 */}
          <ellipse cx="60" cy="85" rx={42} ry={32} fill="#6B4E3D" />
          <ellipse cx="45" cy="80" rx={8} ry={6} fill="#FFF5E0" opacity="0.7" />
          <ellipse cx="75" cy="92" rx={6} ry={4} fill="#FFF5E0" opacity="0.5" />

          {/* 頭 */}
          <ellipse cx="60" cy="45" rx={28} ry={25} fill="#6B4E3D" />
          <ellipse cx="60" cy="52" rx={12} ry={8} fill="#FFF5E0" opacity="0.6" />

          {/* 耳 */}
          <path d="M32 25 L38 8 L55 25 Z" fill="#6B4E3D" />
          <path d="M62 25 L82 8 L88 25 Z" fill="#6B4E3D" />
          <path d="M35 25 L40 15 L50 25 Z" fill="#FFB6C1" />
          <path d="M65 25 L78 15 L83 25 Z" fill="#FFB6C1" />

          {/* 目 */}
          {renderEyes()}

          {/* 鼻 */}
          <path d="M60 52 L57 55 L63 55 Z" fill="#FFB6C1" />

          {/* 口 */}
          {renderMouth()}

          {/* 髭 */}
          <line x1="30" y1="52" x2="18" y2="48" stroke="#333" strokeWidth={1} />
          <line x1="30" y1="55" x2="18" y2="55" stroke="#333" strokeWidth={1} />
          <line x1="30" y1="58" x2="20" y2="60" stroke="#333" strokeWidth={1} />
          <line x1="90" y1="52" x2="102" y2="48" stroke="#333" strokeWidth={1} />
          <line x1="90" y1="55" x2="102" y2="55" stroke="#333" strokeWidth={1} />
          <line x1="90" y1="58" x2="100" y2="60" stroke="#333" strokeWidth={1} />
        </svg>
      </div>
    </>
  );
}
