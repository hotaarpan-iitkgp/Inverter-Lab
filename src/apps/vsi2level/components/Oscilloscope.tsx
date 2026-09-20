import React, { useRef, useEffect, useState, useMemo } from 'react';
import { InstantState, Theme, VsiParameters } from '../types';
import { generateCycleData, generateTimeRangeData } from '../utils/pwmEngine';
import { Eye, EyeOff, ZoomIn, ZoomOut, Compass, Sparkles, Sliders, RotateCcw, Maximize2, Minimize2, Columns2 } from 'lucide-react';

interface OscilloscopeProps {
  params: VsiParameters;
  currentTime: number; // in seconds
  onSeekTime: (newTime: number) => void;
  instantState: InstantState;
  theme?: Theme;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  onSelectSideBySide?: (pairedWith: 'circuit' | 'hexagon') => void;
}

export type PhaseId = 'A' | 'B' | 'C';

export type ChannelId =
  | 'carrierMod' // Carrier & Modulating signals (va*, vb*, vc*, vtri)
  | 'offset'     // Injected offset voltage vOffset
  | 'gate'       // Gate Pulses Sa, Sb, Sc
  | 'pole'       // Pole voltages vAO, vBO, vCO
  | 'line'       // Line-to-line voltages vAB
  | 'phase'      // Load phase voltages vAn
  | 'current';   // Load currents ia, ib, ic

interface ChannelConfig {
  id: ChannelId;
  label: string;
  shortLabel: string;
  badge: string;
  chNum: string;
  color: string;
  unit: string;
  defaultVisible: boolean;
  description: string;
}

const CHANNELS: ChannelConfig[] = [
  {
    id: 'carrierMod',
    label: 'Carrier & Mod Ref',
    shortLabel: 'Ref (v*)',
    badge: 'v_tri & v*',
    chNum: 'CH1',
    color: '#0284c7',
    unit: 'norm [-1, 1]',
    defaultVisible: true,
    description: 'Triangular carrier overlaid with modulating waves va*, vb*, vc*'
  },
  {
    id: 'offset',
    label: 'Offset Injection',
    shortLabel: 'Offset',
    badge: 'v_offset',
    chNum: 'CH2',
    color: '#f59e0b',
    unit: 'norm [-1, 1]',
    defaultVisible: true,
    description: 'Common-mode injection voltage added to sinusoidal references'
  },
  {
    id: 'gate',
    label: 'Gate Signals',
    shortLabel: 'Gates',
    badge: 'g₁–g₆ Pulses',
    chNum: 'CH3',
    color: '#10b981',
    unit: '0 or 1',
    defaultVisible: true,
    description: 'Digital gate driving signals g1..g6 for all 6 switches S1..S6'
  },
  {
    id: 'pole',
    label: 'Pole Voltages',
    shortLabel: 'vAO,BO,CO',
    badge: 'vAO, vBO, vCO',
    chNum: 'CH4',
    color: '#f43f5e',
    unit: '±Vdc/2',
    defaultVisible: true,
    description: 'Inverter leg terminal voltages relative to DC link midpoint O'
  },
  {
    id: 'line',
    label: 'Line Voltages',
    shortLabel: 'vAB,BC,CA',
    badge: 'vAB, vBC, vCA',
    chNum: 'CH5',
    color: '#3b82f6',
    unit: '±Vdc',
    defaultVisible: true,
    description: 'Line-to-line voltages (vAB, vBC, vCA)'
  },
  {
    id: 'phase',
    label: 'Phase Voltages',
    shortLabel: 'vAn,Bn,Cn',
    badge: 'vAn, vBn, vCn',
    chNum: 'CH6',
    color: '#a855f7',
    unit: 'Load V',
    defaultVisible: true,
    description: 'Voltages across star-connected load phases relative to neutral point n'
  },
  {
    id: 'current',
    label: 'Phase Current',
    shortLabel: 'Current ia,b,c',
    badge: 'ia, ib, ic',
    chNum: 'CH7',
    color: '#ec4899',
    unit: 'Load A',
    defaultVisible: true,
    description: 'Inductive phase currents with switching frequency ripple'
  }
];

