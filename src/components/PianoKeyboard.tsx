import React from 'react';
import type { IntervalDegree } from '../types/music';

interface PianoKey {
  semitone: number; // 0 to 11
  noteName: string;
  intervalDegree: IntervalDegree;
  intervalLabel: string;
  isBlack: boolean;
  whiteIndex?: number; // 0 to 6
}

// 7 white keys in order:
// 0: C (R)
// 2: D (2/9)
// 4: E (3)
// 5: F (4/11)
// 7: G (5)
// 9: A (6/13)
// 11: B (7)
const WHITE_KEYS: PianoKey[] = [
  { semitone: 0, noteName: 'C', intervalDegree: 'R', intervalLabel: 'R', isBlack: false, whiteIndex: 0 },
  { semitone: 2, noteName: 'D', intervalDegree: '2', intervalLabel: '2/9', isBlack: false, whiteIndex: 1 },
  { semitone: 4, noteName: 'E', intervalDegree: '3', intervalLabel: '3', isBlack: false, whiteIndex: 2 },
  { semitone: 5, noteName: 'F', intervalDegree: '4', intervalLabel: '4/11', isBlack: false, whiteIndex: 3 },
  { semitone: 7, noteName: 'G', intervalDegree: '5', intervalLabel: '5', isBlack: false, whiteIndex: 4 },
  { semitone: 9, noteName: 'A', intervalDegree: '6', intervalLabel: '6/13', isBlack: false, whiteIndex: 5 },
  { semitone: 11, noteName: 'B', intervalDegree: '7', intervalLabel: '7', isBlack: false, whiteIndex: 6 },
];

const BLACK_KEY_WIDTH_PCT = 8.8; // black key width in %
const BLACK_KEYS: (PianoKey & { leftPct: number })[] = [
  { semitone: 1, noteName: 'C#', intervalDegree: 'b2', intervalLabel: 'b2/b9', isBlack: true, leftPct: 14.2857 - BLACK_KEY_WIDTH_PCT / 2 },
  { semitone: 3, noteName: 'D#', intervalDegree: 'b3', intervalLabel: 'b3/#9', isBlack: true, leftPct: 28.5714 - BLACK_KEY_WIDTH_PCT / 2 },
  { semitone: 6, noteName: 'F#', intervalDegree: 'b5', intervalLabel: 'b5/#11', isBlack: true, leftPct: 57.1428 - BLACK_KEY_WIDTH_PCT / 2 },
  { semitone: 8, noteName: 'G#', intervalDegree: 'b6', intervalLabel: 'b6/b13', isBlack: true, leftPct: 71.4285 - BLACK_KEY_WIDTH_PCT / 2 },
  { semitone: 10, noteName: 'A#', intervalDegree: 'b7', intervalLabel: 'b7/#13', isBlack: true, leftPct: 85.7142 - BLACK_KEY_WIDTH_PCT / 2 },
];

