'use client';

import { useGardenStore } from '@/lib/gardenStore';
import { useEffect } from 'react';
import type { GardenState } from '@/types/garden';

export function GardenView() {
  const garden = useGardenStore();

  useEffect(() => {
    // 時間帯の自動更新 (5分ごと)
    const interval = setInterval(() => {
      garden.updateTimeOfDay();
    }, 5 * 60 * 1000);

    // 季節の自動更新 (1時間ごと)
    const seasonInterval = setInterval(() => {
      garden.updateSeason();
    }, 60 * 60 * 1000);

    return () => {
      clearInterval(interval);
      clearInterval(seasonInterval);
    };
  }, []);

  const getGardenColors = () => {
    const colorMap: Record<GardenState['season'], { bg: string; accent: string }> = {
      spring: { bg: '#F5F0E6', accent: '#FFB7C5' },
      summer: { bg: '#F0F5E6', accent: '#90EE90' },
      autumn: { bg: '#F5E6D3', accent: '#FFB347' },
      winter: { bg: '#E8ECF0', accent: '#A5D8DD' },
    };
    return colorMap[garden.season as GardenState['season']];
  };

  const colors = getGardenColors();
  const seasonNames: Record<GardenState['season'], string> = {
    spring: '春',
    summer: '夏',
    autumn: '秋',
    winter: '冬',
  };

  const timeNames: Record<GardenState['time_of_day'], string> = {
    morning: '朝',
    afternoon: '昼',
    evening: '夕',
    night: '夜',
  };

  return (
    <div className="relative h-48 mb-4 rounded-2xl overflow-hidden" style={{ backgroundColor: colors.bg }}>
      {/* 季節・時間表示 */}
      <div className="absolute top-2 left-4 bg-white/70 px-3 py-1.5 rounded-full">
        <span className="text-sm font-serif text-[#2D2D2D]">
          {seasonNames[garden.season as GardenState['season']]}・{timeNames[garden.time_of_day as GardenState['time_of_day']]}
        </span>
      </div>

      <svg className="w-full h-full" viewBox="0 0 400 200">
        {/* 太陽・月 */}
        {garden.time_of_day !== 'night' && (
          <circle cx="350" cy="30" r="25" fill={garden.time_of_day === 'evening' ? '#FFB347' : '#FFF5E0'} opacity="0.4" />
        )}
        {garden.time_of_day === 'night' && (
          <circle cx="350" cy="30" r="15" fill="#F5F5DC" opacity="0.8" />
        )}

        {/* 雲 */}
        {(garden.time_of_day === 'morning' || garden.time_of_day === 'afternoon') && (
          <path
            d="M50 30 Q70 20 90 30 Q100 25 110 35 Q120 30 130 35 Q140 45 50 45 Z"
            fill="#FFF"
            opacity="0.6"
          />
        )}

        {/* 地面 */}
        <path d="M0 150 Q200 140 400 150 L400 200 L0 200 Z" fill="#D4C4B0" />

        {/* 遠くの山 */}
        <path d="M0 130 L80 80 L160 120 L240 70 L320 110 L400 90 L400 150 L0 150 Z" fill="#C9C0A8" opacity="0.5" />

        {/* 木 */}
        {garden.trees.map((tree) => {
          const trunkHeight = tree.growth_stage === 'mature' ? 80 : tree.growth_stage === 'young' ? 60 : 40;
          const crownRadius = tree.growth_stage === 'mature' ? 50 : tree.growth_stage === 'young' ? 35 : 20;
          const trunkX = tree.position.x;
          const trunkY = 150 - trunkHeight;

          const crownColor =
            tree.type === 'maple'
              ? '#FF6B6B'
              : tree.type === 'pine'
                ? '#228B22'
                : tree.type === 'ginkgo'
                  ? '#FFD700'
                  : '#FFB7C5';

          return (
            <g key={tree.id}>
              <rect x={trunkX - 5} y={trunkY} width={10} height={trunkHeight} fill="#8B4513" rx={2} />
              <circle cx={trunkX} cy={trunkY - 10} r={crownRadius} fill={crownColor} opacity="0.8" />
            </g>
          );
        })}

        {/* 花 */}
        {garden.flowers.map((flower) => {
          const sizeMap = { small: 6, medium: 10, large: 14 };
          const radius = sizeMap[flower.size];

          return (
            <g key={flower.id}>
              <circle cx={flower.position.x} cy={flower.position.y} r={radius} fill={flower.color} opacity="0.9" />
              <circle cx={flower.position.x} cy={flower.position.y} r={radius * 0.3} fill="#FFD700" />
            </g>
          );
        })}
      </svg>

      {/* 成長プログレスバー */}
      <div className="absolute bottom-2 left-4 right-4">
        <div className="h-1 bg-black/10 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-500 rounded-full"
            style={{ width: `${garden.growth_level}%`, backgroundColor: colors.accent }}
          />
        </div>
        <p className="text-xs text-[#2D2D2D] font-serif text-right mt-1">
          {garden.flowers.length}花・{garden.trees.length}木
        </p>
      </div>
    </div>
  );
}