export const Oscilloscope: React.FC<OscilloscopeProps> = ({
  params,
  currentTime,
  onSeekTime,
  instantState,
  theme = 'dark',
  isFullScreen = false,
  onToggleFullScreen,
  onSelectSideBySide
}) => {
  const isDark = theme !== 'light';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Time base zoom: 1 cycle, 2 cycles, carrierZoom, or custom drag-to-zoom
  const [zoomLevel, setZoomLevel] = useState<'1cycle' | '2cycles' | 'carrierZoom'>('1cycle');
  const [customZoom, setCustomZoom] = useState<{ tStart: number; tEnd: number } | null>(null);
  const [dragSelection, setDragSelection] = useState<{
    isDragging: boolean;
    startX: number;
    currentX: number;
  } | null>(null);

  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width: Math.round(width), height: Math.round(height) });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Phase toggling: user can isolate/combine Phase A, B, C waveforms
  const [selectedPhases, setSelectedPhases] = useState<Record<PhaseId, boolean>>({
    A: true,
    B: true,
    C: true
  });

  const [activeChannels, setActiveChannels] = useState<Record<ChannelId, boolean>>({
    carrierMod: true,
    offset: true,
    gate: true,
    pole: true,
    line: true,
    phase: true,
    current: true
  });

  // Gate view mode: all 6 switches (g1-g6) or 3 leg pairs
  const [gateViewMode, setGateViewMode] = useState<'all6' | 'legs'>('all6');

  const [hoverData, setHoverData] = useState<{
    time: number;
    angleDeg: number;
    vTri: number;
    vaStar: number;
    vOffset: number;
    vAO: number;
    vAB: number;
    ia: number;
    sa: number;
    g1: number;
    g2: number;
    g3: number;
    g4: number;
    g5: number;
    g6: number;
    vectorName: string;
  } | null>(null);

  const numCycles = zoomLevel === '2cycles' ? 2 : 1;
  const samplePoints = zoomLevel === 'carrierZoom' ? 1800 : 1200;

  // Precompute cycle data or high-resolution window data for custom zoom
  const cycleData = useMemo(() => {
    if (customZoom) {
      return generateTimeRangeData(params, customZoom.tStart, customZoom.tEnd, 1400);
    }
    return generateCycleData(params, numCycles, samplePoints);
  }, [params, numCycles, samplePoints, customZoom]);

  const periodTotal = numCycles / params.f0;

  // Toggle channel
  const toggleChannel = (id: ChannelId) => {
    setActiveChannels(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Toggle phase filter
  const togglePhase = (phase: PhaseId) => {
    setSelectedPhases(prev => {
      const allActive = prev.A && prev.B && prev.C;
      // If all phases are currently active, clicking one isolates to that phase
      if (allActive) {
        return { A: phase === 'A', B: phase === 'B', C: phase === 'C' };
      }
      const next = { ...prev, [phase]: !prev[phase] };
      // Prevent all phases being false: reset to all active
      if (!next.A && !next.B && !next.C) {
        return { A: true, B: true, C: true };
      }
      return next;
    });
  };

  const selectAllPhases = () => {
    setSelectedPhases({ A: true, B: true, C: true });
  };

  // Canvas drawing routine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI displays
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Filter enabled channels
    const enabledChannels = CHANNELS.filter(c => activeChannels[c.id]);
    const numPanels = enabledChannels.length;

    // Theme color palettes
    const bgColor = isDark ? '#090d16' : '#ffffff';
    const gutterBg = isDark ? '#0f172a' : '#f8fafc';
    const borderColor = isDark ? '#1e293b' : '#e2e8f0';
    const gridMajor = isDark ? '#141e33' : '#edf2f7';
    const zeroLineColor = isDark ? '#334155' : '#cbd5e1';
    const textMuted = isDark ? '#64748b' : '#64748b';
    const textBright = isDark ? '#cbd5e1' : '#1e293b';
    const legendBoxBg = isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.95)';

    if (numPanels === 0) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = textMuted;
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('All oscilloscope channels hidden. Enable channels above to view waveforms.', width / 2, height / 2);
      return;
    }

    // Canvas Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    const panelHeight = height / numPanels;
    const leftGutterW = 86;
    const rightPad = 14;

    // Compute effective time window (custom X-zoom, carrier zoom, or full cycle)
    let tStart = 0;
    let tEnd = periodTotal;

    if (customZoom) {
      tStart = customZoom.tStart;
      tEnd = customZoom.tEnd;
    } else if (zoomLevel === 'carrierZoom') {
      const windowWidth = (3 / (params.f0 * params.mf)); // 3 carrier cycles
      const currentNorm = currentTime % periodTotal;
      tStart = Math.max(0, currentNorm - windowWidth * 0.4);
      tEnd = tStart + windowWidth;
      if (tEnd > periodTotal) {
        tEnd = periodTotal;
        tStart = Math.max(0, tEnd - windowWidth);
      }
    }

    const tSpan = Math.max(0.00002, tEnd - tStart);
    const curNorm = currentTime % periodTotal;

    // Coordinates mapping helper (strictly starts at leftGutterW to keep text area clear)
    const timeToX = (t: number) => {
      return leftGutterW + ((t - tStart) / tSpan) * (width - leftGutterW - rightPad);
    };

    // Draw each active channel panel
    enabledChannels.forEach((ch, idx) => {
      const top = idx * panelHeight;
      const bottom = top + panelHeight;

      // Dedicated waveform plotting vertical area (reserved top 22px for labels)
      const plotTop = top + 22;
      const plotBottom = bottom - 5;
      const plotHeight = Math.max(16, plotBottom - plotTop);
      const midY = plotTop + plotHeight / 2;

      // 1. Channel Divider Bottom Line
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, bottom);
      ctx.lineTo(width, bottom);
      ctx.stroke();

      // 2. Left Gutter Background
      ctx.fillStyle = gutterBg;
      ctx.fillRect(0, top, leftGutterW, panelHeight);

      // Left Gutter Vertical Divider Line
      ctx.strokeStyle = borderColor;
      ctx.beginPath();
      ctx.moveTo(leftGutterW, top);
      ctx.lineTo(leftGutterW, bottom);
      ctx.stroke();

      // 3. Time Division Grid Lines in waveform area
      const numDivs = 10;
      ctx.strokeStyle = gridMajor;
      ctx.lineWidth = 1;
      for (let d = 1; d < numDivs; d++) {
        const xDiv = leftGutterW + (d / numDivs) * (width - leftGutterW - rightPad);
        ctx.beginPath();
        ctx.moveTo(xDiv, top);
        ctx.lineTo(xDiv, bottom);
        ctx.stroke();
      }

      // 4. Zero Reference Dashed Line (for analog channels)
      if (ch.id !== 'gate') {
        ctx.strokeStyle = zeroLineColor;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(leftGutterW, midY);
        ctx.lineTo(width - rightPad, midY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 5. Left Gutter Channel Badge & Readouts
      // CH Badge Pill
      const badgeW = 34;
      const badgeH = 14;
      ctx.fillStyle = isDark ? '#1e293b' : '#e2e8f0';
      ctx.strokeStyle = ch.color;
      ctx.lineWidth = 1;
      roundRect(ctx, 8, top + 5, badgeW, badgeH, 3, true, true);

      ctx.font = 'bold 8.5px monospace';
      ctx.fillStyle = ch.color;
      ctx.textAlign = 'center';
      ctx.fillText(ch.chNum, 8 + badgeW / 2, top + 15);

      // Channel Short Name & Unit inside Gutter
      ctx.font = 'bold 8.5px monospace';
      ctx.fillStyle = textBright;
      ctx.textAlign = 'left';
      ctx.fillText(ch.badge, 8, top + 31);

      ctx.font = '7.5px monospace';
      ctx.fillStyle = textMuted;
      ctx.fillText(ch.unit, 8, top + 42);

      // Zero reference arrow in gutter pointing to midY
      if (ch.id !== 'gate') {
        ctx.fillStyle = ch.color;
        ctx.font = '8px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('0V ▶', leftGutterW - 4, midY + 3);
      }

      // ================= WAVEFORM DRAWING (BOUNDED SO IT NEVER OVERLAPS LABELS) =================
      ctx.lineWidth = 1.6;

      if (ch.id === 'carrierMod') {
        // Dynamic legend based on selected phases
        const carrierLegend = [
          ...(selectedPhases.A ? [{ text: 'vₐ*', color: '#f43f5e' }] : []),
          ...(selectedPhases.B ? [{ text: 'vb*', color: '#10b981' }] : []),
          ...(selectedPhases.C ? [{ text: 'vc*', color: '#0ea5e9' }] : []),
          { text: 'v_tri', color: isDark ? '#94a3b8' : '#475569' }
        ];
        drawLegendPill(ctx, width - rightPad, top + 3, carrierLegend, isDark);

        // 1. Triangular Carrier (Always visible for PWM comparison)
        ctx.strokeStyle = isDark ? '#475569' : '#94a3b8';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        let started = false;
        for (const pt of cycleData) {
          if (pt.time < tStart || pt.time > tEnd) continue;
          const x = timeToX(pt.time);
          const y = midY - pt.vTri * (plotHeight * 0.44);
          if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // 2. Modulating signals va*, vb*, vc* for selected phases
        // Phase C (Sky)
        if (selectedPhases.C) {
          ctx.strokeStyle = '#0ea5e9';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          started = false;
          for (const pt of cycleData) {
            if (pt.time < tStart || pt.time > tEnd) continue;
            const x = timeToX(pt.time);
            const y = midY - pt.vcStar * (plotHeight * 0.44);
            if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }

        // Phase B (Emerald)
        if (selectedPhases.B) {
          ctx.strokeStyle = '#10b981';
          ctx.beginPath();
          started = false;
          for (const pt of cycleData) {
            if (pt.time < tStart || pt.time > tEnd) continue;
            const x = timeToX(pt.time);
            const y = midY - pt.vbStar * (plotHeight * 0.44);
            if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }

        // Phase A (Rose)
        if (selectedPhases.A) {
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 2;
          ctx.beginPath();
          started = false;
          for (const pt of cycleData) {
            if (pt.time < tStart || pt.time > tEnd) continue;
            const x = timeToX(pt.time);
            const y = midY - pt.vaStar * (plotHeight * 0.44);
            if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }

      } else if (ch.id === 'offset') {
        // Legend pill showing offset and active pure sine reference
        const offsetLegend = [
          { text: 'v_offset (injection)', color: '#f59e0b' },
          ...(selectedPhases.A ? [{ text: 'va (pure sine)', color: isDark ? '#94a3b8' : '#64748b' }] : []),
          ...(!selectedPhases.A && selectedPhases.B ? [{ text: 'vb (pure sine)', color: isDark ? '#94a3b8' : '#64748b' }] : []),
          ...(!selectedPhases.A && !selectedPhases.B && selectedPhases.C ? [{ text: 'vc (pure sine)', color: isDark ? '#94a3b8' : '#64748b' }] : [])
        ];
        drawLegendPill(ctx, width - rightPad, top + 3, offsetLegend, isDark);

        // Pure sine reference va_sin (dotted for comparison)
        if (selectedPhases.A || (!selectedPhases.B && !selectedPhases.C)) {
          ctx.strokeStyle = isDark ? '#64748b' : '#94a3b8';
          ctx.setLineDash([3, 3]);
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          let started = false;
          for (const pt of cycleData) {
            if (pt.time < tStart || pt.time > tEnd) continue;
            const x = timeToX(pt.time);
            const y = midY - pt.vaSin * (plotHeight * 0.44);
            if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Offset / Zero Sequence injection
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        let started = false;
        for (const pt of cycleData) {
          if (pt.time < tStart || pt.time > tEnd) continue;
          const x = timeToX(pt.time);
          const y = midY - pt.vOffset * (plotHeight * 0.44);
          if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
        }
        ctx.stroke();

      } else if (ch.id === 'gate') {
        // Collect active gate traces based on selected phases
        const activeGates: Array<{
          key: 'g1' | 'g2' | 'g3' | 'g4' | 'g5' | 'g6' | 'sa' | 'sb' | 'sc';
          color: string;
          label: string;
        }> = [];

        if (gateViewMode === 'all6') {
          if (selectedPhases.A) {
            activeGates.push({ key: 'g1', color: '#f43f5e', label: 'g₁ (S₁)' });
            activeGates.push({ key: 'g2', color: '#fb7185', label: 'g₂ (S₂)' });
          }
          if (selectedPhases.B) {
            activeGates.push({ key: 'g3', color: '#10b981', label: 'g₃ (S₃)' });
            activeGates.push({ key: 'g4', color: '#34d399', label: 'g₄ (S₄)' });
          }
          if (selectedPhases.C) {
            activeGates.push({ key: 'g5', color: '#0ea5e9', label: 'g₅ (S₅)' });
            activeGates.push({ key: 'g6', color: '#38bdf8', label: 'g₆ (S₆)' });
          }
        } else {
          if (selectedPhases.A) activeGates.push({ key: 'sa', color: '#f43f5e', label: 'Leg A (g₁/g₂)' });
          if (selectedPhases.B) activeGates.push({ key: 'sb', color: '#10b981', label: 'Leg B (g₃/g₄)' });
          if (selectedPhases.C) activeGates.push({ key: 'sc', color: '#0ea5e9', label: 'Leg C (g₅/g₆)' });
        }

        const numGates = Math.max(1, activeGates.length);
        const subH = (panelHeight - 16) / numGates;

        drawLegendPill(ctx, width - rightPad, top + 3, [
          { text: gateViewMode === 'all6' ? `${numGates} Gate Traces` : `${numGates} Leg Signals`, color: '#10b981' }
        ], isDark);

        activeGates.forEach((g, gIdx) => {
          drawGateSignalWithGutter(
            ctx,
            cycleData,
            g.key,
            top + 10 + subH * gIdx,
            subH,
            g.color,
            g.label,
            leftGutterW,
            width - rightPad,
            timeToX,
            tStart,
            tEnd,
            curNorm,
            isDark
          );
        });

      } else if (ch.id === 'pole') {
        const poleLegend = [
          ...(selectedPhases.A ? [{ text: `vAO (±${params.vdc / 2}V)`, color: '#f43f5e' }] : []),
          ...(selectedPhases.B ? [{ text: 'vBO', color: '#10b981' }] : []),
          ...(selectedPhases.C ? [{ text: 'vCO', color: '#0ea5e9' }] : [])
        ];
        drawLegendPill(ctx, width - rightPad, top + 3, poleLegend, isDark);

        const vScale = (plotHeight * 0.44) / (params.vdc / 2);

        // Pole Voltage C (Sky)
        if (selectedPhases.C) {
          ctx.strokeStyle = '#0ea5e9';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          let startedC = false;
          for (let i = 0; i < cycleData.length; i++) {
            const pt = cycleData[i];
            if (pt.time < tStart || pt.time > tEnd) continue;
            const x = timeToX(pt.time);
            const y = midY - pt.vCO * vScale;
            if (!startedC) {
              ctx.moveTo(x, y);
              startedC = true;
            } else {
              const prevPt = cycleData[i - 1];
              if (prevPt && prevPt.vCO !== pt.vCO) {
                ctx.lineTo(x, midY - prevPt.vCO * vScale);
              }
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        }

        // Pole Voltage B (Emerald)
        if (selectedPhases.B) {
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          let startedB = false;
          for (let i = 0; i < cycleData.length; i++) {
            const pt = cycleData[i];
            if (pt.time < tStart || pt.time > tEnd) continue;
            const x = timeToX(pt.time);
            const y = midY - pt.vBO * vScale;
            if (!startedB) {
              ctx.moveTo(x, y);
              startedB = true;
            } else {
              const prevPt = cycleData[i - 1];
              if (prevPt && prevPt.vBO !== pt.vBO) {
                ctx.lineTo(x, midY - prevPt.vBO * vScale);
              }
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        }

        // Pole Voltage A (Rose)
        if (selectedPhases.A) {
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          let startedA = false;
          for (let i = 0; i < cycleData.length; i++) {
            const pt = cycleData[i];
            if (pt.time < tStart || pt.time > tEnd) continue;
            const x = timeToX(pt.time);
            const y = midY - pt.vAO * vScale;
            if (!startedA) {
              ctx.moveTo(x, y);
              startedA = true;
            } else {
              const prevPt = cycleData[i - 1];
              if (prevPt && prevPt.vAO !== pt.vAO) {
                ctx.lineTo(x, midY - prevPt.vAO * vScale);
              }
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        }

      } else if (ch.id === 'line') {
        const showAB = (selectedPhases.A && selectedPhases.B) || (selectedPhases.A && !selectedPhases.B && !selectedPhases.C) || (selectedPhases.B && !selectedPhases.A && !selectedPhases.C);
        const showBC = (selectedPhases.B && selectedPhases.C) || (selectedPhases.B && !selectedPhases.A && !selectedPhases.C) || (selectedPhases.C && !selectedPhases.A && !selectedPhases.B);
        const showCA = (selectedPhases.C && selectedPhases.A) || (selectedPhases.C && !selectedPhases.A && !selectedPhases.B) || (selectedPhases.A && !selectedPhases.B && !selectedPhases.C);

        const lineLegend = [
          ...(showAB ? [{ text: `vAB (±${params.vdc}V, 0V)`, color: '#3b82f6' }] : []),
          ...(showBC ? [{ text: 'vBC', color: '#10b981' }] : []),
          ...(showCA ? [{ text: 'vCA', color: '#f59e0b' }] : [])
        ];
        drawLegendPill(ctx, width - rightPad, top + 3, lineLegend, isDark);

        const vScale = (plotHeight * 0.44) / params.vdc;

        // Line Voltage CA (Amber)
        if (showCA) {
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          let startedCA = false;
          for (let i = 0; i < cycleData.length; i++) {
            const pt = cycleData[i];
            if (pt.time < tStart || pt.time > tEnd) continue;
            const x = timeToX(pt.time);
            const y = midY - pt.vCA * vScale;
            if (!startedCA) {
              ctx.moveTo(x, y);
              startedCA = true;
            } else {
              const prevPt = cycleData[i - 1];
              if (prevPt && prevPt.vCA !== pt.vCA) {
                ctx.lineTo(x, midY - prevPt.vCA * vScale);
              }
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        }

        // Line Voltage BC (Emerald)
        if (showBC) {
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          let startedBC = false;
          for (let i = 0; i < cycleData.length; i++) {
            const pt = cycleData[i];
            if (pt.time < tStart || pt.time > tEnd) continue;
            const x = timeToX(pt.time);
            const y = midY - pt.vBC * vScale;
            if (!startedBC) {
              ctx.moveTo(x, y);
              startedBC = true;
            } else {
              const prevPt = cycleData[i - 1];
              if (prevPt && prevPt.vBC !== pt.vBC) {
                ctx.lineTo(x, midY - prevPt.vBC * vScale);
              }
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        }

        // Line Voltage AB (Blue)
        if (showAB) {
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          let startedAB = false;
          for (let i = 0; i < cycleData.length; i++) {
            const pt = cycleData[i];
            if (pt.time < tStart || pt.time > tEnd) continue;
            const x = timeToX(pt.time);
            const y = midY - pt.vAB * vScale;
            if (!startedAB) {
              ctx.moveTo(x, y);
              startedAB = true;
            } else {
              const prevPt = cycleData[i - 1];
              if (prevPt && prevPt.vAB !== pt.vAB) {
                ctx.lineTo(x, midY - prevPt.vAB * vScale);
              }
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        }

      } else if (ch.id === 'phase') {
        const phaseLegend = [
          ...(selectedPhases.A ? [{ text: 'vAn (±2/3, ±1/3 Vdc, 0)', color: '#a855f7' }] : []),
          ...(selectedPhases.B ? [{ text: 'vBn', color: '#10b981' }] : []),
          ...(selectedPhases.C ? [{ text: 'vCn', color: '#0ea5e9' }] : [])
        ];
        drawLegendPill(ctx, width - rightPad, top + 3, phaseLegend, isDark);

        const vScale = (plotHeight * 0.44) / (params.vdc * 0.67);

        // Phase Voltage Cn (Sky)
        if (selectedPhases.C) {
          ctx.strokeStyle = '#0ea5e9';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          let startedCn = false;
          for (let i = 0; i < cycleData.length; i++) {
            const pt = cycleData[i];
            if (pt.time < tStart || pt.time > tEnd) continue;
            const x = timeToX(pt.time);
            const y = midY - pt.vCn * vScale;
            if (!startedCn) {
              ctx.moveTo(x, y);
              startedCn = true;
            } else {
              const prevPt = cycleData[i - 1];
              if (prevPt && prevPt.vCn !== pt.vCn) {
                ctx.lineTo(x, midY - prevPt.vCn * vScale);
              }
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        }

        // Phase Voltage Bn (Emerald)
        if (selectedPhases.B) {
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          let startedBn = false;
          for (let i = 0; i < cycleData.length; i++) {
            const pt = cycleData[i];
            if (pt.time < tStart || pt.time > tEnd) continue;
            const x = timeToX(pt.time);
            const y = midY - pt.vBn * vScale;
            if (!startedBn) {
              ctx.moveTo(x, y);
              startedBn = true;
            } else {
              const prevPt = cycleData[i - 1];
              if (prevPt && prevPt.vBn !== pt.vBn) {
                ctx.lineTo(x, midY - prevPt.vBn * vScale);
              }
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        }

        // Phase Voltage An (Purple)
        if (selectedPhases.A) {
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          let startedAn = false;
          for (let i = 0; i < cycleData.length; i++) {
            const pt = cycleData[i];
            if (pt.time < tStart || pt.time > tEnd) continue;
            const x = timeToX(pt.time);
            const y = midY - pt.vAn * vScale;
            if (!startedAn) {
              ctx.moveTo(x, y);
              startedAn = true;
            } else {
              const prevPt = cycleData[i - 1];
              if (prevPt && prevPt.vAn !== pt.vAn) {
                ctx.lineTo(x, midY - prevPt.vAn * vScale);
              }
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        }

      } else if (ch.id === 'current') {
        const maxI = Math.max(
          1,
          ...cycleData.map(p => {
            const vals: number[] = [];
            if (selectedPhases.A) vals.push(Math.abs(p.ia));
            if (selectedPhases.B) vals.push(Math.abs(p.ib));
            if (selectedPhases.C) vals.push(Math.abs(p.ic));
            return vals.length > 0 ? Math.max(...vals) : 1;
          })
        ) * 1.15;
        const iScale = (plotHeight * 0.44) / maxI;

        const currentLegend = [
          ...(selectedPhases.A ? [{ text: `ia (±${maxI.toFixed(1)}A)`, color: '#f43f5e' }] : []),
          ...(selectedPhases.B ? [{ text: 'ib', color: '#10b981' }] : []),
          ...(selectedPhases.C ? [{ text: 'ic', color: '#0ea5e9' }] : [])
        ];
        drawLegendPill(ctx, width - rightPad, top + 3, currentLegend, isDark);

        // Current C
        if (selectedPhases.C) {
          ctx.strokeStyle = '#0ea5e9';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          let started = false;
          for (const pt of cycleData) {
            if (pt.time < tStart || pt.time > tEnd) continue;
            const x = timeToX(pt.time);
            const y = midY - pt.ic * iScale;
            if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }

        // Current B
        if (selectedPhases.B) {
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          let started = false;
          for (const pt of cycleData) {
            if (pt.time < tStart || pt.time > tEnd) continue;
            const x = timeToX(pt.time);
            const y = midY - pt.ib * iScale;
            if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }

        // Current A
        if (selectedPhases.A) {
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 2;
          ctx.beginPath();
          let started = false;
          for (const pt of cycleData) {
            if (pt.time < tStart || pt.time > tEnd) continue;
            const x = timeToX(pt.time);
            const y = midY - pt.ia * iScale;
            if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }
    });

    // Draw Live Animated Playback Cursor Line (only in waveform area)
    if (curNorm >= tStart && curNorm <= tEnd) {
      const curX = timeToX(curNorm);
      ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      ctx.moveTo(curX, 0);
      ctx.lineTo(curX, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Top marker flag
      ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
      ctx.beginPath();
      ctx.moveTo(curX - 6, 0);
      ctx.lineTo(curX + 6, 0);
      ctx.lineTo(curX, 9);
      ctx.closePath();
      ctx.fill();
    }

    // Draw Interactive Drag-to-Zoom Selection Box
    if (dragSelection?.isDragging && Math.abs(dragSelection.currentX - dragSelection.startX) > 4) {
      const minX = Math.min(dragSelection.startX, dragSelection.currentX);
      const maxX = Math.max(dragSelection.startX, dragSelection.currentX);
      const selW = maxX - minX;

      ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.18)' : 'rgba(2, 132, 199, 0.15)';
      ctx.fillRect(minX, 0, selW, height);

      ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(minX, 0, selW, height);
      ctx.setLineDash([]);

      // Floating duration badge
      const effectiveW = width - leftGutterW - rightPad;
      if (effectiveW > 0) {
        const norm1 = (minX - leftGutterW) / effectiveW;
        const norm2 = (maxX - leftGutterW) / effectiveW;
        const dt = (norm2 - norm1) * tSpan;
        const dTheta = dt * params.f0 * 360;

        const badgeText = `X-Zoom: Δt = ${(dt * 1000).toFixed(2)}ms (Δθ = ${dTheta.toFixed(1)}°)`;
        ctx.font = 'bold 9.5px monospace';
        const textW = ctx.measureText(badgeText).width;
        const badgeX = Math.max(minX, Math.min(width - textW - 22, (minX + maxX) / 2 - textW / 2 - 8));
        const badgeY = 22;

        ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.95)';
        ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
        ctx.lineWidth = 1;
        roundRect(ctx, badgeX, badgeY, textW + 16, 20, 4, true, true);

        ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
        ctx.textAlign = 'center';
        ctx.fillText(badgeText, badgeX + (textW + 16) / 2, badgeY + 14);
      }
    }

  }, [cycleData, activeChannels, selectedPhases, zoomLevel, customZoom, dragSelection, currentTime, params, periodTotal, isDark, containerSize, gateViewMode]);

  // Mouse Handlers for X-Zoom Dragging and Time Scrubbing
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return; // Only left-click
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const leftGutterW = 86;
    if (x < leftGutterW) return;

    setDragSelection({
      isDragging: true,
      startX: x,
      currentX: x
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const leftGutterW = 86;
    const rightPad = 14;
    const effectiveW = rect.width - leftGutterW - rightPad;

    if (dragSelection?.isDragging) {
      setDragSelection(prev =>
        prev ? { ...prev, currentX: Math.max(leftGutterW, Math.min(rect.width - rightPad, x)) } : null
      );
    }

    if (x < leftGutterW || effectiveW <= 0) {
      setHoverData(null);
      return;
    }
    const normX = Math.max(0, Math.min(1, (x - leftGutterW) / effectiveW));

    let tStart = 0;
    let tEnd = periodTotal;
    if (customZoom) {
      tStart = customZoom.tStart;
      tEnd = customZoom.tEnd;
    } else if (zoomLevel === 'carrierZoom') {
      const windowWidth = 3 / (params.f0 * params.mf);
      const currentNorm = currentTime % periodTotal;
      tStart = Math.max(0, currentNorm - windowWidth * 0.4);
      tEnd = tStart + windowWidth;
      if (tEnd > periodTotal) {
        tEnd = periodTotal;
        tStart = Math.max(0, tEnd - windowWidth);
      }
    }

    const t = tStart + normX * (tEnd - tStart);
    const closest = cycleData.reduce((prev, curr) =>
      Math.abs(curr.time - t) < Math.abs(prev.time - t) ? curr : prev
    );

    setHoverData({
      time: closest.time,
      angleDeg: ((closest.theta * 180) / Math.PI) % 360,
      vTri: closest.vTri,
      vaStar: closest.vaStar,
      vOffset: closest.vOffset,
      vAO: closest.vAO,
      vAB: closest.vAB,
      ia: closest.ia,
      sa: closest.sa,
      g1: closest.g1 ?? closest.sa,
      g2: closest.g2 ?? (1 - closest.sa),
      g3: closest.g3 ?? closest.sb,
      g4: closest.g4 ?? (1 - closest.sb),
      g5: closest.g5 ?? closest.sc,
      g6: closest.g6 ?? (1 - closest.sc),
      vectorName: closest.vectorName
    });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragSelection?.isDragging) return;
    const canvas = canvasRef.current;
    if (!canvas) {
      setDragSelection(null);
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const leftGutterW = 86;
    const rightPad = 14;
    const effectiveW = rect.width - leftGutterW - rightPad;
    const dx = Math.abs(dragSelection.currentX - dragSelection.startX);

    let tStart = 0;
    let tEnd = periodTotal;
    if (customZoom) {
      tStart = customZoom.tStart;
      tEnd = customZoom.tEnd;
    } else if (zoomLevel === 'carrierZoom') {
      const windowWidth = 3 / (params.f0 * params.mf);
      const currentNorm = currentTime % periodTotal;
      tStart = Math.max(0, currentNorm - windowWidth * 0.4);
      tEnd = tStart + windowWidth;
      if (tEnd > periodTotal) {
        tEnd = periodTotal;
        tStart = Math.max(0, tEnd - windowWidth);
      }
    }

    const tSpan = Math.max(0.00002, tEnd - tStart);

    // If dragged more than 8 pixels, apply X-Zoom!
    if (dx >= 8 && effectiveW > 0) {
      const minX = Math.max(leftGutterW, Math.min(dragSelection.startX, dragSelection.currentX));
      const maxX = Math.min(rect.width - rightPad, Math.max(dragSelection.startX, dragSelection.currentX));
      const norm1 = (minX - leftGutterW) / effectiveW;
      const norm2 = (maxX - leftGutterW) / effectiveW;
      const t1 = tStart + norm1 * tSpan;
      const t2 = tStart + norm2 * tSpan;

      if (t2 - t1 >= 0.00002) {
        setCustomZoom({ tStart: t1, tEnd: t2 });
      }
    } else {
      // Normal click -> seek time cursor
      const clickX = e.clientX - rect.left;
      if (clickX >= leftGutterW && effectiveW > 0) {
        const norm = Math.max(0, Math.min(1, (clickX - leftGutterW) / effectiveW));
        const selectedTime = tStart + norm * tSpan;
        onSeekTime(selectedTime);
      }
    }
    setDragSelection(null);
  };

  const handleDoubleClick = () => {
    // Double click resets X-Zoom back to current zoom level
    setCustomZoom(null);
  };

  const handleMouseLeave = () => {
    if (dragSelection?.isDragging) {
      setDragSelection(null);
    }
    setHoverData(null);
  };

  return (
    <div
      id="oscilloscope-main-panel"
      className={`rounded-xl p-2.5 sm:p-3 shadow-xl flex flex-col h-full border transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* Row 1: Slim Title, X-Zoom status, Timebase & Split/FullScreen */}
      <div className={`flex flex-wrap items-center justify-between gap-1.5 pb-1.5 mb-1.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="flex items-center gap-1.5">
          <div className="p-1 bg-sky-500/15 text-sky-400 rounded border border-sky-500/30">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <span className={`text-xs font-bold tracking-tight flex items-center gap-1.5 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
            DSO Oscilloscope
            <span className={`text-[9px] font-mono px-1 py-0.2 rounded font-bold ${
              isDark ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/50' : 'text-emerald-700 bg-emerald-100 border border-emerald-300'
            }`}>
              LIVE
            </span>
          </span>

          {customZoom && (
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border font-mono text-[10px] ${
              isDark ? 'bg-sky-950/80 border-sky-800 text-sky-300' : 'bg-sky-50 border-sky-300 text-sky-800'
            }`}>
              <ZoomIn className="w-2.5 h-2.5 text-sky-400" />
              <span>X-Zoom: [{(customZoom.tStart * 1000).toFixed(1)}–{(customZoom.tEnd * 1000).toFixed(1)}ms]</span>
              <button
                onClick={() => setCustomZoom(null)}
                className="px-1 py-0.2 bg-sky-600 hover:bg-sky-500 text-white rounded text-[9px] font-sans font-semibold transition-colors"
                title="Reset X-Zoom to full cycle (or double-click waveform)"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Time Base & Actions */}
        <div className="flex items-center gap-1">
          <div className={`flex items-center gap-0.5 p-0.5 rounded border text-[10px] font-mono ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
            <span className={`px-1 text-[9px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Base:</span>
            <button
              onClick={() => { setZoomLevel('1cycle'); setCustomZoom(null); }}
              className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                zoomLevel === '1cycle' && !customZoom
                  ? 'bg-sky-600 text-white font-semibold shadow-xs'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1 Cycle
            </button>
            <button
              onClick={() => { setZoomLevel('2cycles'); setCustomZoom(null); }}
              className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                zoomLevel === '2cycles' && !customZoom
                  ? 'bg-sky-600 text-white font-semibold shadow-xs'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2 Cycles
            </button>
            <button
              onClick={() => { setZoomLevel('carrierZoom'); setCustomZoom(null); }}
              className={`px-1.5 py-0.5 rounded text-[10px] transition-colors flex items-center gap-0.5 ${
                zoomLevel === 'carrierZoom' && !customZoom
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Zoom into individual carrier periods"
            >
              <ZoomIn className="w-2.5 h-2.5" /> Carrier
            </button>
          </div>

          {onSelectSideBySide && (
            <div className={`flex items-center gap-0.5 p-0.5 rounded border text-[10px] font-mono ${
              isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-300'
            }`}>
              <button
                onClick={() => onSelectSideBySide('circuit')}
                className={`px-1.5 py-0.5 rounded hover:bg-slate-700 text-slate-300 transition-colors`}
                title="Side-by-side with Two-Level Power Stage Circuit"
              >
                + Circuit
              </button>
              <button
                onClick={() => onSelectSideBySide('hexagon')}
                className={`px-1.5 py-0.5 rounded hover:bg-slate-700 text-slate-300 transition-colors`}
                title="Side-by-side with Space Vector Hexagon"
              >
                + Hexagon
              </button>
            </div>
          )}

          {onToggleFullScreen && (
            <button
              onClick={onToggleFullScreen}
              className={`p-1 rounded border transition-colors flex items-center gap-1 text-[10px] font-medium ${
                isFullScreen
                  ? 'bg-amber-600 text-white border-amber-500 shadow-xs'
                  : isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
              title={isFullScreen ? 'Exit full screen (Return to Dashboard)' : 'Toggle Full Screen Oscilloscope'}
            >
              {isFullScreen ? (
                <>
                  <Minimize2 className="w-3 h-3" />
                  <span className="hidden sm:inline text-[9px]">Exit</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3 h-3" />
                  <span className="hidden sm:inline text-[9px]">Full</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Ultra-Compact Unified Phases, Gate Mode, and Channel Selector Strip */}
      <div className={`flex flex-wrap items-center justify-between gap-1 pb-1.5 mb-1.5 border-b ${isDark ? 'border-slate-800/60' : 'border-slate-200'}`}>
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Phase Filter */}
          <div className={`flex items-center gap-0.5 p-0.5 rounded border text-[10px] font-mono ${
            isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <span className={`px-1 text-[9px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Phase:</span>
            <button
              onClick={selectAllPhases}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                selectedPhases.A && selectedPhases.B && selectedPhases.C
                  ? 'bg-sky-600 text-white font-bold'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Display all phases (A, B, C)"
            >
              All
            </button>
            <button
              onClick={() => togglePhase('A')}
              className={`px-1.5 py-0.5 rounded transition-colors flex items-center gap-1 ${
                selectedPhases.A
                  ? 'bg-rose-600 text-white font-bold'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Toggle Phase A"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> A
            </button>
            <button
              onClick={() => togglePhase('B')}
              className={`px-1.5 py-0.5 rounded transition-colors flex items-center gap-1 ${
                selectedPhases.B
                  ? 'bg-emerald-600 text-white font-bold'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Toggle Phase B"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> B
            </button>
            <button
              onClick={() => togglePhase('C')}
              className={`px-1.5 py-0.5 rounded transition-colors flex items-center gap-1 ${
                selectedPhases.C
                  ? 'bg-sky-600 text-white font-bold'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Toggle Phase C"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" /> C
            </button>
          </div>

          {/* Gate View Mode (if gate channel is active) */}
          {activeChannels.gate && (
            <div className={`flex items-center gap-0.5 p-0.5 rounded border text-[10px] font-mono ${
              isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <span className={`px-1 text-[9px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Gate:</span>
              <button
                onClick={() => setGateViewMode('all6')}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  gateViewMode === 'all6'
                    ? 'bg-emerald-600 text-white font-bold'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Individual gate pulses (g1..g6)"
              >
                g₁–g₆
              </button>
              <button
                onClick={() => setGateViewMode('legs')}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  gateViewMode === 'legs'
                    ? 'bg-emerald-600 text-white font-bold'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Phase leg switching commands (Sa, Sb, Sc)"
              >
                Sa–c
              </button>
            </div>
          )}
        </div>

        {/* Compact Channels Selector */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>CH:</span>
          {CHANNELS.map(ch => {
            const isActive = activeChannels[ch.id];
            return (
              <button
                key={ch.id}
                onClick={() => toggleChannel(ch.id)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border transition-all ${
                  isActive
                    ? isDark
                      ? 'bg-slate-800 text-slate-200 border-slate-700 shadow-xs'
                      : 'bg-slate-100 text-slate-800 border-slate-300 shadow-xs'
                    : isDark
                      ? 'bg-slate-950/50 text-slate-500 border-slate-800/80 opacity-60 hover:opacity-100'
                      : 'bg-white text-slate-400 border-slate-200 opacity-60 hover:opacity-100'
                }`}
                title={`${ch.label} (${ch.chNum}) - ${ch.description}`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: isActive ? ch.color : '#64748b' }}
                />
                <span>{ch.shortLabel}</span>
                {isActive ? (
                  <Eye className="w-2.5 h-2.5 text-slate-400" />
                ) : (
                  <EyeOff className="w-2.5 h-2.5 text-slate-500 opacity-60" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Canvas Scope Display - Significantly Extended in Vertical Direction */}
      <div
        ref={containerRef}
        className={`relative flex-1 ${
          isFullScreen
            ? 'min-h-[760px] lg:min-h-[850px] 2xl:min-h-[920px]'
            : 'min-h-[580px] sm:min-h-[640px] xl:min-h-[720px] 2xl:min-h-[800px]'
        } w-full rounded-lg border overflow-hidden cursor-crosshair select-none group ${
          isDark ? 'border-slate-800 bg-[#090d16]' : 'border-slate-200 bg-white'
        }`}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full block"
        />

        {/* Hover Readout Tooltip Bar */}
        {hoverData && (
          <div className={`absolute top-2 left-24 right-3 backdrop-blur border rounded-md px-3 py-1.5 flex flex-wrap items-center justify-between text-xs font-mono pointer-events-none shadow-xl ${
            isDark ? 'bg-slate-900/95 border-slate-700/80 text-slate-300' : 'bg-white/95 border-slate-300 text-slate-800'
          }`}>
            <div className="flex items-center gap-3">
              <span>t: <strong className="text-sky-500">{(hoverData.time * 1000).toFixed(2)}ms</strong></span>
              <span>θ: <strong className="text-amber-500">{hoverData.angleDeg.toFixed(1)}°</strong></span>
              <span>Vector: <strong className="text-indigo-500">{hoverData.vectorName}</strong></span>
              <span className="font-mono">
                g₁₋₆: [
                <strong className={hoverData.g1 ? "text-emerald-500" : isDark ? "text-slate-500" : "text-slate-400"}>{hoverData.g1}</strong>
                <strong className={hoverData.g2 ? "text-emerald-500" : isDark ? "text-slate-500" : "text-slate-400"}>{hoverData.g2}</strong>|
                <strong className={hoverData.g3 ? "text-emerald-500" : isDark ? "text-slate-500" : "text-slate-400"}>{hoverData.g3}</strong>
                <strong className={hoverData.g4 ? "text-emerald-500" : isDark ? "text-slate-500" : "text-slate-400"}>{hoverData.g4}</strong>|
                <strong className={hoverData.g5 ? "text-emerald-500" : isDark ? "text-slate-500" : "text-slate-400"}>{hoverData.g5}</strong>
                <strong className={hoverData.g6 ? "text-emerald-500" : isDark ? "text-slate-500" : "text-slate-400"}>{hoverData.g6}</strong>
                ]
              </span>
            </div>
            <div className="flex items-center gap-3">
              {selectedPhases.A && (
                <span className="text-rose-500">vₐ*: <strong>{hoverData.vaStar.toFixed(3)}</strong></span>
              )}
              <span className={isDark ? "text-slate-400" : "text-slate-600"}>v_tri: <strong>{hoverData.vTri.toFixed(3)}</strong></span>
              <span className="text-amber-500">Offset: <strong>{hoverData.vOffset.toFixed(3)}</strong></span>
              <span className="text-sky-500">vAB: <strong>{hoverData.vAB.toFixed(0)}V</strong></span>
              {selectedPhases.A && (
                <span className="text-emerald-500">ia: <strong>{hoverData.ia.toFixed(2)}A</strong></span>
              )}
            </div>
          </div>
        )}

        {/* Scrub & Zoom Hint */}
        <div className={`absolute bottom-2 right-3 text-[10px] font-mono px-2 py-0.5 rounded pointer-events-none border ${
          isDark ? 'text-slate-400 bg-slate-950/80 border-slate-800' : 'text-slate-600 bg-white/90 border-slate-200'
        }`}>
          Drag space in waveform to X-Zoom • Double-click or click Reset to unzoom • Click to scrub time
        </div>
      </div>
    </div>
  );
};

/**
 * Renders an opaque floating legend pill at top-right of a channel
 */
function drawLegendPill(
  ctx: CanvasRenderingContext2D,
  rightX: number,
  topY: number,
  items: { text: string; color: string }[],
  isDark: boolean
) {
  ctx.save();
  ctx.font = 'bold 8.5px monospace';

  let totalTextW = 0;
  const itemWidths = items.map(it => {
    const w = ctx.measureText(it.text).width + 12;
    totalTextW += w;
    return w;
  });

  const pillH = 15;
  const pillW = totalTextW + 8;
  const startX = rightX - pillW;

  // Opaque pill background
  ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.95)';
  ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1';
  ctx.lineWidth = 0.8;
  roundRect(ctx, startX, topY, pillW, pillH, 4, true, true);

  // Render items
  let curX = startX + 6;
  items.forEach((item, idx) => {
    ctx.fillStyle = item.color;
    ctx.textAlign = 'left';
    ctx.fillText(item.text, curX, topY + 11);
    curX += itemWidths[idx];
  });

  ctx.restore();
}

/**
 * Helper to render digital gate logic traces with gate labels strictly in the left gutter
 */
function drawGateSignalWithGutter(
  ctx: CanvasRenderingContext2D,
  cycleData: InstantState[],
  signalKey: 'sa' | 'sb' | 'sc' | 'g1' | 'g4' | 'g3' | 'g6' | 'g5' | 'g2',
  topY: number,
  height: number,
  color: string,
  label: string,
  leftGutterW: number,
  rightLimit: number,
  timeToX: (t: number) => number,
  tStart: number,
  tEnd: number,
  curNorm: number,
  isDark: boolean
) {
  const yLow = topY + height - 2;
  const yHigh = topY + 2;

  // Background baseline (Logic 0) starting from gutter divider
  ctx.strokeStyle = isDark ? '#1e293b' : '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(leftGutterW, yLow);
  ctx.lineTo(rightLimit, yLow);
  ctx.stroke();

  // Helper to extract bit value
  const getVal = (pt: InstantState) => {
    if (signalKey === 'sa' || signalKey === 'g1') return pt.g1 ?? pt.sa;
    if (signalKey === 'g2') return pt.g2 ?? (1 - pt.sa);
    if (signalKey === 'sb' || signalKey === 'g3') return pt.g3 ?? pt.sb;
    if (signalKey === 'g4') return pt.g4 ?? (1 - pt.sb);
    if (signalKey === 'sc' || signalKey === 'g5') return pt.g5 ?? pt.sc;
    if (signalKey === 'g6') return pt.g6 ?? (1 - pt.sc);
    return 0;
  };

  // Draw square wave strictly in the waveform area (starting at leftGutterW)
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  let started = false;

  for (let i = 0; i < cycleData.length; i++) {
    const pt = cycleData[i];
    if (pt.time < tStart || pt.time > tEnd) continue;
    const x = timeToX(pt.time);
    const val = getVal(pt);
    const y = val === 1 ? yHigh : yLow;

    if (!started) {
      ctx.moveTo(x, y);
      started = true;
    } else {
      const prevPt = cycleData[i - 1];
      const prevVal = prevPt ? getVal(prevPt) : val;
      if (prevVal !== val) {
        ctx.lineTo(x, prevVal === 1 ? yHigh : yLow);
      }
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();

  // Current value at active cursor
  let curVal = 0;
  if (cycleData.length > 0) {
    const closest = cycleData.reduce((prev, curr) =>
      Math.abs(curr.time - curNorm) < Math.abs(prev.time - curNorm) ? curr : prev
    );
    curVal = getVal(closest);
  }

  // Label badge strictly inside the left gutter (x: 4 to leftGutterW - 4)
  ctx.font = 'bold 8px monospace';
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.fillText(label, 6, topY + height / 2 + 3);

  // Live state tag inside gutter
  ctx.font = 'bold 8px monospace';
  ctx.fillStyle = curVal === 1 ? '#10b981' : isDark ? '#64748b' : '#94a3b8';
  ctx.textAlign = 'right';
  ctx.fillText(curVal === 1 ? '1 ⎍' : '0 _', leftGutterW - 4, topY + height / 2 + 3);

  // Synchronized moving cursor dot indicator on this exact gate trace
  const tSpan = Math.max(0.0001, tEnd - tStart);
  if (curNorm >= tStart && curNorm <= tEnd) {
    const curX = timeToX(curNorm);
    const curY = curVal === 1 ? yHigh : yLow;

    ctx.save();
    ctx.fillStyle = curVal === 1 ? '#10b981' : isDark ? '#475569' : '#94a3b8';
    ctx.strokeStyle = curVal === 1 ? '#d1fae5' : isDark ? '#94a3b8' : '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(curX, curY, curVal === 1 ? 3 : 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Utility to draw rounded rectangles on canvas
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: boolean = false,
  stroke: boolean = true
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