interface PianoKeyboardProps {
  mode: 'root' | 'interval';
  title: string;
  subtitle?: string;
  selectedRootIndex?: number;
  onSelectRoot?: (index: number) => void;
  activeIntervals?: IntervalDegree[];
  onToggleInterval?: (degree: IntervalDegree) => void;
  intervalColors?: Record<IntervalDegree, string>;
}

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({
  mode,
  title,
  subtitle,
  selectedRootIndex = 0,
  onSelectRoot,
  activeIntervals = [],
  onToggleInterval,
  intervalColors = {},
}) => {
  const isKeyActive = (key: PianoKey) => {
    if (mode === 'root') {
      return selectedRootIndex === key.semitone;
    } else {
      return activeIntervals.includes(key.intervalDegree);
    }
  };

  const getKeyColor = (key: PianoKey, active: boolean) => {
    if (!active) {
      return key.isBlack ? '#18181b' : '#f4f4f5';
    }
    if (mode === 'root') {
      return '#fff8e7'; // Requirement: active root key illuminates in #fff8e7
    } else {
      return intervalColors[key.intervalDegree] || '#ff4fa2';
    }
  };

  const getTextColor = (key: PianoKey, active: boolean) => {
    if (mode === 'root') {
      return active ? '#18181b' : key.isBlack ? '#f4f4f5' : '#18181b';
    } else {
      if (!active) {
        return key.isBlack ? '#a1a1aa' : '#27272a';
      }
      const hex = (intervalColors[key.intervalDegree] || '#ffffff').replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16) || 255;
      const g = parseInt(hex.substring(2, 4), 16) || 255;
      const b = parseInt(hex.substring(4, 6), 16) || 255;
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 155 ? '#111827' : '#ffffff';
    }
  };

  const handleKeyClick = (key: PianoKey) => {
    if (mode === 'root' && onSelectRoot) {
      onSelectRoot(key.semitone);
    } else if (mode === 'interval' && onToggleInterval) {
      onToggleInterval(key.intervalDegree);
    }
  };

  return (
    <div className="flex flex-col bg-[#2a2a2d] p-3 rounded-xl border border-[#3e3e42] shadow-md">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">
            {title}
          </span>
          {subtitle && (
            <span className="text-[10px] text-gray-400 bg-[#36363a] px-2 py-0.5 rounded-full border border-[#48484c]">
              {subtitle}
            </span>
          )}
        </div>
        {mode === 'root' && (
          <span className="text-xs font-bold text-[#fff8e7] bg-[#38383c] px-2.5 py-0.5 rounded-md border border-[#525258]">
            Nota: {WHITE_KEYS.concat(BLACK_KEYS).find(k => k.semitone === selectedRootIndex)?.noteName}
          </span>
        )}
        {mode === 'interval' && (
          <span className="text-xs text-gray-400">
            {activeIntervals.length} activos
          </span>
        )}
      </div>

      {/* Piano container */}
      <div className="relative w-full h-28 bg-[#151517] rounded-lg p-1.5 border border-[#38383c] select-none shadow-inner overflow-hidden">
        {/* White Keys Row */}
        <div className="flex w-full h-full">
          {WHITE_KEYS.map((key) => {
            const active = isKeyActive(key);
            const bgColor = getKeyColor(key, active);
            const textColor = getTextColor(key, active);

            return (
              <button
                key={key.semitone}
                type="button"
                onClick={() => handleKeyClick(key)}
                style={{
                  backgroundColor: bgColor,
                  color: textColor,
                  boxShadow: active
                    ? `0 0 14px ${mode === 'root' ? '#fff8e788' : bgColor + 'aa'}, inset 0 -2px 6px rgba(0,0,0,0.25)`
                    : 'inset 0 -3px 4px rgba(0,0,0,0.15)',
                }}
                className={`relative flex-1 h-full rounded-b-md border border-gray-400/30 flex flex-col justify-end items-center pb-2.5 transition-all duration-150 transform active:scale-y-[0.98] cursor-pointer hover:brightness-105 z-10 ${
                  active ? 'ring-2 ring-white/50 z-20 font-bold' : ''
                }`}
                title={mode === 'root' ? `Nota ${key.noteName}` : `Intervalo ${key.intervalLabel}`}
              >
                <span className="text-[12px] font-black leading-tight pointer-events-none">
                  {mode === 'root' ? key.noteName : key.intervalLabel}
                </span>
                {mode === 'root' && (
                  <span className="text-[9px] opacity-70 font-medium">
                    {key.intervalLabel}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Black Keys Row */}
        {BLACK_KEYS.map((key) => {
          const active = isKeyActive(key);
          const bgColor = getKeyColor(key, active);
          const textColor = getTextColor(key, active);

          return (
            <button
              key={key.semitone}
              type="button"
              onClick={() => handleKeyClick(key)}
              style={{
                left: `${key.leftPct}%`,
                width: `${BLACK_KEY_WIDTH_PCT}%`,
                backgroundColor: bgColor,
                color: textColor,
                boxShadow: active
                  ? `0 0 16px ${mode === 'root' ? '#fff8e7aa' : bgColor + 'dd'}, inset 0 -3px 5px rgba(0,0,0,0.4)`
                  : '0 3px 6px rgba(0,0,0,0.6), inset 0 -2px 3px rgba(255,255,255,0.08)',
              }}
              className={`absolute top-1.5 h-[62%] rounded-b-[4px] border border-black/80 flex flex-col justify-end items-center pb-1.5 z-30 transition-all duration-150 transform active:scale-y-[0.97] cursor-pointer hover:brightness-110 ${
                active ? 'ring-2 ring-white/60 font-bold' : ''
              }`}
              title={mode === 'root' ? `Nota ${key.noteName}` : `Intervalo ${key.intervalLabel}`}
            >
              <span className="text-[10px] font-black leading-tight tracking-tight pointer-events-none">
                {mode === 'root' ? key.noteName : key.intervalLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
