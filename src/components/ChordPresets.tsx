import React from 'react';
import type { IntervalDegree } from '../types/music';

interface Preset {
  name: string;
  degrees: IntervalDegree[];
}

const PRESETS: Preset[] = [
  { name: 'Mayor (Triada)', degrees: ['R', '3', '5'] },
  { name: 'Menor (Triada)', degrees: ['R', 'b3', '5'] },
  { name: 'Dominante 7', degrees: ['R', '3', '5', 'b7'] },
  { name: 'Menor 7', degrees: ['R', 'b3', '5', 'b7'] },
  { name: 'Mayor 7 (Maj7)', degrees: ['R', '3', '5', '7'] },
  { name: 'm7b5 (Semi-dism)', degrees: ['R', 'b3', 'b5', 'b7'] },
  { name: 'Sus4', degrees: ['R', '4', '5'] },
  { name: 'Sus2', degrees: ['R', '2', '5'] },
  { name: 'Add9', degrees: ['R', '2', '3', '5'] },
  { name: 'Power Chord 5', degrees: ['R', '5'] },
];

interface ChordPresetsProps {
  onSelectPreset: (degrees: IntervalDegree[]) => void;
  activeIntervals: IntervalDegree[];
  onClearAll: () => void;
}

export const ChordPresets: React.FC<ChordPresetsProps> = ({
  onSelectPreset,
  activeIntervals,
  onClearAll,
}) => {
  const isMatch = (presetDegrees: IntervalDegree[]) => {
    if (presetDegrees.length !== activeIntervals.length) return false;
    return presetDegrees.every((d) => activeIntervals.includes(d));
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 py-1">
      <span className="text-[11px] font-semibold text-gray-400 mr-1 uppercase tracking-wider">
        Presets de Acordes:
      </span>
      {PRESETS.map((preset) => {
        const active = isMatch(preset.degrees);
        return (
          <button
            key={preset.name}
            type="button"
            onClick={() => onSelectPreset(preset.degrees)}
            className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-all cursor-pointer ${
              active
                ? 'bg-[#2ea8ff]/20 border-[#2ea8ff] text-[#2ea8ff] font-bold shadow-sm'
                : 'bg-[#2a2a2e] border-[#444449] text-gray-300 hover:bg-[#34343a] hover:text-white'
            }`}
          >
            {preset.name}
          </button>
        );
      })}

      <button
        type="button"
        onClick={onClearAll}
        className="text-[11px] px-2 py-1 rounded-md bg-[#38383c] hover:bg-rose-950/60 border border-gray-600 hover:border-rose-500 text-gray-300 hover:text-rose-300 font-medium ml-auto transition-all cursor-pointer"
        title="Limpiar todos los intervalos"
      >
        Limpiar
      </button>
    </div>
  );
};
