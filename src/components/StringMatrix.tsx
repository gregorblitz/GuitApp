import React from 'react';
import type { StringConfig } from '../types/music';

interface StringMatrixProps {
  strings: StringConfig[];
  onToggleNotes: (stringIndex: number) => void;
  onToggleVisibility: (stringIndex: number) => void;
  onResetAllStrings?: () => void;
}

export const StringMatrix: React.FC<StringMatrixProps> = ({
  strings,
  onToggleNotes,
  onToggleVisibility,
}) => {
  return (
    <div className="flex flex-col bg-[#2a2a2d] p-3 rounded-xl border border-[#3e3e42] shadow-md">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">
            Control de 6 Cuerdas (Matriz 2×6)
          </span>
          <span className="text-[10px] text-gray-400 bg-[#36363a] px-2 py-0.5 rounded-full border border-[#48484c]">
            1ª a 6ª Cuerda
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-gray-400">
          <span className="text-emerald-400 font-medium">Activo</span> /{' '}
          <span className="text-gray-500">Inactivo</span>
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-2 gap-2 mb-1 px-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#2ea8ff]"></span>
          <span>Col 1: Notas (Círculos)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#e0d2b4]"></span>
          <span>Col 2: Cuerda (Fila Diapasón)</span>
        </div>
      </div>

      {/* 6 Rows of double horizontal bars (Cuerdas 1 a 6) */}
      <div className="flex flex-col gap-1.5">
        {strings.map((str) => {
          return (
            <div key={str.index} className="grid grid-cols-2 gap-2">
              {/* Left Bar: Activates/Deactivates notes of this string */}
              <button
                type="button"
                onClick={() => onToggleNotes(str.index)}
                className={`flex items-center justify-between px-3 py-1.5 rounded-lg border transition-all text-left cursor-pointer ${
                  str.notesEnabled
                    ? 'bg-[#1e293b] border-[#38bdf8]/60 text-[#38bdf8] shadow-sm hover:bg-[#24334a]'
                    : 'bg-[#2b2b2e] border-[#444449] text-gray-500 hover:bg-[#333337]'
                }`}
                title={`Cuerda ${str.stringNumber}: ${str.notesEnabled ? 'Ocultar notas' : 'Mostrar notas'}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full border transition-all ${
                      str.notesEnabled
                        ? 'bg-[#38bdf8] border-white shadow-[0_0_8px_#38bdf8]'
                        : 'bg-transparent border-gray-600'
                    }`}
                  />
                  <span className="text-xs font-bold">
                    {str.stringNumber}ª {str.openNote}
                  </span>
                </div>
                <span className="text-[10px] font-medium uppercase tracking-tight">
                  {str.notesEnabled ? 'Notas ON' : 'Notas OFF'}
                </span>
              </button>

              {/* Right Bar: Shows/Hides string row entirely */}
              <button
                type="button"
                onClick={() => onToggleVisibility(str.index)}
                className={`flex items-center justify-between px-3 py-1.5 rounded-lg border transition-all text-left cursor-pointer ${
                  str.stringVisible
                    ? 'bg-[#302b23] border-[#e0d2b4]/60 text-[#e0d2b4] shadow-sm hover:bg-[#3a342b]'
                    : 'bg-[#2b2b2e] border-[#444449] text-gray-500 hover:bg-[#333337]'
                }`}
                title={`Cuerda ${str.stringNumber}: ${str.stringVisible ? 'Ocultar cuerda completa' : 'Mostrar cuerda completa'}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-4 h-[2px] transition-all ${
                      str.stringVisible
                        ? 'bg-[#e0d2b4] shadow-[0_0_6px_#e0d2b4]'
                        : 'bg-gray-600'
                    }`}
                  />
                  <span className="text-xs font-bold">
                    Cuerda {str.stringNumber}
                  </span>
                </div>
                <span className="text-[10px] font-medium uppercase tracking-tight">
                  {str.stringVisible ? 'Visible' : 'Oculta'}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
