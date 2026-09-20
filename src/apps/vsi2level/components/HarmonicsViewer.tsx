import React, { useState, useMemo } from 'react';
import { InstantState, Theme, VsiParameters } from '../types';
import { calculateHarmonics, generateCycleData } from '../utils/pwmEngine';
import { BarChart3, Activity, Info } from 'lucide-react';

interface HarmonicsViewerProps {
  params: VsiParameters;
  theme?: Theme;
}

export const HarmonicsViewer: React.FC<HarmonicsViewerProps> = ({ params, theme = 'dark' }) => {
  const isDark = theme !== 'light';
  const [signalKey, setSignalKey] = useState<'vAB' | 'vAn' | 'ia'>('vAB');

  // Precompute 1 fundamental cycle with high sampling rate for precise FFT
  const cycleData = useMemo(() => {
    return generateCycleData(params, 1, 2048);
  }, [params]);

  // Compute harmonics up to 50 or mf + 10
  const maxHarmonic = Math.max(50, Math.min(100, params.mf * 2 + 10));

  const { harmonics, thd, fundamentalRms } = useMemo(() => {
    return calculateHarmonics(cycleData, signalKey, params.f0, maxHarmonic);
  }, [cycleData, signalKey, params.f0, maxHarmonic]);

  // Filter top prominent harmonics for display
  const displayHarmonics = harmonics.filter(
    h => h.harmonicNumber === 1 || h.percentage > 0.5
  ).slice(0, 30);

  const signalLabels = {
    vAB: 'Line Voltage (vAB)',
    vAn: 'Phase-to-Neutral Voltage (vAn)',
    ia: 'Phase Load Current (ia)'
  };

  const signalUnits = {
    vAB: 'V RMS',
    vAn: 'V RMS',
    ia: 'A RMS'
  };

  return (
    <div
      id="harmonics-viewer"
      className={`rounded-xl p-4 shadow-xl space-y-4 border transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* Header and Signal Selector */}
      <div className={`flex flex-wrap items-center justify-between gap-3 pb-3 border-b ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-500/20 text-purple-500 rounded-lg border border-purple-500/30">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
              Harmonic Spectrum & FFT Analyzer
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                isDark ? 'text-purple-400 bg-purple-950/70 border-purple-800/50' : 'text-purple-700 bg-purple-100 border-purple-300 font-bold'
              }`}>
                THD: {thd.toFixed(2)}%
              </span>
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Harmonic distortion & carrier sideband distribution</p>
          </div>
        </div>

        {/* Signal Selector Buttons */}
        <div className={`flex items-center gap-1 p-1 rounded-lg border text-xs font-mono ${
          isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={() => setSignalKey('vAB')}
            className={`px-2.5 py-1 rounded transition-colors ${
              signalKey === 'vAB'
                ? 'bg-sky-600 text-white font-semibold'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            vAB (Line)
          </button>
          <button
            onClick={() => setSignalKey('vAn')}
            className={`px-2.5 py-1 rounded transition-colors ${
              signalKey === 'vAn'
                ? 'bg-purple-600 text-white font-semibold'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            vAn (Phase)
          </button>
          <button
            onClick={() => setSignalKey('ia')}
            className={`px-2.5 py-1 rounded transition-colors ${
              signalKey === 'ia'
                ? 'bg-emerald-600 text-white font-semibold'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ia (Current)
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
        <div className={`p-2.5 rounded-lg border flex justify-between items-center ${
          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Fundamental (h=1):</span>
          <span className="text-emerald-500 font-bold text-sm">
            {fundamentalRms.toFixed(1)} {signalUnits[signalKey]}
          </span>
        </div>
        <div className={`p-2.5 rounded-lg border flex justify-between items-center ${
          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Total Harmonic Distortion:</span>
          <span className={`font-bold text-sm ${thd > 50 ? 'text-amber-500' : 'text-sky-500'}`}>
            {thd.toFixed(2)} %
          </span>
        </div>
        <div className={`p-2.5 rounded-lg border flex justify-between items-center ${
          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Dominant Sidebands:</span>
          <span className={isDark ? 'text-purple-300 font-semibold text-xs' : 'text-purple-700 font-bold text-xs'}>
            mf ± 2 = {params.mf - 2}, {params.mf + 2}
          </span>
        </div>
      </div>

      {/* Harmonic Bar Chart */}
      <div className={`p-3 rounded-lg border ${
        isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className={`text-[11px] font-mono mb-2 flex justify-between ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          <span>Harmonic Amplitude (% of fundamental)</span>
          <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Carrier ratio mf = {params.mf}</span>
        </div>

        <div className={`h-44 flex items-end gap-1.5 overflow-x-auto pb-6 pt-2 px-2 border-b relative ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          {displayHarmonics.map(h => {
            const isCarrierSideband =
              Math.abs(h.harmonicNumber - params.mf) <= 4 ||
              Math.abs(h.harmonicNumber - 2 * params.mf) <= 4;

            const isTriplen = h.harmonicNumber % 3 === 0;

            const barHeight = Math.min(100, Math.max(4, h.percentage));

            let barColor = 'bg-sky-500/70';
            if (h.harmonicNumber === 1) barColor = 'bg-emerald-500';
            else if (isCarrierSideband) barColor = 'bg-purple-500';
            else if (isTriplen) barColor = 'bg-amber-500/70';

            return (
              <div
                key={h.harmonicNumber}
                className="flex flex-col items-center flex-shrink-0 group relative"
                style={{ width: '22px' }}
              >
                {/* Tooltip on hover */}
                <div className={`absolute -top-12 border text-[10px] font-mono px-2 py-1 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap ${
                  isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                }`}>
                  h={h.harmonicNumber} ({h.frequency}Hz): {h.percentage.toFixed(1)}% ({h.magnitude.toFixed(1)}V)
                </div>

                {/* Percentage value on bar if significant */}
                {h.percentage > 15 && (
                  <span className={`text-[9px] font-mono mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {h.percentage.toFixed(0)}%
                  </span>
                )}

                {/* Bar */}
                <div
                  className={`w-full rounded-t transition-all ${barColor} group-hover:brightness-125`}
                  style={{ height: `${barHeight}%` }}
                />

                {/* Harmonic label */}
                <span className={`absolute -bottom-5 text-[9px] font-mono ${
                  isDark ? 'text-slate-400 group-hover:text-white' : 'text-slate-500 group-hover:text-slate-900'
                }`}>
                  {h.harmonicNumber}
                </span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className={`flex flex-wrap items-center justify-between gap-2 mt-3 text-[11px] font-mono ${
          isDark ? 'text-slate-400' : 'text-slate-600'
        }`}>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> Fundamental (h=1)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-purple-500"></span> Switching Sideband (around mf)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-500/70"></span> Low-order Harmonics
            </span>
          </div>
          <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Notice triplen harmonics cancel in line voltage vAB</span>
        </div>
      </div>
    </div>
  );
};

