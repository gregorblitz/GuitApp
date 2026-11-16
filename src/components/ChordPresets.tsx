import React, { useState } from 'react';
import { Sparkles, Compass, X, Info, Flame, Film } from 'lucide-react';
import type { IntervalDegree, ExplorerPreset } from '../types/music';
import { EXPLORER_PRESETS } from '../utils/musicTheory';

interface QuickPreset {
  name: string;
  degrees: IntervalDegree[];
}

const QUICK_PRESETS: QuickPreset[] = [
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
  intervalColors?: Record<IntervalDegree, string>;
  rootNoteName?: string;
}

export const ChordPresets: React.FC<ChordPresetsProps> = ({
  onSelectPreset,
  activeIntervals,
  onClearAll,
  intervalColors = {},
  rootNoteName = 'C',
}) => {
  // Current active explorer preset to show the explanatory card
  const [activeExplorerItem, setActiveExplorerItem] = useState<ExplorerPreset | null>(
    // Start with default Triada Mayor card
    EXPLORER_PRESETS[0]
  );

  const isMatch = (presetDegrees: IntervalDegree[]) => {
    if (presetDegrees.length !== activeIntervals.length) return false;
    return presetDegrees.every((d) => activeIntervals.includes(d));
  };

  const handleSelectExplorerItem = (itemId: string) => {
    if (!itemId) return;
    const item = EXPLORER_PRESETS.find((p) => p.id === itemId);
    if (item) {
      setActiveExplorerItem(item);
      onSelectPreset(item.degrees);
    }
  };

  const handleQuickPresetClick = (preset: QuickPreset) => {
    // Check if this quick preset matches an explorer item to show explanation
    const matchingExplorer = EXPLORER_PRESETS.find(
      (ep) =>
        ep.degrees.length === preset.degrees.length &&
        ep.degrees.every((d) => preset.degrees.includes(d))
    );
    if (matchingExplorer) {
      setActiveExplorerItem(matchingExplorer);
    }
    onSelectPreset(preset.degrees);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Acordes con Color':
        return <Sparkles className="w-3.5 h-3.5 text-[#ff4fa2]" />;
      case 'Escalas para Solos':
        return <Flame className="w-3.5 h-3.5 text-[#2ea8ff]" />;
      case 'Modos Cinematográficos':
        return <Film className="w-3.5 h-3.5 text-amber-300" />;
      default:
        return <Info className="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Top row: Quick Buttons + Dropdown Explorer + Clear */}
      <div className="flex flex-wrap items-center gap-2 py-1">
        <span className="text-[11px] font-semibold text-gray-400 mr-1 uppercase tracking-wider whitespace-nowrap">
          Presets de Acordes:
        </span>

        {/* Existing Quick Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {QUICK_PRESETS.map((preset) => {
            const active = isMatch(preset.degrees);
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleQuickPresetClick(preset)}
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
        </div>

        {/* 2. Explorador de Acordes, Escalas y Modos (Dropdown con optgroups) */}
        <div className="flex items-center gap-1.5 bg-[#2a2a2e] px-2 py-1 rounded-md border border-[#48484f]">
          <Compass className="w-3.5 h-3.5 text-[#2ea8ff] shrink-0" />
          <label htmlFor="explorer-select" className="text-[11px] font-bold text-gray-300 whitespace-nowrap">
            Explorador:
          </label>
          <select
            id="explorer-select"
            value={activeExplorerItem?.id || ''}
            onChange={(e) => handleSelectExplorerItem(e.target.value)}
            className="bg-[#1e1e21] text-xs font-semibold text-sky-300 px-2 py-0.5 rounded border border-[#4a4a52] focus:border-[#2ea8ff] focus:outline-none cursor-pointer max-w-[210px] truncate"
          >
            <option value="" disabled>
              Seleccionar escala o modo...
            </option>

            {/* Categoría: Acordes con Color */}
            <optgroup label="✨ Acordes con Color" className="bg-[#242426] text-gray-200 font-bold">
              {EXPLORER_PRESETS.filter((p) => p.category === 'Acordes con Color').map((item) => (
                <option key={item.id} value={item.id} className="font-normal text-white">
                  {item.name}
                </option>
              ))}
            </optgroup>

            {/* Categoría: Escalas para Solos */}
            <optgroup label="🎸 Escalas para Solos" className="bg-[#242426] text-gray-200 font-bold">
              {EXPLORER_PRESETS.filter((p) => p.category === 'Escalas para Solos').map((item) => (
                <option key={item.id} value={item.id} className="font-normal text-white">
                  {item.name}
                </option>
              ))}
            </optgroup>

            {/* Categoría: Modos Cinematográficos */}
            <optgroup label="🎬 Modos Cinematográficos" className="bg-[#242426] text-gray-200 font-bold">
              {EXPLORER_PRESETS.filter((p) => p.category === 'Modos Cinematográficos').map((item) => (
                <option key={item.id} value={item.id} className="font-normal text-white">
                  {item.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Clear Button */}
        <button
          type="button"
          onClick={() => {
            setActiveExplorerItem(null);
            onClearAll();
          }}
          className="text-[11px] px-2 py-1 rounded-md bg-[#38383c] hover:bg-rose-950/60 border border-gray-600 hover:border-rose-500 text-gray-300 hover:text-rose-300 font-medium ml-auto transition-all cursor-pointer whitespace-nowrap"
          title="Limpiar todos los intervalos"
        >
          Limpiar
        </button>
      </div>

      {/* Explanatory Card (Modo Intuitivo sin Teoría Musical) */}
      {activeExplorerItem && (
        <div className="bg-gradient-to-r from-[#2a2a2e] via-[#28282d] to-[#252528] border border-[#3e3e46] rounded-xl p-3 shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-[#1f1f22] border border-[#3c3c44] mt-0.5 shrink-0">
              {getCategoryIcon(activeExplorerItem.category)}
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black text-white">
                  {rootNoteName} {activeExplorerItem.name}
                </span>
                <span className="text-[10px] font-semibold text-gray-400 bg-[#35353a] px-2 py-0.5 rounded-full border border-[#48484e]">
                  {activeExplorerItem.category}
                </span>
                {/* Interval Degrees Pills */}
                <div className="flex items-center gap-1">
                  {activeExplorerItem.degrees.map((deg) => (
                    <span
                      key={deg}
                      style={{
                        borderColor: intervalColors[deg] || '#555',
                        color: intervalColors[deg] || '#fff',
                      }}
                      className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-black/40 border"
                    >
                      {deg}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed font-normal">
                {activeExplorerItem.description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveExplorerItem(null)}
            className="text-gray-400 hover:text-gray-200 p-1 rounded-md hover:bg-[#38383e] transition-colors self-end sm:self-center shrink-0 cursor-pointer"
            title="Ocultar tarjeta explicativa"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
