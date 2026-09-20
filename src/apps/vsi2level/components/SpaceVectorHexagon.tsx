import React from 'react';
import { InstantState, Theme, VsiParameters } from '../types';
import { Target, Maximize2, Minimize2, Columns2 } from 'lucide-react';

interface SpaceVectorHexagonProps {
  params: VsiParameters;
  instantState: InstantState;
  theme?: Theme;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  onSelectSideBySide?: (pairedWith: 'circuit' | 'scope') => void;
}

export const SpaceVectorHexagon: React.FC<SpaceVectorHexagonProps> = ({
  params,
  instantState,
  theme = 'dark',
  isFullScreen = false,
  onToggleFullScreen,
  onSelectSideBySide
}) => {
  const isDark = theme !== 'light';
  const {
    theta,
    vectorName,
    sector = 1,
    sa,
    sb,
    sc,
    vAlpha: stateVAlpha,
    vBeta: stateVBeta,
    thetaSv: stateThetaSv,
    vaSin,
    vbSin,
    vcSin
  } = instantState;
  const { ma } = params;

  // Hexagon active vector definitions: angle in deg and binary switching state [Sa, Sb, Sc]
  // In stationary α-β plane:
  // V1 [100] = 0° (along positive α-axis)
  // V2 [110] = 60°
  // V3 [010] = 120°
  // V4 [011] = 180°
  // V5 [001] = 240°
  // V6 [101] = 300°
  const vectors = [
    { id: 1, name: 'V₁ [100]', angleDeg: 0, s: [1, 0, 0] },
    { id: 2, name: 'V₂ [110]', angleDeg: 60, s: [1, 1, 0] },
    { id: 3, name: 'V₃ [010]', angleDeg: 120, s: [0, 1, 0] },
    { id: 4, name: 'V₄ [011]', angleDeg: 180, s: [0, 1, 1] },
    { id: 5, name: 'V₅ [001]', angleDeg: 240, s: [0, 0, 1] },
    { id: 6, name: 'V₆ [101]', angleDeg: 300, s: [1, 0, 1] }
  ];

  // Hexagon geometry centered at (0, 0) with radius R
  // In a viewBox of -250 to +250 (500x500), R = 150 gives ample breathing room for all labels
  const R = 150;
  const cx = 0;
  const cy = 0;

  // Reference space vector coordinates in α-β plane via Clarke transformation
  const vAlpha = stateVAlpha ?? ((2 / 3) * (vaSin - 0.5 * vbSin - 0.5 * vcSin));
  const vBeta = stateVBeta ?? ((vbSin - vcSin) / Math.sqrt(3));

  let thetaSv = stateThetaSv;
  if (thetaSv === undefined) {
    thetaSv = Math.atan2(vBeta, vAlpha);
    if (thetaSv < 0) thetaSv += 2 * Math.PI;
  }
  const thetaSvDeg = ((thetaSv * 180) / Math.PI + 360) % 360;

  // Active sector (1..6) that contains V*:
  // Sector 1: [0°, 60°)   -> bounded by V₁ and V₂
  // Sector 2: [60°, 120°)  -> bounded by V₂ and V₃
  // Sector 3: [120°, 180°) -> bounded by V₃ and V₄
  // Sector 4: [180°, 240°) -> bounded by V₄ and V₅
  // Sector 5: [240°, 300°) -> bounded by V₅ and V₆
  // Sector 6: [300°, 360°) -> bounded by V₆ and V₁
  const currentSector = Math.min(6, Math.max(1, Math.floor(thetaSvDeg / 60) + 1));

  const sectorConfigs: Record<number, { v1Id: number; v2Id: number; label: string }> = {
    1: { v1Id: 1, v2Id: 2, label: 'Sector 1 (V₁–V₂)' },
    2: { v1Id: 2, v2Id: 3, label: 'Sector 2 (V₂–V₃)' },
    3: { v1Id: 3, v2Id: 4, label: 'Sector 3 (V₃–V₄)' },
    4: { v1Id: 4, v2Id: 5, label: 'Sector 4 (V₄–V₅)' },
    5: { v1Id: 5, v2Id: 6, label: 'Sector 5 (V₅–V₆)' },
    6: { v1Id: 6, v2Id: 1, label: 'Sector 6 (V₆–V₁)' }
  };
  const activeSectorConfig = sectorConfigs[currentSector] || sectorConfigs[1];

  const sectorSequences: Record<number, string> = {
    1: 'V₀(000) → V₁(100) → V₂(110) → V₇(111) → V₂(110) → V₁(100) → V₀(000)',
    2: 'V₀(000) → V₃(010) → V₂(110) → V₇(111) → V₂(110) → V₃(010) → V₀(000)',
    3: 'V₀(000) → V₃(010) → V₄(011) → V₇(111) → V₄(011) → V₃(010) → V₀(000)',
    4: 'V₀(000) → V₅(001) → V₄(011) → V₇(111) → V₄(011) → V₅(001) → V₀(000)',
    5: 'V₀(000) → V₅(001) → V₆(101) → V₇(111) → V₆(101) → V₅(001) → V₀(000)',
    6: 'V₀(000) → V₁(100) → V₆(101) → V₇(111) → V₆(101) → V₁(100) → V₀(000)'
  };

  // Vertices of the active triangular sector (formed by origin V0/V7 and 2 boundary vectors)
  const boundV1 = vectors.find(v => v.id === activeSectorConfig.v1Id)!;
  const boundV2 = vectors.find(v => v.id === activeSectorConfig.v2Id)!;
  const rad1 = (boundV1.angleDeg * Math.PI) / 180;
  const rad2 = (boundV2.angleDeg * Math.PI) / 180;
  const triX1 = R * Math.cos(rad1);
  const triY1 = -R * Math.sin(rad1);
  const triX2 = R * Math.cos(rad2);
  const triY2 = -R * Math.sin(rad2);

  // Rotating reference vector tip position (Orange hand V*)
  // Fundamental peak voltage |V*| = ma * (Vdc / 2), so |V*| / (2/3 Vdc) = 0.75 * ma.
  // At ma = 1.0 (SPWM linear limit), radius = 0.75 * R.
  // At ma = 1.155 (SVPWM linear limit), radius = 0.75 * 1.155 * R = 0.866 * R (touches inscribed circle).
  const scale = R * 0.75;
  const vRefX = scale * vAlpha;
  const vRefY = -scale * vBeta; // SVG Y is inverted (upwards is positive beta)

  // Active switching vector tip position (Blue hand)
  let activeX = 0;
  let activeY = 0;
  const activeVec = vectors.find(v => v.s[0] === sa && v.s[1] === sb && v.s[2] === sc);
  const isZeroVector = !activeVec; // V0 [000] or V7 [111]
  if (activeVec) {
    const rad = (activeVec.angleDeg * Math.PI) / 180;
    activeX = R * Math.cos(rad);
    activeY = -R * Math.sin(rad);
  }

  // Hexagon vertex path
  const hexPoints = vectors.map(v => {
    const rad = (v.angleDeg * Math.PI) / 180;
    return `${R * Math.cos(rad)},${-R * Math.sin(rad)}`;
  }).join(' ');

  // Sector labels positions (S1..S6 inside each wedge)
  const sectorWedges = [1, 2, 3, 4, 5, 6].map(s => {
    const midAngle = (s - 1) * 60 + 30;
    const midRad = (midAngle * Math.PI) / 180;
    return {
      sector: s,
      x: R * 0.45 * Math.cos(midRad),
      y: -R * 0.45 * Math.sin(midRad)
    };
  });

  return (
    <div
      id="space-vector-hexagon"
      className={`rounded-xl p-3 sm:p-4 shadow-xl flex flex-col justify-between border transition-colors h-full ${
        isFullScreen
          ? 'min-h-[720px] lg:min-h-[820px] 2xl:min-h-[880px]'
          : 'min-h-[480px] sm:min-h-[540px] xl:min-h-[600px] 2xl:min-h-[680px]'
      } ${
        isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* Header bar */}
      <div className={`flex items-center justify-between pb-2 mb-1 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/20 text-indigo-500 rounded-lg border border-indigo-500/30">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className={`text-xs font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Space Vector Hexagon (α-β Plane)</h3>
            <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>8 Inverter states (V₀..V₇) & Active Sector Triangle</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-xs font-mono px-2 py-0.5 rounded font-bold border ${
            isDark ? 'bg-sky-950/70 text-sky-300 border-sky-800/60' : 'bg-sky-100 text-sky-800 border-sky-300'
          }`}>
            {activeSectorConfig.label}
          </span>

          {/* Side-by-Side and Full Screen Action Buttons */}
          {onSelectSideBySide && (
            <div className={`flex items-center gap-0.5 p-0.5 rounded-lg border text-xs ${
              isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-300'
            }`}>
              <span className={`text-[10px] font-mono px-1 flex items-center gap-0.5 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                <Columns2 className="w-3 h-3 text-indigo-400" /> Split:
              </span>
              <button
                onClick={() => onSelectSideBySide('circuit')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-white text-slate-700'
                }`}
                title="Side-by-side with Two-Level Power Stage Circuit"
              >
                + Circuit
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
              title={isFullScreen ? 'Exit full screen (Return to Dashboard)' : 'Toggle Full Screen Space Vector'}
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

      {/* SVG Canvas wrapper: Flexibly sized to fit full container space without clipping */}
      <div className="flex-1 flex items-center justify-center my-auto w-full relative min-h-0 py-2">
        <svg
          viewBox="-250 -250 500 500"
          className={`w-full h-full select-none transition-all object-contain ${
            isFullScreen
              ? 'max-w-[760px] max-h-[760px] 2xl:max-w-[860px] 2xl:max-h-[860px]'
              : 'max-w-[480px] max-h-[480px] sm:max-w-[520px] sm:max-h-[520px] xl:max-w-[580px] xl:max-h-[580px] 2xl:max-w-[660px] 2xl:max-h-[660px]'
          }`}
        >
          {/* Alpha & Beta Axes */}
          <line x1="-215" y1="0" x2="215" y2="0" stroke={isDark ? "#334155" : "#cbd5e1"} strokeWidth="1.2" strokeDasharray="3 3" />
          <line x1="0" y1="215" x2="0" y2="-215" stroke={isDark ? "#334155" : "#cbd5e1"} strokeWidth="1.2" strokeDasharray="3 3" />
          <text x="220" y="4" fill={isDark ? "#94a3b8" : "#64748b"} fontSize="12" fontWeight="bold" fontFamily="monospace">α</text>
          <text x="4" y="-220" fill={isDark ? "#94a3b8" : "#64748b"} fontSize="12" fontWeight="bold" fontFamily="monospace">β</text>

          {/* Hexagon Boundary */}
          <polygon
            points={hexPoints}
            fill={isDark ? "#0f172a" : "#f8fafc"}
            stroke={isDark ? "#475569" : "#94a3b8"}
            strokeWidth="1.8"
            strokeDasharray="4 2"
          />

          {/* Sector Wedges (S1..S6 subtle markers) */}
          {sectorWedges.map(sw => {
            const isCurr = sw.sector === currentSector;
            return (
              <text
                key={sw.sector}
                x={sw.x}
                y={sw.y}
                fill={isCurr ? (isDark ? '#38bdf8' : '#0284c7') : (isDark ? '#334155' : '#cbd5e1')}
                fontSize={isCurr ? "15" : "13"}
                fontFamily="monospace"
                fontWeight={isCurr ? "bold" : "normal"}
                textAnchor="middle"
                dominantBaseline="central"
                opacity={isCurr ? 0.9 : 0.45}
              >
                S{sw.sector}
              </text>
            );
          })}

          {/* Active Triangular Sector Highlight (Includes origin V0/V7 and 2 boundary vectors) */}
          <polygon
            points={`0,0 ${triX1},${triY1} ${triX2},${triY2}`}
            fill="rgba(14, 165, 233, 0.16)"
            stroke="#0284c7"
            strokeWidth="2"
            strokeDasharray="4 3"
          />

          {/* SPWM Linear Circle (r = 0.75 * R = 0.5 Vdc) */}
          <circle
            cx="0"
            cy="0"
            r={R * 0.75}
            fill="none"
            stroke="#f43f5e"
            strokeWidth="1.2"
            strokeDasharray="3 3"
            opacity="0.45"
          />

          {/* Inscribed Maximum Linear Circle (r = R * 0.866 = 0.577 Vdc) */}
          <circle
            cx="0"
            cy="0"
            r={R * 0.866}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.65"
          />

          {/* Sector Wedges / Vector Radials */}
          {vectors.map((v) => {
            const rad = (v.angleDeg * Math.PI) / 180;
            const x = R * Math.cos(rad);
            const y = -R * Math.sin(rad);
            const isCurrentActive = activeVec?.id === v.id;
            const isSectorBoundary = v.id === activeSectorConfig.v1Id || v.id === activeSectorConfig.v2Id;

            // Offset label cleanly around vertex to ensure zero clipping
            let labelX = x;
            let labelY = y;
            let anchor: 'start' | 'end' | 'middle' = 'middle';

            if (Math.abs(y) < 10) {
              // V1 and V4 on horizontal axis
              if (x > 0) {
                labelX = x + 12;
                labelY = y + 4;
                anchor = 'start';
              } else {
                labelX = x - 12;
                labelY = y + 4;
                anchor = 'end';
              }
            } else if (y < 0) {
              // Top vertices (V2 and V3)
              labelY = y - 12;
              if (x > 0) {
                labelX = x + 8;
                anchor = 'start';
              } else {
                labelX = x - 8;
                anchor = 'end';
              }
            } else {
              // Bottom vertices (V5 and V6)
              labelY = y + 16;
              if (x > 0) {
                labelX = x + 8;
                anchor = 'start';
              } else {
                labelX = x - 8;
                anchor = 'end';
              }
            }

            return (
              <g key={v.id}>
                {/* Sector line from origin */}
                <line
                  x1="0"
                  y1="0"
                  x2={x}
                  y2={y}
                  stroke={isCurrentActive ? '#38bdf8' : isSectorBoundary ? '#0284c7' : '#334155'}
                  strokeWidth={isCurrentActive ? 2.8 : isSectorBoundary ? 1.8 : 1.2}
                />

                {/* Vector vertex dot */}
                <circle
                  cx={x}
                  cy={y}
                  r={isCurrentActive ? 7 : isSectorBoundary ? 5 : 4}
                  fill={isCurrentActive ? '#38bdf8' : isSectorBoundary ? '#0369a1' : '#1e293b'}
                  stroke={isCurrentActive ? '#ffffff' : isSectorBoundary ? '#38bdf8' : '#64748b'}
                  strokeWidth={1.8}
                />

                {/* Vector label */}
                <text
                  x={labelX}
                  y={labelY}
                  fill={isCurrentActive ? '#38bdf8' : isSectorBoundary ? '#7dd3fc' : '#94a3b8'}
                  fontSize="12"
                  fontFamily="monospace"
                  fontWeight={isCurrentActive || isSectorBoundary ? 'bold' : 'normal'}
                  textAnchor={anchor}
                >
                  {v.name}
                </text>
              </g>
            );
          })}

          {/* Origin / Zero Vectors V0, V7 */}
          <circle
            cx="0"
            cy="0"
            r={isZeroVector ? 7 : 4.5}
            fill={isZeroVector ? '#fbbf24' : '#1e293b'}
            stroke={isZeroVector ? '#ffffff' : '#64748b'}
            strokeWidth={isZeroVector ? 2.5 : 1.5}
          />
          {isZeroVector && (
            <circle
              cx="0"
              cy="0"
              r="12"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2"
              className="animate-ping"
            />
          )}
          <text x="8" y="-8" fill="#fbbf24" fontSize="11" fontWeight="bold" fontFamily="monospace">
            V₀,V₇
          </text>

          {/* Rotating Reference Vector V* (Orange Hand - strictly inside active triangle) */}
          <line
            x1="0"
            y1="0"
            x2={vRefX}
            y2={vRefY}
            stroke="#f59e0b"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <circle cx={vRefX} cy={vRefY} r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
          <text
            x={vRefX + (vRefX >= 0 ? 8 : -20)}
            y={vRefY + (vRefY >= 0 ? 14 : -8)}
            fill="#f59e0b"
            fontSize="12"
            fontWeight="bold"
            fontFamily="monospace"
          >
            V*
          </text>

          {/* Instantaneous Applied Vector Indicator (Blue Hand) */}
          {activeVec && (
            <>
              <line
                x1="0"
                y1="0"
                x2={activeX}
                y2={activeY}
                stroke="#38bdf8"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle
                cx={activeX}
                cy={activeY}
                r="10"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                className="animate-ping"
              />
            </>
          )}
        </svg>
      </div>

      {/* Footer bar with live space vector data & PWM switching sequence */}
      <div className={`flex flex-col gap-1.5 pt-2 border-t text-[11px] font-mono ${
        isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span>Active: <strong className={isDark ? "text-sky-300" : "text-sky-600"}>{vectorName}</strong></span>
            <span>Sector: <strong className={isDark ? "text-indigo-300" : "text-indigo-600"}>S{currentSector}</strong></span>
            <span>θ_sv: <strong className={isDark ? "text-amber-300" : "text-amber-600"}>{thetaSvDeg.toFixed(1)}°</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <span>|V*| = <strong className={isDark ? "text-slate-200" : "text-slate-800"}>{(ma * 0.577).toFixed(2)} Vdc</strong> (ma={ma.toFixed(2)})</span>
            <span className="text-[10px] hidden sm:inline text-slate-500">Limits: SPWM=0.50 Vdc, SVPWM=0.577 Vdc</span>
          </div>
        </div>

        {/* Space Vector Switching Sequence for the active sector */}
        <div className={`px-2 py-1 rounded text-[10px] flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap ${
          isDark ? 'bg-slate-950/60 border border-slate-800 text-slate-400' : 'bg-slate-100 border border-slate-200 text-slate-600'
        }`}>
          <span className="font-bold text-sky-400">Seq (S{currentSector}):</span>
          <span className="font-mono text-slate-300">{sectorSequences[currentSector]}</span>
        </div>
      </div>
    </div>
  );
};
