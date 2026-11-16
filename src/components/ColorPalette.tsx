import React, { useRef } from 'react';
import type { IntervalDegree } from '../types/music';

interface ColorPaletteProps {
  colors: string[]; // 8 hex color strings
  onChangeColor: (slotIndex: number, newHex: string) => void;
  slotAssignments: (IntervalDegree | null)[];
}

export const ColorPalette: React.FC<ColorPaletteProps> = ({
  colors,
  onChangeColor,
  slotAssignments,
}) => {
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleHexInputChange = (slotIndex: number, text: string) => {
    let clean = text.trim();
    if (!clean.startsWith('#')) {
      clean = '#' + clean;
    }
    // Allow typing, but commit if valid 6-char hex
    if (/^#[0-9A-Fa-f]{6}$/.test(clean)) {
      onChangeColor(slotIndex, clean.toLowerCase());
    } else {
      onChangeColor(slotIndex, clean);
    }
  };

  return (
    <div className="flex flex-col bg-[#2a2a2d] p-3 rounded-xl border border-[#3e3e42] shadow-md">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">
            Paleta de Grados (8 Slots)
          </span>
          <span className="text-[10px] text-gray-400 bg-[#36363a] px-2 py-0.5 rounded-full border border-[#48484c]">
            HEX Editable
          </span>
        </div>
        <span className="text-[11px] text-gray-400">
          2 Cols × 4 Filas
        </span>
      </div>

      {/* Grid 2 cols x 4 rows */}
      <div className="grid grid-cols-2 gap-2">
        {colors.map((color, index) => {
          const assignedDegree = slotAssignments[index];
          const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(color);
          const displayColor = isValidHex ? color : '#ffffff';

          return (
            <div
              key={index}
              className="flex items-center justify-between bg-[#38383a] hover:bg-[#404043] px-2.5 py-1.5 rounded-full border border-[#4a4a4f] transition-colors shadow-sm"
            >
              {/* Left side: color circle picker and slot number */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[index]?.click()}
                    style={{ backgroundColor: displayColor }}
                    className="w-5 h-5 rounded-full border-2 border-[#1c1c1e] shadow-sm hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                    title={`Slot ${index + 1}: Cambiar color`}
                  />
                  <input
                    ref={(el) => {
                      fileInputRefs.current[index] = el;
                    }}
                    type="color"
                    value={displayColor}
                    onChange={(e) => onChangeColor(index, e.target.value)}
                    className="absolute opacity-0 pointer-events-none w-0 h-0"
                  />
                </div>

                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-gray-400 uppercase leading-none">
                    Slot {index + 1}
                  </span>
                  {assignedDegree ? (
                    <span
                      style={{ color: displayColor }}
                      className="text-[11px] font-black leading-none drop-shadow-sm"
                    >
                      {assignedDegree}
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-500 italic leading-none">
                      libre
                    </span>
                  )}
                </div>
              </div>

              {/* Right side: editable hex input */}
              <input
                type="text"
                maxLength={7}
                value={color.toUpperCase()}
                onChange={(e) => handleHexInputChange(index, e.target.value)}
                className="w-20 bg-[#272729] text-gray-200 text-xs font-mono font-medium px-2 py-0.5 rounded-md border border-[#4f4f56] text-right focus:border-[#2ea8ff] focus:outline-none focus:ring-1 focus:ring-[#2ea8ff]"
                placeholder="#FFFFFF"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
