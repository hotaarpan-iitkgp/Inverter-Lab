import React from 'react';
import { InstantState, PWMStrategy, Theme, VsiParameters } from '../types';
import { STRATEGY_INFOS } from '../utils/pwmEngine';
import { Layers, ShieldCheck, Zap, ArrowRight } from 'lucide-react';

interface ModulationDetailCardProps {
  params: VsiParameters;
  instantState: InstantState;
  theme?: Theme;
}

export const ModulationDetailCard: React.FC<ModulationDetailCardProps> = ({
  params,
  instantState,
  theme = 'dark'
}) => {
  const isDark = theme !== 'light';
  const info = STRATEGY_INFOS[params.strategy];
  const { vaSin, vbSin, vcSin, vOffset, vaStar, vbStar, vcStar, vTri, sa, sb, sc } = instantState;

  const vMax = Math.max(vaSin, vbSin, vcSin);
  const vMin = Math.min(vaSin, vbSin, vcSin);

  return (
    <div
      id="modulation-detail-card"
      className={`rounded-xl p-4 shadow-xl space-y-4 border transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* Title and Badge */}
      <div className={`flex flex-wrap items-start justify-between gap-2 pb-3 border-b ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/20 text-amber-500 rounded-lg border border-amber-500/30">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{info.name}</h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{info.description}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono px-2.5 py-1 rounded border ${
            isDark ? 'bg-slate-800 text-sky-400 border-slate-700' : 'bg-slate-100 text-sky-700 border-slate-300 font-bold'
          }`}>
            Strategy: {info.shortName}
          </span>
        </div>
      </div>

      {/* Mathematical Offset Formulation & Theory */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Offset Formula Box */}
        <div className={`p-3 rounded-lg border font-mono text-xs space-y-2 ${
          isDark ? 'bg-slate-950/70 border-amber-900/30' : 'bg-amber-50/50 border-amber-200'
        }`}>
          <div className="text-amber-500 font-bold flex items-center justify-between">
            <span>Injected Zero-Sequence Offset v_offset:</span>
            <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Mathematical Definition</span>
          </div>

          <div className={`p-2 rounded border font-mono text-xs font-semibold overflow-x-auto ${
            isDark ? 'bg-slate-900 border-slate-800 text-amber-300' : 'bg-white border-amber-300 text-amber-800'
          }`}>
            {params.strategy === 'SPWM' && 'v_offset(t) = 0'}
            {params.strategy === 'THIPWM' && 'v_offset(t) = (ma / 6) · sin(3·ω·t)'}
            {params.strategy === 'MINMAX' && 'v_offset(t) = -0.5 · [ max(va, vb, vc) + min(va, vb, vc) ]'}
            {params.strategy === 'UPPER_CLAMP' && 'v_offset(t) = 1.0 - max(va, vb, vc)   [Clamps to +1.0]'}
            {params.strategy === 'LOWER_CLAMP' && 'v_offset(t) = -1.0 - min(va, vb, vc)  [Clamps to -1.0]'}
            {params.strategy === 'DPWM1' && '(max + min ≥ 0) ? (1 - max) : (-1 - min)'}
          </div>

          <div className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <strong className={isDark ? 'text-slate-300' : 'text-slate-800'}>Working Principle:</strong> Because the load is 3-wire star, common-mode offset cancels in line voltages:
            <span className={`block mt-1 font-mono text-[10px] ${isDark ? 'text-slate-300' : 'text-slate-800 font-bold'}`}>
              vAB = (va + v_offset) - (vb + v_offset) = va - vb
            </span>
            This allows arbitrary zero-sequence injection to optimize bus voltage utilization or clamp switching legs!
          </div>
        </div>

        {/* Live Instantaneous Evaluation */}
        <div className={`p-3 rounded-lg border font-mono text-xs space-y-2 ${
          isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="text-sky-500 font-bold flex items-center justify-between">
            <span>Instantaneous Calculation (t = {(instantState.time * 1000).toFixed(2)}ms)</span>
            <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Live Values</span>
          </div>

          <div className={`grid grid-cols-3 gap-1.5 text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <div className={`p-1.5 rounded border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <span className="text-rose-500 block font-semibold">va (sin):</span>
              <span>{vaSin.toFixed(3)}</span>
            </div>
            <div className={`p-1.5 rounded border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <span className="text-emerald-500 block font-semibold">vb (sin):</span>
              <span>{vbSin.toFixed(3)}</span>
            </div>
            <div className={`p-1.5 rounded border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <span className="text-sky-500 block font-semibold">vc (sin):</span>
              <span>{vcSin.toFixed(3)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className={`p-1.5 rounded border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>max / min:</span>
              <span className={`ml-1 font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{vMax.toFixed(3)} / {vMin.toFixed(3)}</span>
            </div>
            <div className={`p-1.5 rounded border ${isDark ? 'bg-amber-950/40 border-amber-800/40' : 'bg-amber-100/70 border-amber-300'}`}>
              <span className="text-amber-500 font-semibold">Offset v_offset:</span>
              <span className={`font-bold ml-1 ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>{vOffset.toFixed(3)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparator Logic Inspection */}
      <div className={`p-3 rounded-lg border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Carrier Intersection & Pulse Generation (Comparator Output: Sx = v* ≥ v_tri)
          </span>
          <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Current Carrier v_tri = <strong className={isDark ? "text-slate-200" : "text-slate-800"}>{vTri.toFixed(3)}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
          {/* Leg A Comparison */}
          <div className={`p-2 rounded border transition-colors ${
            sa
              ? isDark ? 'bg-rose-950/30 border-rose-800/60' : 'bg-rose-50 border-rose-200'
              : isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-rose-500 font-bold">Phase A Modulating:</span>
              <span className={isDark ? 'text-slate-300 font-bold' : 'text-slate-700 font-bold'}>{vaStar.toFixed(3)}</span>
            </div>
            <div className={`flex items-center justify-between text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span>{vaStar.toFixed(3)} {vaStar >= vTri ? '≥' : '<'} {vTri.toFixed(3)}</span>
              <span className={`px-1.5 py-0.5 rounded font-bold ${
                sa
                  ? isDark ? 'bg-emerald-900 text-emerald-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
              }`}>
                Sa = {sa} ({sa ? 'Top ON' : 'Bot ON'})
              </span>
            </div>
          </div>

          {/* Leg B Comparison */}
          <div className={`p-2 rounded border transition-colors ${
            sb
              ? isDark ? 'bg-emerald-950/30 border-emerald-800/60' : 'bg-emerald-50 border-emerald-200'
              : isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-emerald-500 font-bold">Phase B Modulating:</span>
              <span className={isDark ? 'text-slate-300 font-bold' : 'text-slate-700 font-bold'}>{vbStar.toFixed(3)}</span>
            </div>
            <div className={`flex items-center justify-between text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span>{vbStar.toFixed(3)} {vbStar >= vTri ? '≥' : '<'} {vTri.toFixed(3)}</span>
              <span className={`px-1.5 py-0.5 rounded font-bold ${
                sb
                  ? isDark ? 'bg-emerald-900 text-emerald-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
              }`}>
                Sb = {sb} ({sb ? 'Top ON' : 'Bot ON'})
              </span>
            </div>
          </div>

          {/* Leg C Comparison */}
          <div className={`p-2 rounded border transition-colors ${
            sc
              ? isDark ? 'bg-sky-950/30 border-sky-800/60' : 'bg-sky-50 border-sky-200'
              : isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sky-500 font-bold">Phase C Modulating:</span>
              <span className={isDark ? 'text-slate-300 font-bold' : 'text-slate-700 font-bold'}>{vcStar.toFixed(3)}</span>
            </div>
            <div className={`flex items-center justify-between text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span>{vcStar.toFixed(3)} {vcStar >= vTri ? '≥' : '<'} {vTri.toFixed(3)}</span>
              <span className={`px-1.5 py-0.5 rounded font-bold ${
                sc
                  ? isDark ? 'bg-emerald-900 text-emerald-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
              }`}>
                Sc = {sc} ({sc ? 'Top ON' : 'Bot ON'})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Engineering Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <div className={`p-2.5 rounded border ${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <span className={`block text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>DC Voltage Utilization</span>
          <span className="text-sky-500 font-bold font-mono text-sm">{info.dcUtilization}</span>
        </div>
        <div className={`p-2.5 rounded border ${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <span className={`block text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Switching Loss Reduction</span>
          <span className="text-emerald-500 font-bold font-mono text-sm">{info.switchingLossReduction}</span>
        </div>
        <div className={`p-2.5 rounded border ${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <span className={`block text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Key Characteristic</span>
          <span className="text-amber-500 font-semibold text-[11px]">{info.highlight}</span>
        </div>
      </div>
    </div>
  );
};
