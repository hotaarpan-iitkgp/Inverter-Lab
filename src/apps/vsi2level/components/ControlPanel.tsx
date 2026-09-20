import React from 'react';
import { PWMStrategy, Theme, VsiParameters } from '../types';
import { STRATEGY_INFOS } from '../utils/pwmEngine';
import { Play, Pause, RotateCcw, FastForward, Rewind, Settings2, SlidersHorizontal, Activity, Sun, Moon, PanelLeftClose, Gauge } from 'lucide-react';

interface ControlPanelProps {
  params: VsiParameters;
  onChangeParams: (newParams: Partial<VsiParameters>) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  simSpeed: number;
  onChangeSpeed: (speed: number) => void;
  currentTime: number;
  onSeekTime: (t: number) => void;
  onStep: (deltaSeconds: number) => void;
  theme?: Theme;
  onToggleTheme?: () => void;
  onCollapse?: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  onChangeParams,
  isPlaying,
  onTogglePlay,
  simSpeed,
  onChangeSpeed,
  currentTime,
  onSeekTime,
  onStep,
  theme = 'dark',
  onToggleTheme,
  onCollapse
}) => {
  const isDark = theme !== 'light';
  const period = 1 / params.f0;
  const currentAngleDeg = (((currentTime % period) / period) * 360).toFixed(1);
  const currentStrategyInfo = STRATEGY_INFOS[params.strategy];
  const isOvermodulated = params.ma > currentStrategyInfo.maxLinearMa;

  const strategies: PWMStrategy[] = [
    'SPWM',
    'MINMAX',
    'THIPWM',
    'DPWM1',
    'UPPER_CLAMP',
    'LOWER_CLAMP'
  ];

  return (
    <div
      id="control-panel"
      className={`rounded-xl p-3.5 shadow-xl space-y-3.5 border transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* Panel Header with Optional Collapse Button */}
      <div className={`flex items-center justify-between pb-2 border-b ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              Control Center
            </h3>
            <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              VSI & Modulation Controls
            </p>
          </div>
        </div>

        {onCollapse && (
          <button
            onClick={onCollapse}
            className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-[11px] font-medium ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-300'
            }`}
            title="Collapse control panel to maximize workspace"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[10px]">Hide</span>
          </button>
        )}
      </div>

      {/* Strategy Selector Tabs (Compact 2-column grid for narrow pane) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            <Settings2 className="w-3 h-3 text-sky-500" />
            PWM Strategy
          </label>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
            isDark ? 'text-sky-400 bg-sky-950/80 border-sky-800/60' : 'text-sky-700 bg-sky-100 border-sky-300'
          }`}>
            ma ≤ {currentStrategyInfo.maxLinearMa.toFixed(3)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {strategies.map(s => {
            const info = STRATEGY_INFOS[s];
            const isSelected = params.strategy === s;
            return (
              <button
                key={s}
                onClick={() => onChangeParams({ strategy: s })}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium text-left transition-all border ${
                  isSelected
                    ? 'bg-sky-600 text-white border-sky-400 shadow-md ring-1 ring-sky-400/40'
                    : isDark
                      ? 'bg-slate-950/60 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="font-bold truncate text-[11px]">{info.shortName}</div>
                <div className="text-[9px] opacity-75 truncate">{info.id === 'SPWM' ? 'Offset = 0' : 'Injected Offset'}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Simulation Playback Bar */}
      <div className={`p-2.5 rounded-lg border space-y-2.5 ${
        isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        {/* Play / Pause / Step Controls */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1">
            <button
              onClick={onTogglePlay}
              className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 text-xs transition-colors shadow ${
                isPlaying
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
              title={isPlaying ? 'Pause simulation' : 'Run real-time animation'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <button
              onClick={() => onStep(-0.0005)}
              className={`p-1.5 rounded-lg transition-colors border ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
              title="Step backward"
            >
              <Rewind className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onStep(0.0005)}
              className={`p-1.5 rounded-lg transition-colors border ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
              title="Step forward"
            >
              <FastForward className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onSeekTime(0)}
              className={`p-1.5 rounded-lg transition-colors border ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 border-slate-300'
              }`}
              title="Reset to angle 0°"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center">
            <span className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded border ${
              isDark ? 'text-sky-400 bg-slate-900 border-slate-800' : 'text-sky-700 bg-white border-slate-300'
            }`}>
              {simSpeed.toFixed(2)}x
            </span>
          </div>
        </div>

        {/* Speed Controls: Presets (including 0.01x and 0.1x) + Continuous Slider */}
        <div className={`p-2 rounded-lg border space-y-1.5 ${
          isDark ? 'bg-slate-900/60 border-slate-800/90' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-semibold flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <Gauge className="w-3 h-3 text-sky-400" /> Speed Presets
            </span>
            {simSpeed <= 0.1 && (
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold">
                Slow-Mo
              </span>
            )}
          </div>

          {/* Quick Speed Preset Buttons including requested 0.01x and 0.1x */}
          <div className="grid grid-cols-5 gap-1 text-[10px] font-mono">
            {[0.01, 0.1, 0.5, 1.0, 2.0].map(speed => {
              const isSelected = Math.abs(simSpeed - speed) < 0.005;
              return (
                <button
                  key={speed}
                  onClick={() => onChangeSpeed(speed)}
                  className={`py-1 rounded border transition-all text-center font-medium ${
                    isSelected
                      ? 'bg-sky-600 text-white font-bold border-sky-400 shadow-sm'
                      : isDark
                        ? 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title={`Set speed to ${speed}x`}
                >
                  {speed}x
                </button>
              );
            })}
          </div>

          {/* Continuous Speed Slider */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-1 text-[10px] font-mono">
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Fine Slider:</span>
              <span className="font-bold text-sky-400">{simSpeed.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="2.0"
              step="0.01"
              value={simSpeed}
              onChange={e => onChangeSpeed(parseFloat(e.target.value))}
              className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-sky-500 ${
                isDark ? 'bg-slate-800' : 'bg-slate-200'
              }`}
              title={`Sim speed: ${simSpeed.toFixed(2)}x`}
            />
            <div className={`flex justify-between text-[8px] font-mono mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              <span>0.01x (Microsecond)</span>
              <span>0.1x</span>
              <span>1.0x</span>
              <span>2.0x</span>
            </div>
          </div>
        </div>

        {/* Time Scrubber Slider */}
        <div className="flex items-center gap-2 pt-0.5">
          <span className={`text-xs font-mono whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>θ:</span>
          <input
            type="range"
            min="0"
            max={period}
            step={period / 720}
            value={currentTime % period}
            onChange={e => onSeekTime(parseFloat(e.target.value))}
            className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-sky-500 ${
              isDark ? 'bg-slate-800' : 'bg-slate-200'
            }`}
          />
          <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded border min-w-[50px] text-center ${
            isDark ? 'text-sky-400 bg-slate-900 border-slate-800' : 'text-sky-700 bg-white border-slate-300 font-bold'
          }`}>
            {currentAngleDeg}°
          </span>
        </div>
      </div>

      {/* Vertical Stack of Electrical & Modulation Sliders for Narrow Pane */}
      <div className="space-y-2.5 pt-0.5">
        {/* Modulation Index ma */}
        <div className={`p-2.5 rounded-lg border ${
          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Modulation Index (ma)</span>
            <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
              isOvermodulated
                ? isDark
                  ? 'bg-amber-950 text-amber-400 border border-amber-800'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'text-sky-500'
            }`}>
              {params.ma.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.3"
            step="0.01"
            value={params.ma}
            onChange={e => onChangeParams({ ma: parseFloat(e.target.value) })}
            className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-sky-500 my-1.5 ${
              isDark ? 'bg-slate-800' : 'bg-slate-200'
            }`}
          />
          <div className={`flex justify-between text-[9px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            <span>0.10</span>
            <span className="text-emerald-500">1.0 SPWM</span>
            <span className="text-sky-500">1.15 SVPWM</span>
            <span className="text-amber-500">1.3 Overmod</span>
          </div>
        </div>

        {/* Carrier Ratio mf */}
        <div className={`p-2.5 rounded-lg border ${
          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Carrier Ratio (mf = fc/f0)</span>
            <span className="text-xs font-mono font-bold text-sky-500">
              {params.mf} ({params.f0 * params.mf} Hz)
            </span>
          </div>
          <input
            type="range"
            min="9"
            max="99"
            step="6"
            value={params.mf}
            onChange={e => onChangeParams({ mf: parseInt(e.target.value, 10) })}
            className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-sky-500 my-1.5 ${
              isDark ? 'bg-slate-800' : 'bg-slate-200'
            }`}
          />
          <div className={`flex justify-between text-[9px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            <span>9 (Coarse)</span>
            <span>21</span>
            <span>45</span>
            <span>99 (Fine)</span>
          </div>
        </div>

        {/* Fundamental Frequency f0 */}
        <div className={`p-2.5 rounded-lg border ${
          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Fundamental Frequency (f0)</span>
            <span className="text-xs font-mono font-bold text-emerald-500">
              {params.f0} Hz ({(1000 / params.f0).toFixed(1)} ms)
            </span>
          </div>
          <input
            type="range"
            min="20"
            max="100"
            step="5"
            value={params.f0}
            onChange={e => onChangeParams({ f0: parseInt(e.target.value, 10) })}
            className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-emerald-500 my-1.5 ${
              isDark ? 'bg-slate-800' : 'bg-slate-200'
            }`}
          />
          <div className={`flex justify-between text-[9px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            <span>20 Hz</span>
            <span>50 Hz (EU/Asia)</span>
            <span>60 Hz (US)</span>
            <span>100 Hz</span>
          </div>
        </div>

        {/* DC Bus Voltage Vdc */}
        <div className={`p-2.5 rounded-lg border ${
          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>DC Link Voltage (Vdc)</span>
            <span className="text-xs font-mono font-bold text-emerald-500">
              {params.vdc} V (±{params.vdc / 2}V)
            </span>
          </div>
          <input
            type="range"
            min="100"
            max="800"
            step="50"
            value={params.vdc}
            onChange={e => onChangeParams({ vdc: parseInt(e.target.value, 10) })}
            className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-emerald-500 my-1.5 ${
              isDark ? 'bg-slate-800' : 'bg-slate-200'
            }`}
          />
          <div className={`flex justify-between text-[9px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            <span>100V</span>
            <span>400V (EV/Ind)</span>
            <span>800V (High Voltage)</span>
          </div>
        </div>

        {/* Load Parameters R & L */}
        <div className={`p-2.5 rounded-lg border ${
          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>R-L Load Parameters</span>
            <span className="text-xs font-mono text-purple-500 font-bold">
              {params.loadR}Ω / {params.loadL}mH
            </span>
          </div>
          <div className="space-y-2 mt-1">
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Resistance (R):</span>
                <span className="font-bold text-purple-400">{params.loadR} Ω</span>
              </div>
              <input
                type="range"
                min="2"
                max="50"
                step="2"
                value={params.loadR}
                onChange={e => onChangeParams({ loadR: parseInt(e.target.value, 10) })}
                className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-purple-500 ${
                  isDark ? 'bg-slate-800' : 'bg-slate-200'
                }`}
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Inductance (L):</span>
                <span className="font-bold text-purple-400">{params.loadL} mH</span>
              </div>
              <input
                type="range"
                min="5"
                max="80"
                step="5"
                value={params.loadL}
                onChange={e => onChangeParams({ loadL: parseInt(e.target.value, 10) })}
                className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-purple-500 ${
                  isDark ? 'bg-slate-800' : 'bg-slate-200'
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
