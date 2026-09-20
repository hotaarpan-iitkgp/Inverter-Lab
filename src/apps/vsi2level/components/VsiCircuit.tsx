import React from 'react';
import { InstantState, VsiParameters, SwitchStateDetail, Theme } from '../types';
import { Zap, Cpu, ArrowRight, Activity, BatteryCharging, Maximize2, Minimize2, Columns2 } from 'lucide-react';

interface VsiCircuitProps {
  state: InstantState;
  params: VsiParameters;
  theme?: Theme;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  onSelectSideBySide?: (pairedWith: 'hexagon' | 'scope') => void;
}

export const VsiCircuit: React.FC<VsiCircuitProps> = ({
  state,
  params,
  theme = 'dark',
  isFullScreen = false,
  onToggleFullScreen,
  onSelectSideBySide
}) => {
  const isDark = theme === 'dark';
  const { vdc } = params;
  const {
    sa, sb, sc,
    g1, g2, g3, g4, g5, g6,
    switchStates,
    ia, ib, ic,
    vAO, vBO, vCO,
    vAn, vBn, vCn,
    vectorName,
    sector = 1
  } = state;

  // Distinct phase colors
  const phaseColors = {
    A: '#f43f5e', // Rose / Red
    B: '#10b981', // Emerald / Green
    C: '#0ea5e9'  // Sky / Blue
  };

  // Leg X coordinates - spaced with dedicated room for gate drivers & status tags
  const legX = {
    A: 220,
    B: 390,
    C: 560
  };

  // Center horizontal line Y coordinate
  const yMid = 205;

  // Phase output tap heights (matching 3-phase load branches at y=165, 205, 245)
  const yTap = {
    A: 165,
    B: 205,
    C: 245
  };

  return (
    <div
      id="vsi-circuit-container"
      className={`${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      } border rounded-xl p-4 shadow-xl flex flex-col h-full transition-colors`}
    >
      {/* Header with real-time vector & gate signals status */}
      <div className={`flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-500/20 text-amber-500 rounded-lg border border-amber-500/30">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h2 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              Two-Level VSI Power Stage Schematic
              <span className={`text-xs font-mono font-normal px-2 py-0.5 rounded border ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}>
                DC Source &bull; MOSFET Switches &bull; Gate Drivers (g₁–g₆) &bull; Body Diodes
              </span>
            </h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Dynamic Conduction Paths reflecting Active Space Vector ({vectorName}, Sector {sector})
            </p>
          </div>
        </div>

        {/* Live Vector & 6-Gate Pulse Logic Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono ${
            isDark ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
          }`}>
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Vector:</span>
            <span className="font-bold">{vectorName}</span>
            <span className="opacity-60">&bull; S{sector}</span>
          </div>

          {/* Quick gate states pill [g1..g6] */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono ${
            isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
          }`}>
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Gate Pulses:</span>
            <span title="g1 (S1)" className={g1 ? "text-emerald-500 font-bold" : isDark ? "text-slate-500" : "text-slate-400"}>g₁:{g1}</span>
            <span title="g2 (S2)" className={g2 ? "text-emerald-500 font-bold" : isDark ? "text-slate-500" : "text-slate-400"}>g₂:{g2}</span>
            <span className="opacity-40">|</span>
            <span title="g3 (S3)" className={g3 ? "text-emerald-500 font-bold" : isDark ? "text-slate-500" : "text-slate-400"}>g₃:{g3}</span>
            <span title="g4 (S4)" className={g4 ? "text-emerald-500 font-bold" : isDark ? "text-slate-500" : "text-slate-400"}>g₄:{g4}</span>
            <span className="opacity-40">|</span>
            <span title="g5 (S5)" className={g5 ? "text-emerald-500 font-bold" : isDark ? "text-slate-500" : "text-slate-400"}>g₅:{g5}</span>
            <span title="g6 (S6)" className={g6 ? "text-emerald-500 font-bold" : isDark ? "text-slate-500" : "text-slate-400"}>g₆:{g6}</span>
          </div>

          {/* Side-by-Side & Full Screen Action Buttons */}
          <div className="flex items-center gap-1">
            {onSelectSideBySide && (
              <div className={`flex items-center gap-0.5 p-0.5 rounded-lg border text-xs ${
                isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-300'
              }`}>
                <span className={`text-[10px] font-mono px-1 flex items-center gap-0.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  <Columns2 className="w-3 h-3 text-sky-400" /> Split:
                </span>
                <button
                  onClick={() => onSelectSideBySide('hexagon')}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-white text-slate-700'
                  }`}
                  title="Side-by-side with Space Vector Hexagon"
                >
                  + Hexagon
                </button>
                <button
                  onClick={() => onSelectSideBySide('scope')}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-white text-slate-700'
                  }`}
                  title="Side-by-side with Oscilloscope Waveforms"
                >
                  + Waveforms
                </button>
              </div>
            )}

            {onToggleFullScreen && (
              <button
                onClick={onToggleFullScreen}
                className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 text-xs font-medium ${
                  isFullScreen
                    ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                    : isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
                title={isFullScreen ? 'Exit full screen (Return to Dashboard)' : 'Toggle Full Screen Power Stage'}
              >
                {isFullScreen ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[11px]">Exit Full Screen</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[11px]">Full Screen</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SVG Circuit Canvas */}
      <div className={`relative flex-1 min-h-[380px] w-full flex items-center justify-center rounded-lg border p-2 overflow-hidden transition-colors ${
        isDark ? 'bg-slate-950/80 border-slate-800/80' : 'bg-slate-50 border-slate-200'
      }`}>
        <svg
          viewBox="0 0 960 420"
          className={`w-full h-full ${isFullScreen ? 'max-h-[640px]' : 'max-h-[460px]'} select-none`}
          style={{ filter: isDark ? 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' : 'none' }}
        >
          <defs>
            {/* Glowing filters */}
            <filter id="glow-gate" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-active" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Current flow animations */}
            <style>
              {`
                @keyframes dashFlow {
                  from { stroke-dashoffset: 24; }
                  to { stroke-dashoffset: 0; }
                }
                @keyframes dashFlowReverse {
                  from { stroke-dashoffset: 0; }
                  to { stroke-dashoffset: 24; }
                }
                .flow-active {
                  stroke-dasharray: 6 4;
                  animation: dashFlow 0.8s linear infinite;
                }
                .flow-active-rev {
                  stroke-dasharray: 6 4;
                  animation: dashFlowReverse 0.8s linear infinite;
                }
                .gate-wire-pulse {
                  stroke-dasharray: 4 2;
                  animation: dashFlow 0.6s linear infinite;
                }
              `}
            </style>
          </defs>

          {/* ================= DC VOLTAGE SOURCE (BATTERY) & DC BUS ================= */}
          {/* Top positive DC rail (+Vdc/2) */}
          <line x1="28" y1="35" x2="630" y2="35" stroke="#f59e0b" strokeWidth="3.5" />
          <text x="635" y="38" fill="#f59e0b" fontSize="11" fontFamily="monospace" fontWeight="bold">+Vdc/2</text>
          <text x="635" y="50" fill="#f59e0b" fontSize="9" opacity="0.8">+{vdc / 2}V</text>

          {/* Bottom negative DC rail (-Vdc/2) */}
          <line x1="28" y1="375" x2="630" y2="375" stroke={isDark ? "#475569" : "#64748b"} strokeWidth="3.5" />
          <text x="635" y="378" fill={isDark ? "#94a3b8" : "#475569"} fontSize="11" fontFamily="monospace" fontWeight="bold">-Vdc/2</text>
          <text x="635" y="390" fill={isDark ? "#94a3b8" : "#475569"} fontSize="9" opacity="0.8">-{vdc / 2}V</text>

          {/* --- DC Battery Symbol on Far Left (Connecting to +Vdc/2 and -Vdc/2) --- */}
          <g id="dc-battery-source">
            {/* Lead from top rail to battery + terminal */}
            <line x1="32" y1="35" x2="32" y2="180" stroke="#f59e0b" strokeWidth="2.5" className="flow-active" />
            <circle cx="32" cy="35" r="3" fill="#f59e0b" />

            {/* Lead from battery - terminal to bottom rail */}
            <line x1="32" y1="230" x2="32" y2="375" stroke={isDark ? "#475569" : "#64748b"} strokeWidth="2.5" className="flow-active" />
            <circle cx="32" cy="375" r="3" fill={isDark ? "#475569" : "#64748b"} />

            {/* Battery Plates (Cell 1 & Cell 2) */}
            {/* Long Positive Plate 1 */}
            <line x1="18" y1="180" x2="46" y2="180" stroke="#f59e0b" strokeWidth="3" />
            <text x="12" y="184" fill="#f59e0b" fontSize="11" fontWeight="bold" fontFamily="monospace">+</text>
            {/* Short Thick Negative Plate 1 */}
            <line x1="23" y1="192" x2="41" y2="192" stroke={isDark ? "#94a3b8" : "#475569"} strokeWidth="4.5" />

            {/* Connecting stub between cells */}
            <line x1="32" y1="192" x2="32" y2="204" stroke="#f59e0b" strokeWidth="2" />

            {/* Long Positive Plate 2 */}
            <line x1="18" y1="204" x2="46" y2="204" stroke="#f59e0b" strokeWidth="3" />
            {/* Short Thick Negative Plate 2 */}
            <line x1="23" y1="216" x2="41" y2="216" stroke={isDark ? "#94a3b8" : "#475569"} strokeWidth="4.5" />
            <text x="12" y="220" fill={isDark ? "#94a3b8" : "#475569"} fontSize="11" fontWeight="bold" fontFamily="monospace">−</text>

            <line x1="32" y1="216" x2="32" y2="230" stroke={isDark ? "#94a3b8" : "#475569"} strokeWidth="2" />

            {/* Battery Label Badge */}
            <rect x="8" y="235" width="48" height="24" rx="4" fill={isDark ? "#0f172a" : "#e2e8f0"} stroke="#f59e0b" strokeWidth="1.2" />
            <text x="32" y="246" fill="#f59e0b" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">DC SOURCE</text>
            <text x="32" y="255" fill={isDark ? "#cbd5e1" : "#1e293b"} fontSize="7.5" fontFamily="monospace" textAnchor="middle">{vdc}V (Vdc)</text>
          </g>

          {/* --- DC Midpoint Rail & Split Capacitors C1 & C2 --- */}
          {/* DC Midpoint rail O */}
          <line x1="85" y1={yMid} x2="135" y2={yMid} stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />
          <circle cx="135" cy={yMid} r="3" fill={isDark ? "#cbd5e1" : "#475569"} />
          <text x="142" y={yMid + 4} fill={isDark ? "#94a3b8" : "#64748b"} fontSize="10" fontFamily="monospace">O (0V)</text>

          {/* DC Link Capacitors C1 & C2 at x = 85 */}
          <line x1="85" y1="35" x2="85" y2="135" stroke="#f59e0b" strokeWidth="2" />
          <circle cx="85" cy="35" r="3" fill="#f59e0b" />
          <line x1="85" y1="275" x2="85" y2="375" stroke={isDark ? "#475569" : "#64748b"} strokeWidth="2" />
          <circle cx="85" cy="375" r="3" fill={isDark ? "#475569" : "#64748b"} />

          {/* Capacitor C1 (top half) */}
          <rect x="69" y="135" width="32" height="38" rx="3" fill={isDark ? "#1e293b" : "#f1f5f9"} stroke={isDark ? "#475569" : "#cbd5e1"} strokeWidth="1.5" />
          <line x1="77" y1="150" x2="93" y2="150" stroke={isDark ? "#94a3b8" : "#475569"} strokeWidth="2" />
          <line x1="77" y1="158" x2="93" y2="158" stroke={isDark ? "#94a3b8" : "#475569"} strokeWidth="2" />
          <text x="85" y="184" fill={isDark ? "#cbd5e1" : "#475569"} fontSize="9" textAnchor="middle">C₁</text>

          {/* Capacitor C2 (bottom half) */}
          <rect x="69" y="235" width="32" height="38" rx="3" fill={isDark ? "#1e293b" : "#f1f5f9"} stroke={isDark ? "#475569" : "#cbd5e1"} strokeWidth="1.5" />
          <line x1="77" y1="250" x2="93" y2="250" stroke={isDark ? "#94a3b8" : "#475569"} strokeWidth="2" />
          <line x1="77" y1="258" x2="93" y2="258" stroke={isDark ? "#94a3b8" : "#475569"} strokeWidth="2" />
          <text x="85" y="284" fill={isDark ? "#cbd5e1" : "#475569"} fontSize="9" textAnchor="middle">C₂</text>

          <line x1="85" y1="173" x2="85" y2="235" stroke="#64748b" strokeWidth="2" />
          <circle cx="85" cy={yMid} r="3.5" fill="#64748b" />

          {/* ================= 3 INVERTER LEGS WITH GATE DRIVERS & MOSFETS ================= */}
          {/* Leg A: Top = S1, Bottom = S2 */}
          {renderPhaseLegWithGateDriver(
            legX.A,
            'A',
            switchStates.s1,
            switchStates.s2,
            ia,
            phaseColors.A,
            yTap.A,
            isDark
          )}

          {/* Leg B: Top = S3, Bottom = S4 */}
          {renderPhaseLegWithGateDriver(
            legX.B,
            'B',
            switchStates.s3,
            switchStates.s4,
            ib,
            phaseColors.B,
            yTap.B,
            isDark
          )}

          {/* Leg C: Top = S5, Bottom = S6 */}
          {renderPhaseLegWithGateDriver(
            legX.C,
            'C',
            switchStates.s5,
            switchStates.s6,
            ic,
            phaseColors.C,
            yTap.C,
            isDark
          )}

          {/* ================= WIRE CROSSING UNDERLAYS (CLEAN CAD CROSSOVERS) ================= */}
          {/* Line A (y=165) crossing over Leg B (x=390) and Leg C (x=560) */}
          <line x1={legX.B - 7} y1={yTap.A} x2={legX.B + 7} y2={yTap.A} stroke={isDark ? "#090d16" : "#ffffff"} strokeWidth={7} />
          <line x1={legX.C - 7} y1={yTap.A} x2={legX.C + 7} y2={yTap.A} stroke={isDark ? "#090d16" : "#ffffff"} strokeWidth={7} />
          {/* Line B (y=205) crossing over Leg C (x=560) */}
          <line x1={legX.C - 7} y1={yTap.B} x2={legX.C + 7} y2={yTap.B} stroke={isDark ? "#090d16" : "#ffffff"} strokeWidth={7} />

          {/* ================= 3 CLEAN STRAIGHT HORIZONTAL OUTPUT LINES ================= */}
          {/* Line A: Runs straight horizontally from Leg A (220, 165) -> Load (730, 165) */}
          <line
            x1={legX.A}
            y1={yTap.A}
            x2={730}
            y2={yTap.A}
            stroke={phaseColors.A}
            strokeWidth={3}
            className={Math.abs(ia) > 0.1 ? (ia > 0 ? 'flow-active' : 'flow-active-rev') : ''}
          />
          {/* Line A Identifier Pill */}
          <g transform={`translate(640, ${yTap.A - 12})`}>
            <rect x="0" y="0" width="76" height="18" rx="4" fill={isDark ? "#1e1b2e" : "#ffe4e6"} stroke={phaseColors.A} strokeWidth="1" />
            <text x="38" y="12" fill={phaseColors.A} fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              Line A ({ia >= 0 ? `+${ia.toFixed(1)}` : ia.toFixed(1)}A)
            </text>
          </g>

          {/* Line B: Runs straight horizontally from Leg B (390, 205) -> Load (730, 205) */}
          <line
            x1={legX.B}
            y1={yTap.B}
            x2={730}
            y2={yTap.B}
            stroke={phaseColors.B}
            strokeWidth={3}
            className={Math.abs(ib) > 0.1 ? (ib > 0 ? 'flow-active' : 'flow-active-rev') : ''}
          />
          {/* Line B Identifier Pill */}
          <g transform={`translate(640, ${yTap.B - 12})`}>
            <rect x="0" y="0" width="76" height="18" rx="4" fill={isDark ? "#062e24" : "#d1fae5"} stroke={phaseColors.B} strokeWidth="1" />
            <text x="38" y="12" fill={phaseColors.B} fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              Line B ({ib >= 0 ? `+${ib.toFixed(1)}` : ib.toFixed(1)}A)
            </text>
          </g>

          {/* Line C: Runs straight horizontally from Leg C (560, 245) -> Load (730, 245) */}
          <line
            x1={legX.C}
            y1={yTap.C}
            x2={730}
            y2={yTap.C}
            stroke={phaseColors.C}
            strokeWidth={3}
            className={Math.abs(ic) > 0.1 ? (ic > 0 ? 'flow-active' : 'flow-active-rev') : ''}
          />
          {/* Line C Identifier Pill */}
          <g transform={`translate(640, ${yTap.C - 12})`}>
            <rect x="0" y="0" width="76" height="18" rx="4" fill={isDark ? "#0c2340" : "#e0f2fe"} stroke={phaseColors.C} strokeWidth="1" />
            <text x="38" y="12" fill={phaseColors.C} fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              Line C ({ic >= 0 ? `+${ic.toFixed(1)}` : ic.toFixed(1)}A)
            </text>
          </g>

          {/* ================= TERMINAL NODES A, B, C AT EACH TAP ================= */}
          {/* Terminal Node A: Junction dot & badge at Leg A output (220, 165) */}
          <circle cx={legX.A} cy={yTap.A} r="5.5" fill={phaseColors.A} stroke="#ffffff" strokeWidth="2" />
          <rect x={legX.A - 11} y={yTap.A - 22} width="22" height="15" rx="3" fill={isDark ? "#1e293b" : "#f1f5f9"} stroke={phaseColors.A} strokeWidth="1.2" />
          <text x={legX.A} y={yTap.A - 11} fill={phaseColors.A} fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
            A
          </text>

          {/* Terminal Node B: Junction dot & badge at Leg B output (390, 205) */}
          <circle cx={legX.B} cy={yTap.B} r="5.5" fill={phaseColors.B} stroke="#ffffff" strokeWidth="2" />
          <rect x={legX.B - 11} y={yTap.B - 22} width="22" height="15" rx="3" fill={isDark ? "#1e293b" : "#f1f5f9"} stroke={phaseColors.B} strokeWidth="1.2" />
          <text x={legX.B} y={yTap.B - 11} fill={phaseColors.B} fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
            B
          </text>

          {/* Terminal Node C: Junction dot & badge at Leg C output (560, 245) */}
          <circle cx={legX.C} cy={yTap.C} r="5.5" fill={phaseColors.C} stroke="#ffffff" strokeWidth="2" />
          <rect x={legX.C - 11} y={yTap.C - 22} width="22" height="15" rx="3" fill={isDark ? "#1e293b" : "#f1f5f9"} stroke={phaseColors.C} strokeWidth="1.2" />
          <text x={legX.C} y={yTap.C - 11} fill={phaseColors.C} fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
            C
          </text>

          {/* ================= 3-PHASE STAR LOAD (Y) ================= */}
          <g id="load-box" transform="translate(730, 115)">
            <rect x="0" y="0" width="205" height="180" rx="8" fill={isDark ? "#0f172a" : "#f8fafc"} stroke={isDark ? "#334155" : "#cbd5e1"} strokeWidth="1.5" />
            <text x="102" y="22" fill={isDark ? "#94a3b8" : "#334155"} fontSize="11" fontWeight="bold" textAnchor="middle">
              3-Phase Star Load (Y)
            </text>
            <text x="102" y="36" fill={isDark ? "#64748b" : "#64748b"} fontSize="9" textAnchor="middle">
              R = {params.loadR}Ω, L = {params.loadL}mH
            </text>

            {/* Load Branch A (at local y = 50, global y = 165) */}
            <g transform="translate(0, 50)">
              <circle cx="0" cy="0" r="4" fill={phaseColors.A} />
              <text x="10" y="3" fill={phaseColors.A} fontSize="10" fontWeight="bold">A</text>
              {/* Resistor */}
              <rect x="26" y="-5" width="28" height="10" fill={isDark ? "#1e293b" : "#e2e8f0"} stroke={phaseColors.A} strokeWidth="1.2" />
              {/* Inductor */}
              <path d="M 54 0 Q 60 -7 66 0 Q 72 -7 78 0 Q 84 -7 90 0 Q 96 -7 102 0" fill="none" stroke={phaseColors.A} strokeWidth="1.5" />
              {/* Line to neutral */}
              <line x1="102" y1="0" x2="140" y2="40" stroke="#64748b" strokeWidth="1.8" className={Math.abs(ia) > 0.1 ? (ia > 0 ? 'flow-active' : 'flow-active-rev') : ''} />
            </g>

            {/* Load Branch B (at local y = 90, global y = 205) */}
            <g transform="translate(0, 90)">
              <circle cx="0" cy="0" r="4" fill={phaseColors.B} />
              <text x="10" y="3" fill={phaseColors.B} fontSize="10" fontWeight="bold">B</text>
              <rect x="26" y="-5" width="28" height="10" fill={isDark ? "#1e293b" : "#e2e8f0"} stroke={phaseColors.B} strokeWidth="1.2" />
              <path d="M 54 0 Q 60 -7 66 0 Q 72 -7 78 0 Q 84 -7 90 0 Q 96 -7 102 0" fill="none" stroke={phaseColors.B} strokeWidth="1.5" />
              <line x1="102" y1="0" x2="140" y2="0" stroke="#64748b" strokeWidth="1.8" className={Math.abs(ib) > 0.1 ? (ib > 0 ? 'flow-active' : 'flow-active-rev') : ''} />
            </g>

            {/* Load Branch C (at local y = 130, global y = 245) */}
            <g transform="translate(0, 130)">
              <circle cx="0" cy="0" r="4" fill={phaseColors.C} />
              <text x="10" y="3" fill={phaseColors.C} fontSize="10" fontWeight="bold">C</text>
              <rect x="26" y="-5" width="28" height="10" fill={isDark ? "#1e293b" : "#e2e8f0"} stroke={phaseColors.C} strokeWidth="1.2" />
              <path d="M 54 0 Q 60 -7 66 0 Q 72 -7 78 0 Q 84 -7 90 0 Q 96 -7 102 0" fill="none" stroke={phaseColors.C} strokeWidth="1.5" />
              <line x1="102" y1="0" x2="140" y2="-40" stroke="#64748b" strokeWidth="1.8" className={Math.abs(ic) > 0.1 ? (ic > 0 ? 'flow-active' : 'flow-active-rev') : ''} />
            </g>

            {/* Neutral point n */}
            <circle cx="145" cy="90" r="5" fill="#a855f7" />
            <text x="155" y="94" fill="#a855f7" fontSize="11" fontWeight="bold" fontFamily="monospace">n</text>
            <text x="145" y="112" fill="#a855f7" fontSize="8" textAnchor="middle">Neutral</text>
          </g>
        </svg>
      </div>

      {/* Real-time 6-Switch Gate State & Conduction Path Matrix */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 mt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        {/* Phase A Leg Card */}
        <div className={`p-3 rounded-lg border flex flex-col justify-between ${
          isDark ? 'bg-slate-950/70 border-rose-900/40' : 'bg-rose-50/50 border-rose-200'
        }`}>
          <div className={`flex items-center justify-between pb-2 mb-2 border-b ${isDark ? 'border-rose-900/30' : 'border-rose-200'}`}>
            <span className="font-bold text-xs text-rose-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> Phase Leg A
            </span>
            <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              ia = <strong className={ia >= 0 ? "text-rose-500" : "text-sky-500"}>{ia >= 0 ? `+${ia.toFixed(2)}` : ia.toFixed(2)}A</strong>
            </span>
          </div>

          <div className="space-y-2 text-[11px] font-mono">
            {/* S1 Switch Row */}
            <div className={`flex items-center justify-between p-1.5 rounded border ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center gap-1.5">
                <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>S₁ (Top):</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  g1
                    ? (isDark ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-emerald-100 text-emerald-700 border border-emerald-300')
                    : (isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400')
                }`}>
                  g₁={g1} {g1 ? '⎍ HIGH (+15V)' : '_ LOW (0V)'}
                </span>
              </div>
              <span className={`font-semibold text-[10px] px-1.5 py-0.2 rounded ${
                switchStates.s1.conducting === 'MOSFET' ? (isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' : 'bg-emerald-100 text-emerald-800 border border-emerald-300') :
                switchStates.s1.conducting === 'DIODE' ? (isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' : 'bg-amber-100 text-amber-800 border border-amber-300') :
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {switchStates.s1.conducting === 'MOSFET' ? 'MOSFET COND' :
                 switchStates.s1.conducting === 'DIODE' ? 'BODY DIODE (D₁)' : 'OFF'}
              </span>
            </div>

            {/* S2 Switch Row */}
            <div className={`flex items-center justify-between p-1.5 rounded border ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center gap-1.5">
                <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>S₂ (Bot):</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  g2
                    ? (isDark ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-emerald-100 text-emerald-700 border border-emerald-300')
                    : (isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400')
                }`}>
                  g₂={g2} {g2 ? '⎍ HIGH (+15V)' : '_ LOW (0V)'}
                </span>
              </div>
              <span className={`font-semibold text-[10px] px-1.5 py-0.2 rounded ${
                switchStates.s2.conducting === 'MOSFET' ? (isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' : 'bg-emerald-100 text-emerald-800 border border-emerald-300') :
                switchStates.s2.conducting === 'DIODE' ? (isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' : 'bg-amber-100 text-amber-800 border border-amber-300') :
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {switchStates.s2.conducting === 'MOSFET' ? 'MOSFET COND' :
                 switchStates.s2.conducting === 'DIODE' ? 'BODY DIODE (D₂)' : 'OFF'}
              </span>
            </div>

            <div className={`flex justify-between pt-1 text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span>vAO = {vAO >= 0 ? `+${vAO.toFixed(0)}` : vAO.toFixed(0)}V</span>
              <span>vAn = {vAn >= 0 ? `+${vAn.toFixed(1)}` : vAn.toFixed(1)}V</span>
            </div>
          </div>
        </div>

        {/* Phase B Leg Card */}
        <div className={`p-3 rounded-lg border flex flex-col justify-between ${
          isDark ? 'bg-slate-950/70 border-emerald-900/40' : 'bg-emerald-50/50 border-emerald-200'
        }`}>
          <div className={`flex items-center justify-between pb-2 mb-2 border-b ${isDark ? 'border-emerald-900/30' : 'border-emerald-200'}`}>
            <span className="font-bold text-xs text-emerald-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Phase Leg B
            </span>
            <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              ib = <strong className={ib >= 0 ? "text-emerald-500" : "text-sky-500"}>{ib >= 0 ? `+${ib.toFixed(2)}` : ib.toFixed(2)}A</strong>
            </span>
          </div>

          <div className="space-y-2 text-[11px] font-mono">
            {/* S3 Switch Row */}
            <div className={`flex items-center justify-between p-1.5 rounded border ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center gap-1.5">
                <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>S₃ (Top):</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  g3
                    ? (isDark ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-emerald-100 text-emerald-700 border border-emerald-300')
                    : (isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400')
                }`}>
                  g₃={g3} {g3 ? '⎍ HIGH (+15V)' : '_ LOW (0V)'}
                </span>
              </div>
              <span className={`font-semibold text-[10px] px-1.5 py-0.2 rounded ${
                switchStates.s3.conducting === 'MOSFET' ? (isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' : 'bg-emerald-100 text-emerald-800 border border-emerald-300') :
                switchStates.s3.conducting === 'DIODE' ? (isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' : 'bg-amber-100 text-amber-800 border border-amber-300') :
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {switchStates.s3.conducting === 'MOSFET' ? 'MOSFET COND' :
                 switchStates.s3.conducting === 'DIODE' ? 'BODY DIODE (D₃)' : 'OFF'}
              </span>
            </div>

            {/* S4 Switch Row */}
            <div className={`flex items-center justify-between p-1.5 rounded border ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center gap-1.5">
                <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>S₄ (Bot):</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  g4
                    ? (isDark ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-emerald-100 text-emerald-700 border border-emerald-300')
                    : (isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400')
                }`}>
                  g₄={g4} {g4 ? '⎍ HIGH (+15V)' : '_ LOW (0V)'}
                </span>
              </div>
              <span className={`font-semibold text-[10px] px-1.5 py-0.2 rounded ${
                switchStates.s4.conducting === 'MOSFET' ? (isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' : 'bg-emerald-100 text-emerald-800 border border-emerald-300') :
                switchStates.s4.conducting === 'DIODE' ? (isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' : 'bg-amber-100 text-amber-800 border border-amber-300') :
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {switchStates.s4.conducting === 'MOSFET' ? 'MOSFET COND' :
                 switchStates.s4.conducting === 'DIODE' ? 'BODY DIODE (D₄)' : 'OFF'}
              </span>
            </div>

            <div className={`flex justify-between pt-1 text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span>vBO = {vBO >= 0 ? `+${vBO.toFixed(0)}` : vBO.toFixed(0)}V</span>
              <span>vBn = {vBn >= 0 ? `+${vBn.toFixed(1)}` : vBn.toFixed(1)}V</span>
            </div>
          </div>
        </div>

        {/* Phase C Leg Card */}
        <div className={`p-3 rounded-lg border flex flex-col justify-between ${
          isDark ? 'bg-slate-950/70 border-sky-900/40' : 'bg-sky-50/50 border-sky-200'
        }`}>
          <div className={`flex items-center justify-between pb-2 mb-2 border-b ${isDark ? 'border-sky-900/30' : 'border-sky-200'}`}>
            <span className="font-bold text-xs text-sky-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span> Phase Leg C
            </span>
            <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              ic = <strong className={ic >= 0 ? "text-sky-500" : "text-amber-500"}>{ic >= 0 ? `+${ic.toFixed(2)}` : ic.toFixed(2)}A</strong>
            </span>
          </div>

          <div className="space-y-2 text-[11px] font-mono">
            {/* S5 Switch Row */}
            <div className={`flex items-center justify-between p-1.5 rounded border ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center gap-1.5">
                <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>S₅ (Top):</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  g5
                    ? (isDark ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-emerald-100 text-emerald-700 border border-emerald-300')
                    : (isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400')
                }`}>
                  g₅={g5} {g5 ? '⎍ HIGH (+15V)' : '_ LOW (0V)'}
                </span>
              </div>
              <span className={`font-semibold text-[10px] px-1.5 py-0.2 rounded ${
                switchStates.s5.conducting === 'MOSFET' ? (isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' : 'bg-emerald-100 text-emerald-800 border border-emerald-300') :
                switchStates.s5.conducting === 'DIODE' ? (isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' : 'bg-amber-100 text-amber-800 border border-amber-300') :
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {switchStates.s5.conducting === 'MOSFET' ? 'MOSFET COND' :
                 switchStates.s5.conducting === 'DIODE' ? 'BODY DIODE (D₅)' : 'OFF'}
              </span>
            </div>

            {/* S6 Switch Row */}
            <div className={`flex items-center justify-between p-1.5 rounded border ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center gap-1.5">
                <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>S₆ (Bot):</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  g6
                    ? (isDark ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-emerald-100 text-emerald-700 border border-emerald-300')
                    : (isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400')
                }`}>
                  g₆={g6} {g6 ? '⎍ HIGH (+15V)' : '_ LOW (0V)'}
                </span>
              </div>
              <span className={`font-semibold text-[10px] px-1.5 py-0.2 rounded ${
                switchStates.s6.conducting === 'MOSFET' ? (isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' : 'bg-emerald-100 text-emerald-800 border border-emerald-300') :
                switchStates.s6.conducting === 'DIODE' ? (isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' : 'bg-amber-100 text-amber-800 border border-amber-300') :
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {switchStates.s6.conducting === 'MOSFET' ? 'MOSFET COND' :
                 switchStates.s6.conducting === 'DIODE' ? 'BODY DIODE (D₆)' : 'OFF'}
              </span>
            </div>

            <div className={`flex justify-between pt-1 text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span>vCO = {vCO >= 0 ? `+${vCO.toFixed(0)}` : vCO.toFixed(0)}V</span>
              <span>vCn = {vCn >= 0 ? `+${vCn.toFixed(1)}` : vCn.toFixed(1)}V</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Renders an entire phase leg with:
 * 1. Dedicated Gate Driver blocks (g_top, g_bot)
 * 2. Physical gate connection lines leading directly into Gate pin G
 * 3. Power MOSFET symbol & Anti-Parallel body diode
 * 4. Dual status badge: Gate State [HIGH/LOW] & Conduction State [MOSFET/DIODE/OFF]
 */
function renderPhaseLegWithGateDriver(
  x: number,
  phase: 'A' | 'B' | 'C',
  topSwitch: SwitchStateDetail,
  botSwitch: SwitchStateDetail,
  currentVal: number,
  phaseColor: string,
  yTap: number,
  isDark: boolean
) {
  const isTopActive = topSwitch.conducting !== 'OFF';
  const isBotActive = botSwitch.conducting !== 'OFF';

  return (
    <g key={phase} id={`leg-${phase}`}>
      {/* Top connection from +Vdc/2 to top switch */}
      <line
        x1={x}
        y1="35"
        x2={x}
        y2="50"
        stroke={isTopActive ? '#f59e0b' : isDark ? '#334155' : '#cbd5e1'}
        strokeWidth={isTopActive ? 3.5 : 1.8}
        className={isTopActive && Math.abs(currentVal) > 0.1 ? (currentVal > 0 ? 'flow-active' : 'flow-active-rev') : ''}
      />
      <circle cx={x} cy="35" r="3.5" fill={isTopActive ? '#f59e0b' : isDark ? '#475569' : '#94a3b8'} />

      {/* TOP SWITCH MODULE (y: 50 to 142) WITH GATE DRIVER */}
      {renderSwitchModule(
        x,
        50,
        topSwitch,
        phaseColor,
        phase,
        isDark,
        currentVal
      )}

      {/* Connection from Top Switch to Tap Point (y: 142 to yTap) */}
      <line
        x1={x}
        y1="142"
        x2={x}
        y2={yTap}
        stroke={isTopActive ? phaseColor : isDark ? '#334155' : '#cbd5e1'}
        strokeWidth={isTopActive ? 3.5 : 1.5}
        className={isTopActive && Math.abs(currentVal) > 0.1 ? (currentVal > 0 ? 'flow-active' : 'flow-active-rev') : ''}
      />

      {/* Connection from Bottom Switch to Tap Point (y: 260 to yTap) */}
      <line
        x1={x}
        y1="260"
        x2={x}
        y2={yTap}
        stroke={isBotActive ? phaseColor : isDark ? '#334155' : '#cbd5e1'}
        strokeWidth={isBotActive ? 3.5 : 1.5}
        className={isBotActive && Math.abs(currentVal) > 0.1 ? (currentVal > 0 ? 'flow-active' : 'flow-active-rev') : ''}
      />

      {/* BOTTOM SWITCH MODULE (y: 260 to 352) WITH GATE DRIVER */}
      {renderSwitchModule(
        x,
        260,
        botSwitch,
        phaseColor,
        phase,
        isDark,
        currentVal
      )}

      {/* Bottom connection from bottom switch to -Vdc/2 */}
      <line
        x1={x}
        y1="352"
        x2={x}
        y2="375"
        stroke={isBotActive ? (isDark ? '#94a3b8' : '#475569') : isDark ? '#334155' : '#cbd5e1'}
        strokeWidth={isBotActive ? 3.5 : 1.8}
        className={isBotActive && Math.abs(currentVal) > 0.1 ? (currentVal > 0 ? 'flow-active' : 'flow-active-rev') : ''}
      />
      <circle cx={x} cy="375" r="3.5" fill={isBotActive ? (isDark ? '#94a3b8' : '#475569') : isDark ? '#334155' : '#cbd5e1'} />
    </g>
  );
}

/**
 * Renders a complete switch unit with:
 * - Driver terminal block with gate signal label (g1..g6)
 * - Physical driver wire from driver block output to MOSFET gate pin G
 * - Power MOSFET transistor symbol (D, G, S terminals)
 * - Anti-parallel freewheeling body diode
 * - Decoupled status badges: [Gate: HIGH/LOW] and [Conducting: MOSFET/DIODE/OFF]
 */
function renderSwitchModule(
  cx: number,
  topY: number,
  sw: SwitchStateDetail,
  phaseColor: string,
  phase: string,
  isDark: boolean = true,
  currentVal: number = 0
) {
  const isGated = sw.gate === 'HIGH';
  const isMosfetActive = sw.conducting === 'MOSFET';
  const isDiodeActive = sw.conducting === 'DIODE';
  const isConducting = isMosfetActive || isDiodeActive;

  // Driver block coordinate: placed to the left of the switch
  const driverW = 44;
  const driverH = 34;
  const driverX = cx - 74;
  const driverY = topY + 28;

  // Gate Pin G position inside MOSFET
  const mosX = cx - 12;
  const dioX = cx + 22;
  const gatePinX = mosX - 4;
  const gatePinY = topY + 45;

  const yIn = topY;
  const yOut = topY + 92;
  const yBranchTop = topY + 12;
  const yBranchBot = topY + 80;

  // Colors
  const gateColor = isGated ? '#10b981' : isDark ? '#64748b' : '#94a3b8';
  const mosColor = isMosfetActive ? '#10b981' : isGated ? '#34d399' : isDark ? '#64748b' : '#94a3b8';
  const diodeColor = isDiodeActive ? '#fbbf24' : isDark ? '#64748b' : '#94a3b8';
  const diodeFill = isDiodeActive ? '#f59e0b' : isDark ? '#1e293b' : '#e2e8f0';

  return (
    <g id={`switch-${sw.id}`}>
      {/* ================= 1. GATE DRIVER BLOCK ================= */}
      <g transform={`translate(${driverX}, ${driverY})`}>
        {/* Driver Box Housing */}
        <rect
          x="0"
          y="0"
          width={driverW}
          height={driverH}
          rx="4"
          fill={isGated ? (isDark ? '#062e24' : '#ecfdf5') : isDark ? '#0f172a' : '#f1f5f9'}
          stroke={isGated ? '#10b981' : isDark ? '#334155' : '#cbd5e1'}
          strokeWidth={isGated ? 1.5 : 1}
          style={isGated ? { filter: 'url(#glow-gate)' } : {}}
        />

        {/* Driver Chip Notch / Top Indicator */}
        <circle cx={driverW / 2} cy="3" r="1.5" fill={isGated ? '#34d399' : '#64748b'} />

        {/* Gate Signal Name (e.g. g1, g4, g3, g6, g5, g2) */}
        <text
          x={driverW / 2}
          y="15"
          fill={isGated ? (isDark ? '#a7f3d0' : '#065f46') : isDark ? '#94a3b8' : '#475569'}
          fontSize="10"
          fontWeight="bold"
          fontFamily="monospace"
          textAnchor="middle"
        >
          {sw.gateLabel}
        </text>

        {/* Dynamic Gate Status: ⎍ HIGH / _ LOW */}
        <text
          x={driverW / 2}
          y="26"
          fill={isGated ? '#10b981' : isDark ? '#64748b' : '#94a3b8'}
          fontSize="7.5"
          fontWeight="bold"
          fontFamily="monospace"
          textAnchor="middle"
        >
          {isGated ? '⎍ HIGH' : '_ LOW'}
        </text>
      </g>

      {/* Driver Output Terminal Dot */}
      <circle cx={driverX + driverW} cy={gatePinY} r="2.5" fill={gateColor} />

      {/* ================= 2. PHYSICAL GATE DRIVER LINE ================= */}
      <line
        x1={driverX + driverW}
        y1={gatePinY}
        x2={gatePinX}
        y2={gatePinY}
        stroke={gateColor}
        strokeWidth={isGated ? 2.5 : 1.5}
        className={isGated ? 'gate-wire-pulse' : ''}
        style={isGated ? { filter: 'url(#glow-gate)' } : {}}
      />

      {/* Gate Pulse Badge over line */}
      <g transform={`translate(${driverX + driverW + 4}, ${gatePinY - 14})`}>
        <rect
          x="0"
          y="0"
          width="20"
          height="10"
          rx="2"
          fill={isGated ? (isDark ? '#064e3b' : '#d1fae5') : isDark ? '#1e293b' : '#e2e8f0'}
          stroke={isGated ? '#10b981' : isDark ? '#475569' : '#cbd5e1'}
          strokeWidth="0.8"
        />
        <text
          x="10"
          y="7.5"
          fill={isGated ? (isDark ? '#6ee7b7' : '#047857') : isDark ? '#94a3b8' : '#64748b'}
          fontSize="6.5"
          fontWeight="bold"
          fontFamily="monospace"
          textAnchor="middle"
        >
          {isGated ? '+15V' : '0V'}
        </text>
      </g>

      {/* ================= 3. SWITCH MODULE ENCLOSURE ================= */}
      <rect
        x={cx - 28}
        y={topY + 2}
        width="76"
        height="88"
        rx="6"
        fill={isConducting ? (isDark ? '#0b1f2e' : '#f0fdf4') : isDark ? '#090d16' : '#ffffff'}
        stroke={isMosfetActive ? '#10b981' : isDiodeActive ? '#f59e0b' : isGated ? '#3b82f6' : isDark ? '#1e293b' : '#e2e8f0'}
        strokeWidth={isConducting ? 1.8 : 1}
        style={isConducting ? { filter: 'url(#glow-active)' } : {}}
      />

      {/* Switch ID (e.g. S1, S4) and MOSFET label */}
      <text
        x={cx + 10}
        y={topY + 11}
        fill={isConducting ? '#10b981' : isDark ? '#94a3b8' : '#334155'}
        fontSize="9"
        fontWeight="bold"
        fontFamily="monospace"
        textAnchor="middle"
      >
        {sw.id} ({sw.name})
      </text>

      {/* ================= 4. POWER MOSFET SYMBOL ================= */}
      {/* Top entry lead from cx to Drain branch */}
      <line
        x1={cx}
        y1={yIn}
        x2={mosX}
        y2={yIn}
        stroke={isMosfetActive ? '#10b981' : isDark ? '#94a3b8' : '#cbd5e1'}
        strokeWidth={isMosfetActive ? 2.5 : 1.5}
        className={isMosfetActive && Math.abs(currentVal) > 0.1 ? (currentVal > 0 ? 'flow-active' : 'flow-active-rev') : ''}
      />
      <line
        x1={mosX}
        y1={yIn}
        x2={mosX}
        y2={yBranchTop}
        stroke={isMosfetActive ? '#10b981' : mosColor}
        strokeWidth={isMosfetActive ? 2.5 : 1.8}
        className={isMosfetActive && Math.abs(currentVal) > 0.1 ? (currentVal > 0 ? 'flow-active' : 'flow-active-rev') : ''}
      />
      <circle cx={mosX} cy={yBranchTop} r="2.5" fill={isDark ? "#cbd5e1" : "#475569"} />

      {/* Drain Lead & Contact */}
      <line x1={mosX} y1={yBranchTop} x2={mosX} y2={topY + 30} stroke={mosColor} strokeWidth={isMosfetActive ? 2.5 : 1.8} />
      <line x1={mosX - 2} y1={topY + 30} x2={mosX + 6} y2={topY + 30} stroke={mosColor} strokeWidth={2} />
      <text x={mosX + 9} y={topY + 32} fill={mosColor} fontSize="7" fontFamily="monospace" fontWeight="bold">D</text>

      {/* Insulated Gate Plate & Pin G */}
      <line x1={mosX - 3} y1={topY + 28} x2={mosX - 3} y2={topY + 62} stroke={gateColor} strokeWidth="1.8" />
      <line x1={mosX - 3} y1={gatePinY} x2={gatePinX} y2={gatePinY} stroke={gateColor} strokeWidth="2" />
      <circle cx={gatePinX} cy={gatePinY} r="2.2" fill={gateColor} />
      <text x={gatePinX - 4} y={gatePinY + 2.5} fill={gateColor} fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="end">
        G
      </text>

      {/* 3 Channel Segments at x = mosX + 4 */}
      <line x1={mosX + 4} y1={topY + 28} x2={mosX + 4} y2={topY + 36} stroke={mosColor} strokeWidth="2.5" />
      <line x1={mosX + 4} y1={topY + 41} x2={mosX + 4} y2={topY + 49} stroke={mosColor} strokeWidth="2.5" />
      <line x1={mosX + 4} y1={gatePinY} x2={mosX + 11} y2={gatePinY} stroke={mosColor} strokeWidth="1.5" />
      <polygon
        points={`${mosX + 4},${gatePinY} ${mosX + 9},${gatePinY - 3} ${mosX + 9},${gatePinY + 3}`}
        fill={mosColor}
      />
      <line x1={mosX + 11} y1={gatePinY} x2={mosX + 11} y2={topY + 60} stroke={mosColor} strokeWidth="1.5" />
      <line x1={mosX + 11} y1={topY + 60} x2={mosX + 4} y2={topY + 60} stroke={mosColor} strokeWidth="1.5" />

      {/* Bottom Segment (Source) */}
      <line x1={mosX + 4} y1={topY + 54} x2={mosX + 4} y2={topY + 62} stroke={mosColor} strokeWidth="2.5" />
      <line x1={mosX - 2} y1={topY + 60} x2={mosX + 6} y2={topY + 60} stroke={mosColor} strokeWidth="2" />
      <text x={mosX + 9} y={topY + 64} fill={mosColor} fontSize="7" fontFamily="monospace" fontWeight="bold">S</text>

      {/* Source Lead & Exit Node */}
      <line
        x1={mosX}
        y1={topY + 60}
        x2={mosX}
        y2={yBranchBot}
        stroke={isMosfetActive ? '#10b981' : mosColor}
        strokeWidth={isMosfetActive ? 2.5 : 1.8}
        className={isMosfetActive && Math.abs(currentVal) > 0.1 ? (currentVal > 0 ? 'flow-active' : 'flow-active-rev') : ''}
      />
      <circle cx={mosX} cy={yBranchBot} r="2.5" fill={isDark ? "#cbd5e1" : "#475569"} />
      <line
        x1={mosX}
        y1={yBranchBot}
        x2={mosX}
        y2={yOut}
        stroke={isMosfetActive ? '#10b981' : mosColor}
        strokeWidth={isMosfetActive ? 2.5 : 1.8}
        className={isMosfetActive && Math.abs(currentVal) > 0.1 ? (currentVal > 0 ? 'flow-active' : 'flow-active-rev') : ''}
      />
      <line
        x1={mosX}
        y1={yOut}
        x2={cx}
        y2={yOut}
        stroke={isMosfetActive ? '#10b981' : isDark ? '#94a3b8' : '#cbd5e1'}
        strokeWidth={isMosfetActive ? 2.5 : 1.5}
        className={isMosfetActive && Math.abs(currentVal) > 0.1 ? (currentVal > 0 ? 'flow-active' : 'flow-active-rev') : ''}
      />

      {/* ================= 5. ANTI-PARALLEL BODY DIODE ================= */}
      <line
        x1={mosX}
        y1={yBranchTop}
        x2={dioX}
        y2={yBranchTop}
        stroke={isDiodeActive ? '#f59e0b' : isDark ? '#94a3b8' : '#cbd5e1'}
        strokeWidth={isDiodeActive ? 2 : 1.5}
        className={isDiodeActive && Math.abs(currentVal) > 0.1 ? 'flow-active-rev' : ''}
      />
      <line
        x1={dioX}
        y1={yBranchTop}
        x2={dioX}
        y2={topY + 37}
        stroke={diodeColor}
        strokeWidth={isDiodeActive ? 2 : 1.5}
        className={isDiodeActive && Math.abs(currentVal) > 0.1 ? 'flow-active-rev' : ''}
      />

      {/* Diode Cathode Bar (tied to Drain) */}
      <line x1={dioX - 7} y1={topY + 37} x2={dioX + 7} y2={topY + 37} stroke={diodeColor} strokeWidth="2" />

      {/* Diode Triangle pointing UPWARDS (Anode at Source, Cathode at Drain) */}
      <polygon
        points={`${dioX},${topY + 37} ${dioX - 7},${topY + 53} ${dioX + 7},${topY + 53}`}
        fill={diodeFill}
        stroke={diodeColor}
        strokeWidth={isDiodeActive ? 2 : 1.5}
        style={isDiodeActive ? { filter: 'url(#glow-active)' } : {}}
      />

      {/* Diode Anode Lead to Source */}
      <line
        x1={dioX}
        y1={topY + 53}
        x2={dioX}
        y2={yBranchBot}
        stroke={diodeColor}
        strokeWidth={isDiodeActive ? 2 : 1.5}
        className={isDiodeActive && Math.abs(currentVal) > 0.1 ? 'flow-active-rev' : ''}
      />
      <line
        x1={dioX}
        y1={yBranchBot}
        x2={mosX}
        y2={yBranchBot}
        stroke={isDiodeActive ? '#f59e0b' : isDark ? '#94a3b8' : '#cbd5e1'}
        strokeWidth={isDiodeActive ? 2 : 1.5}
        className={isDiodeActive && Math.abs(currentVal) > 0.1 ? 'flow-active-rev' : ''}
      />

      {/* Diode Tag */}
      <text
        x={dioX + 9}
        y={topY + 47}
        fill={isDiodeActive ? '#fbbf24' : isDark ? '#94a3b8' : '#64748b'}
        fontSize="7.5"
        fontWeight="bold"
        fontFamily="monospace"
        textAnchor="start"
      >
        {sw.id.replace('S', 'D')}
      </text>

      {/* ================= 6. DECOUPLED CONDUCTION STATUS BADGE ================= */}
      <g transform={`translate(${cx + 10}, ${topY + 80})`}>
        <rect
          x="-34"
          y="-9"
          width="68"
          height="14"
          rx="3"
          fill={
            isMosfetActive ? (isDark ? '#064e3b' : '#d1fae5') :
            isDiodeActive ? (isDark ? '#78350f' : '#fef3c7') :
            isDark ? '#1e293b' : '#f1f5f9'
          }
          stroke={
            isMosfetActive ? '#10b981' :
            isDiodeActive ? '#f59e0b' :
            isDark ? '#334155' : '#cbd5e1'
          }
          strokeWidth="0.8"
        />
        <text
          x="0"
          y="1"
          fill={
            isMosfetActive ? (isDark ? '#34d399' : '#047857') :
            isDiodeActive ? (isDark ? '#fbbf24' : '#b45309') :
            isDark ? '#64748b' : '#64748b'
          }
          fontSize="7"
          fontFamily="monospace"
          fontWeight="bold"
          textAnchor="middle"
        >
          {isMosfetActive ? 'MOSFET COND' : isDiodeActive ? 'BODY DIODE' : isGated ? 'GATED / OFF' : 'OFF'}
        </text>
      </g>
    </g>
  );
}
