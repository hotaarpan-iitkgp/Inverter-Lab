import React, { useState, useEffect, useRef, useCallback } from 'react';
import { InstantState, PWMStrategy, Theme, VsiParameters } from './types';
import { computeInstantState } from './utils/pwmEngine';
import { VsiCircuit } from './components/VsiCircuit';
import { Oscilloscope } from './components/Oscilloscope';
import { ControlPanel } from './components/ControlPanel';
import { ModulationDetailCard } from './components/ModulationDetailCard';
import { SpaceVectorHexagon } from './components/SpaceVectorHexagon';
import { HarmonicsViewer } from './components/HarmonicsViewer';
import {
  Cpu,
  Activity,
  Zap,
  Layers,
  BarChart3,
  HelpCircle,
  BookOpen,
  Sparkles,
  RotateCcw,
  Sun,
  Moon,
  PanelLeft,
  PanelLeftClose,
  Maximize2,
  Minimize2,
  Columns2,
  LayoutGrid,
  Sliders,
  X
} from 'lucide-react';

export type DashboardLayoutMode =
  | 'default'               // All Panels (Circuit + Hexagon + Waveforms + Modulation Card)
  | 'fullscreen_circuit'    // Two-Level Power Stage Full Screen
  | 'fullscreen_scope'      // Waveforms Oscilloscope Full Screen
  | 'fullscreen_hexagon'    // Space Vector Hexagon Full Screen
  | 'side_circuit_hexagon'  // Power Stage + Space Vector Side-by-Side
  | 'side_circuit_scope'    // Power Stage + Waveforms Side-by-Side
  | 'side_hexagon_scope';   // Space Vector + Waveforms Side-by-Side

export default function App() {
  // Theme state with local storage persistence
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('vsi_theme');
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('vsi_theme', next);
      return next;
    });
  }, []);

  const isDark = theme !== 'light';

  // Primary simulation parameters
  const [params, setParams] = useState<VsiParameters>({
    strategy: 'MINMAX',
    ma: 0.85,
    f0: 50,
    mf: 21,
    vdc: 400,
    loadR: 10,
    loadL: 25
  });

  // Time and animation state
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(0.5); // 0.5x default for clear observation
  const [activeTab, setActiveTab] = useState<'main' | 'harmonics' | 'guide'>('main');

  // Layout & Full Screen / Side-by-Side Mode States
  const [layoutMode, setLayoutMode] = useState<DashboardLayoutMode>('default');
  const [isControlPanelOpen, setIsControlPanelOpen] = useState<boolean>(true);

  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  // Compute live state for current time t
  const instantState: InstantState = computeInstantState(currentTime, params);

  // Animation Loop (smooth 60fps)
  useEffect(() => {
    if (!isPlaying) {
      lastTimestampRef.current = null;
      return;
    }

    const animate = (timestamp: number) => {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp;
      } else {
        const deltaSeconds = (timestamp - lastTimestampRef.current) / 1000;
        lastTimestampRef.current = timestamp;

        // Advance simulation time scaled by simSpeed
        // At 50Hz, 1 cycle = 0.02s. Real-time at 1x would complete a cycle in 20ms.
        // For visual observation of switches & oscilloscope cursor, scale virtual time
        const virtualDelta = deltaSeconds * simSpeed * 0.02; // slow down factor so 1 cycle takes ~1-2 seconds
        setCurrentTime(prev => prev + virtualDelta);
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, simSpeed, params.f0]);

  // Handler for parameter adjustments
  const handleParamChange = useCallback((newParams: Partial<VsiParameters>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  // Handler for manual time seeking
  const handleSeekTime = useCallback((newTime: number) => {
    setCurrentTime(newTime);
  }, []);

  // Step simulation forward/backward
  const handleStep = useCallback((deltaSec: number) => {
    setCurrentTime(prev => Math.max(0, prev + deltaSec));
  }, []);

  // Strategy Presets
  const applyPreset = (presetKey: string) => {
    switch (presetKey) {
      case 'spwm_standard':
        setParams({
          strategy: 'SPWM',
          ma: 0.85,
          f0: 50,
          mf: 21,
          vdc: 400,
          loadR: 10,
          loadL: 25
        });
        break;
      case 'svpwm_minmax':
        setParams({
          strategy: 'MINMAX',
          ma: 1.0,
          f0: 50,
          mf: 21,
          vdc: 400,
          loadR: 10,
          loadL: 25
        });
        break;
      case 'thipwm_boost':
        setParams({
          strategy: 'THIPWM',
          ma: 1.15,
          f0: 50,
          mf: 21,
          vdc: 400,
          loadR: 10,
          loadL: 25
        });
        break;
      case 'dpwm_clamp':
        setParams({
          strategy: 'DPWM1',
          ma: 0.95,
          f0: 50,
          mf: 21,
          vdc: 400,
          loadR: 10,
          loadL: 25
        });
        break;
      case 'upper_clamp':
        setParams({
          strategy: 'UPPER_CLAMP',
          ma: 0.85,
          f0: 50,
          mf: 21,
          vdc: 400,
          loadR: 10,
          loadL: 25
        });
        break;
      case 'lower_clamp':
        setParams({
          strategy: 'LOWER_CLAMP',
          ma: 0.85,
          f0: 50,
          mf: 21,
          vdc: 400,
          loadR: 10,
          loadL: 25
        });
        break;
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors selection:bg-sky-500 selection:text-white ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* Top Navigation Bar */}
      <header className={`border-b backdrop-blur sticky top-0 z-30 transition-colors ${
        isDark ? 'border-slate-800 bg-slate-900/85' : 'border-slate-200 bg-white/90 shadow-sm'
      }`}>
        <div className="w-full px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-900/30 ring-1 ring-sky-400/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Two-Level VSI & PWM Analyzer
                </h1>
                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                  isDark ? 'bg-sky-950 text-sky-400 border-sky-800/80' : 'bg-sky-50 text-sky-700 border-sky-300 font-semibold'
                }`}>
                  Interactive Simulator
                </span>
              </div>
              <p className={`text-xs hidden sm:block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Working principle, animated current flow, offset injection & oscilloscope waveforms
              </p>
            </div>
          </div>

          {/* Quick Presets, Tabs & Theme Switcher */}
          <div className="flex items-center gap-2.5">
            {/* Navigation Tabs */}
            <div className={`flex items-center p-1 rounded-lg border text-xs font-medium ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => setActiveTab('main')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeTab === 'main'
                    ? 'bg-sky-600 text-white shadow'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Circuit & Oscilloscope
              </button>
              <button
                onClick={() => setActiveTab('harmonics')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                  activeTab === 'harmonics'
                    ? 'bg-purple-600 text-white shadow'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                FFT & Harmonics
              </button>
              <button
                onClick={() => setActiveTab('guide')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                  activeTab === 'guide'
                    ? isDark ? 'bg-slate-800 text-white shadow' : 'bg-slate-800 text-white shadow'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Theory Guide
              </button>
            </div>

            {/* Dark/Light Mode Toggle Button */}
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700 shadow-sm'
                  : 'bg-white hover:bg-slate-50 text-indigo-700 border-slate-300 shadow-sm'
              }`}
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden md:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span className="hidden md:inline">Dark</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Presets Strip (Edge-to-Edge) */}
        <div className={`border-t px-4 sm:px-6 py-1.5 transition-colors ${
          isDark ? 'bg-slate-950/90 border-slate-800/80' : 'bg-slate-50/90 border-slate-200'
        }`}>
          <div className="w-full flex items-center gap-2 overflow-x-auto text-xs font-mono">
            <span className={`whitespace-nowrap flex items-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-600 font-semibold'}`}>
              <Sparkles className="w-3 h-3 text-amber-500" /> Presets:
            </span>
            <button
              onClick={() => applyPreset('spwm_standard')}
              className={`px-2.5 py-0.5 rounded border transition-colors whitespace-nowrap ${
                params.strategy === 'SPWM'
                  ? 'bg-sky-600 text-white border-sky-600 font-semibold shadow-sm'
                  : isDark
                    ? 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              SPWM (Sine PWM)
            </button>
            <button
              onClick={() => applyPreset('svpwm_minmax')}
              className={`px-2.5 py-0.5 rounded border transition-colors whitespace-nowrap ${
                params.strategy === 'MINMAX'
                  ? 'bg-sky-600 text-white border-sky-600 font-semibold shadow-sm'
                  : isDark
                    ? 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              Min-Max (SVPWM)
            </button>
            <button
              onClick={() => applyPreset('thipwm_boost')}
              className={`px-2.5 py-0.5 rounded border transition-colors whitespace-nowrap ${
                params.strategy === 'THIPWM'
                  ? 'bg-sky-600 text-white border-sky-600 font-semibold shadow-sm'
                  : isDark
                    ? 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              Third Harmonic (15.5% Boost)
            </button>
            <button
              onClick={() => applyPreset('dpwm_clamp')}
              className={`px-2.5 py-0.5 rounded border transition-colors whitespace-nowrap ${
                params.strategy === 'DPWM1'
                  ? 'bg-sky-600 text-white border-sky-600 font-semibold shadow-sm'
                  : isDark
                    ? 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              DPWM1 (60° Clamped)
            </button>
            <button
              onClick={() => applyPreset('upper_clamp')}
              className={`px-2.5 py-0.5 rounded border transition-colors whitespace-nowrap ${
                params.strategy === 'UPPER_CLAMP'
                  ? 'bg-sky-600 text-white border-sky-600 font-semibold shadow-sm'
                  : isDark
                    ? 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              Upper Bus Clamping
            </button>
            <button
              onClick={() => applyPreset('lower_clamp')}
              className={`px-2.5 py-0.5 rounded border transition-colors whitespace-nowrap ${
                params.strategy === 'LOWER_CLAMP'
                  ? 'bg-sky-600 text-white border-sky-600 font-semibold shadow-sm'
                  : isDark
                    ? 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              Lower Bus Clamping
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area (Full Horizontal Width with Collapsible Control Pane & Dynamic Layout Modes) */}
      <main className="flex-1 w-full px-3 sm:px-4 lg:px-5 py-3">
        {/* TAB 1: Main Circuit & Oscilloscope View */}
        {activeTab === 'main' && (
          <div className="flex flex-col gap-3 w-full">
            {/* Layout Mode Selector & Control Panel Toggle Bar */}
            <div className={`flex flex-wrap items-center justify-between gap-2.5 p-2 rounded-xl border transition-colors ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              {/* Left: Toggle Control Panel button */}
              <div className="flex items-center gap-2">
                <button
                  id="toggle-control-panel-btn"
                  onClick={() => setIsControlPanelOpen(prev => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    isControlPanelOpen
                      ? isDark
                        ? 'bg-slate-800 text-sky-400 border-slate-700 hover:bg-slate-700'
                        : 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
                      : isDark
                        ? 'bg-amber-950/50 text-amber-300 border-amber-800/60 hover:bg-amber-900/60 shadow-sm'
                        : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 shadow-sm'
                  }`}
                  title={isControlPanelOpen ? 'Collapse Left Control Panel' : 'Expand Left Control Panel'}
                >
                  {isControlPanelOpen ? (
                    <>
                      <PanelLeftClose className="w-3.5 h-3.5" />
                      <span>Hide Controls</span>
                    </>
                  ) : (
                    <>
                      <PanelLeft className="w-3.5 h-3.5" />
                      <span>Show Controls</span>
                    </>
                  )}
                </button>

                {/* Status indicator */}
                <span className={`text-[11px] font-mono hidden sm:inline ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {isControlPanelOpen ? 'Sidebar Docked' : 'Sidebar Collapsed (100% Canvas)'}
                </span>
              </div>

              {/* Right: Layout Switcher (Default, Full Screen modes, Side-by-Side modes) */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Default All Panels */}
                <button
                  onClick={() => setLayoutMode('default')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    layoutMode === 'default'
                      ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
                      : isDark
                        ? 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                  title="Default View: Power Stage, Hexagon, and Waveforms combined"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>All Panels</span>
                </button>

                {/* Full Screen Menu / Group */}
                <div className={`flex items-center p-0.5 rounded-lg border text-xs ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-100 border-slate-200'
                }`}>
                  <span className={`text-[10px] font-mono px-1.5 flex items-center gap-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    <Maximize2 className="w-3 h-3 text-amber-400" /> Full Screen:
                  </span>
                  <button
                    onClick={() => setLayoutMode(layoutMode === 'fullscreen_circuit' ? 'default' : 'fullscreen_circuit')}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                      layoutMode === 'fullscreen_circuit'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-white'
                    }`}
                    title="Two-Level Power Stage in Full Screen"
                  >
                    ⚡ Power Stage
                  </button>
                  <button
                    onClick={() => setLayoutMode(layoutMode === 'fullscreen_scope' ? 'default' : 'fullscreen_scope')}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                      layoutMode === 'fullscreen_scope'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-white'
                    }`}
                    title="Oscilloscope Waveforms in Full Screen"
                  >
                    📈 Waveforms
                  </button>
                  <button
                    onClick={() => setLayoutMode(layoutMode === 'fullscreen_hexagon' ? 'default' : 'fullscreen_hexagon')}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                      layoutMode === 'fullscreen_hexagon'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-white'
                    }`}
                    title="Space Vector Hexagon in Full Screen"
                  >
                    🎯 Space Vector
                  </button>
                </div>

                {/* Side-by-Side Menu / Group */}
                <div className={`flex items-center p-0.5 rounded-lg border text-xs ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-100 border-slate-200'
                }`}>
                  <span className={`text-[10px] font-mono px-1.5 flex items-center gap-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    <Columns2 className="w-3 h-3 text-sky-400" /> Side-by-Side:
                  </span>
                  <button
                    onClick={() => setLayoutMode(layoutMode === 'side_circuit_hexagon' ? 'default' : 'side_circuit_hexagon')}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                      layoutMode === 'side_circuit_hexagon'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-white'
                    }`}
                    title="Two-Level Power Stage + Space Vector Hexagon side by side"
                  >
                    ⚡ + 🎯
                  </button>
                  <button
                    onClick={() => setLayoutMode(layoutMode === 'side_circuit_scope' ? 'default' : 'side_circuit_scope')}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                      layoutMode === 'side_circuit_scope'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-white'
                    }`}
                    title="Two-Level Power Stage + Oscilloscope Waveforms side by side"
                  >
                    ⚡ + 📈
                  </button>
                  <button
                    onClick={() => setLayoutMode(layoutMode === 'side_hexagon_scope' ? 'default' : 'side_hexagon_scope')}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
                      layoutMode === 'side_hexagon_scope'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-white'
                    }`}
                    title="Space Vector Hexagon + Oscilloscope Waveforms side by side"
                  >
                    🎯 + 📈
                  </button>
                </div>
              </div>
            </div>

            {/* If in specialized layout mode, show a small contextual banner */}
            {layoutMode !== 'default' && (
              <div className={`flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs font-mono ${
                isDark ? 'bg-amber-950/30 border-amber-800/40 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span>
                    Current View Mode:{' '}
                    <strong>
                      {layoutMode === 'fullscreen_circuit' && 'Full Screen: Two-Level Power Stage'}
                      {layoutMode === 'fullscreen_scope' && 'Full Screen: Oscilloscope Waveforms'}
                      {layoutMode === 'fullscreen_hexagon' && 'Full Screen: Space Vector Hexagon'}
                      {layoutMode === 'side_circuit_hexagon' && 'Side-by-Side: Power Stage + Space Vector Hexagon'}
                      {layoutMode === 'side_circuit_scope' && 'Side-by-Side: Power Stage + Oscilloscope Waveforms'}
                      {layoutMode === 'side_hexagon_scope' && 'Side-by-Side: Space Vector Hexagon + Oscilloscope Waveforms'}
                    </strong>
                  </span>
                </div>
                <button
                  onClick={() => setLayoutMode('default')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${
                    isDark ? 'bg-amber-900/60 hover:bg-amber-800 text-amber-200 border-amber-700' : 'bg-white hover:bg-amber-100 text-amber-900 border-amber-300'
                  }`}
                >
                  <X className="w-3 h-3" /> Exit to All Panels
                </button>
              </div>
            )}

            {/* Layout Container: Left Control Panel + Right Main Dynamic Canvas */}
            <div className="flex flex-col lg:flex-row items-start gap-4 w-full">
              {/* Narrow Left Control Panel Pane (Collapsible) */}
              {isControlPanelOpen ? (
                <aside className="w-full lg:w-80 xl:w-[320px] flex-shrink-0 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto pr-0 lg:pr-1 transition-all">
                  <ControlPanel
                    params={params}
                    onChangeParams={handleParamChange}
                    isPlaying={isPlaying}
                    onTogglePlay={() => setIsPlaying(p => !p)}
                    simSpeed={simSpeed}
                    onChangeSpeed={setSimSpeed}
                    currentTime={currentTime}
                    onSeekTime={handleSeekTime}
                    onStep={handleStep}
                    theme={theme}
                    onToggleTheme={toggleTheme}
                    onCollapse={() => setIsControlPanelOpen(false)}
                  />
                </aside>
              ) : (
                /* Sleek Collapsed Strip: 1-click re-open trigger */
                <button
                  onClick={() => setIsControlPanelOpen(true)}
                  className={`hidden lg:flex flex-col items-center justify-center p-2 rounded-xl border gap-2 transition-all hover:scale-105 sticky top-20 shadow-md ${
                    isDark
                      ? 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-sky-400 hover:border-sky-500/50'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-sky-600 hover:border-sky-300'
                  }`}
                  title="Expand Control Panel (Speed, Vdc, Modulation Strategy)"
                >
                  <PanelLeft className="w-4 h-4 text-sky-500" />
                  <span className="text-[10px] font-mono tracking-widest [writing-mode:vertical-lr] rotate-180 uppercase font-bold py-1">
                    Controls
                  </span>
                </button>
              )}

              {/* Right Expansive Workspace: Rendered according to layoutMode */}
              <div className="flex-1 min-w-0 w-full flex flex-col gap-4">
                {/* MODE: DEFAULT (All Panels Grid) */}
                {layoutMode === 'default' && (
                  <>
                    {/* Top Row: Circuit Diagram + Space Vector Hexagon */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                      {/* VSI Circuit Schematic (Left 8 cols) */}
                      <div className="xl:col-span-8 min-w-0">
                        <VsiCircuit
                          state={instantState}
                          params={params}
                          theme={theme}
                          isFullScreen={false}
                          onToggleFullScreen={() => setLayoutMode('fullscreen_circuit')}
                          onSelectSideBySide={paired => setLayoutMode(paired === 'hexagon' ? 'side_circuit_hexagon' : 'side_circuit_scope')}
                        />
                      </div>

                      {/* Space Vector Hexagon & Trajectory (Right 4 cols) */}
                      <div className="xl:col-span-4 min-w-0 flex flex-col h-full">
                        <SpaceVectorHexagon
                          params={params}
                          instantState={instantState}
                          theme={theme}
                          isFullScreen={false}
                          onToggleFullScreen={() => setLayoutMode('fullscreen_hexagon')}
                          onSelectSideBySide={paired => setLayoutMode(paired === 'circuit' ? 'side_circuit_hexagon' : 'side_hexagon_scope')}
                        />
                      </div>
                    </div>

                    {/* Middle: Oscilloscope Display (Full-width high-resolution DSO) */}
                    <div className="w-full min-w-0">
                      <Oscilloscope
                        params={params}
                        currentTime={currentTime}
                        onSeekTime={handleSeekTime}
                        instantState={instantState}
                        theme={theme}
                        isFullScreen={false}
                        onToggleFullScreen={() => setLayoutMode('fullscreen_scope')}
                        onSelectSideBySide={paired => setLayoutMode(paired === 'circuit' ? 'side_circuit_scope' : 'side_hexagon_scope')}
                      />
                    </div>

                    {/* Bottom Row: Detailed PWM Strategy Offset Card */}
                    <div className="w-full min-w-0">
                      <ModulationDetailCard params={params} instantState={instantState} theme={theme} />
                    </div>
                  </>
                )}

                {/* MODE: FULL SCREEN POWER STAGE */}
                {layoutMode === 'fullscreen_circuit' && (
                  <div className="w-full min-w-0 flex-1">
                    <VsiCircuit
                      state={instantState}
                      params={params}
                      theme={theme}
                      isFullScreen={true}
                      onToggleFullScreen={() => setLayoutMode('default')}
                      onSelectSideBySide={paired => setLayoutMode(paired === 'hexagon' ? 'side_circuit_hexagon' : 'side_circuit_scope')}
                    />
                  </div>
                )}

                {/* MODE: FULL SCREEN OSCILLOSCOPE WAVEFORMS */}
                {layoutMode === 'fullscreen_scope' && (
                  <div className="w-full min-w-0 flex-1">
                    <Oscilloscope
                      params={params}
                      currentTime={currentTime}
                      onSeekTime={handleSeekTime}
                      instantState={instantState}
                      theme={theme}
                      isFullScreen={true}
                      onToggleFullScreen={() => setLayoutMode('default')}
                      onSelectSideBySide={paired => setLayoutMode(paired === 'circuit' ? 'side_circuit_scope' : 'side_hexagon_scope')}
                    />
                  </div>
                )}

                {/* MODE: FULL SCREEN SPACE VECTOR HEXAGON */}
                {layoutMode === 'fullscreen_hexagon' && (
                  <div className="w-full min-w-0 flex-1 flex flex-col h-full">
                    <SpaceVectorHexagon
                      params={params}
                      instantState={instantState}
                      theme={theme}
                      isFullScreen={true}
                      onToggleFullScreen={() => setLayoutMode('default')}
                      onSelectSideBySide={paired => setLayoutMode(paired === 'circuit' ? 'side_circuit_hexagon' : 'side_hexagon_scope')}
                    />
                  </div>
                )}

                {/* MODE: SIDE-BY-SIDE (Circuit + Hexagon) */}
                {layoutMode === 'side_circuit_hexagon' && (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 w-full flex-1 items-stretch">
                    <div className="min-w-0 flex flex-col h-full">
                      <VsiCircuit
                        state={instantState}
                        params={params}
                        theme={theme}
                        isFullScreen={false}
                        onToggleFullScreen={() => setLayoutMode('fullscreen_circuit')}
                        onSelectSideBySide={paired => setLayoutMode(paired === 'hexagon' ? 'side_circuit_hexagon' : 'side_circuit_scope')}
                      />
                    </div>
                    <div className="min-w-0 flex flex-col h-full">
                      <SpaceVectorHexagon
                        params={params}
                        instantState={instantState}
                        theme={theme}
                        isFullScreen={false}
                        onToggleFullScreen={() => setLayoutMode('fullscreen_hexagon')}
                        onSelectSideBySide={paired => setLayoutMode(paired === 'circuit' ? 'side_circuit_hexagon' : 'side_hexagon_scope')}
                      />
                    </div>
                  </div>
                )}

                {/* MODE: SIDE-BY-SIDE (Circuit + Waveforms) */}
                {layoutMode === 'side_circuit_scope' && (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 w-full flex-1 items-stretch">
                    <div className="min-w-0 flex flex-col h-full">
                      <VsiCircuit
                        state={instantState}
                        params={params}
                        theme={theme}
                        isFullScreen={false}
                        onToggleFullScreen={() => setLayoutMode('fullscreen_circuit')}
                        onSelectSideBySide={paired => setLayoutMode(paired === 'hexagon' ? 'side_circuit_hexagon' : 'side_circuit_scope')}
                      />
                    </div>
                    <div className="min-w-0 flex flex-col h-full">
                      <Oscilloscope
                        params={params}
                        currentTime={currentTime}
                        onSeekTime={handleSeekTime}
                        instantState={instantState}
                        theme={theme}
                        isFullScreen={false}
                        onToggleFullScreen={() => setLayoutMode('fullscreen_scope')}
                        onSelectSideBySide={paired => setLayoutMode(paired === 'circuit' ? 'side_circuit_scope' : 'side_hexagon_scope')}
                      />
                    </div>
                  </div>
                )}

                {/* MODE: SIDE-BY-SIDE (Hexagon + Waveforms) */}
                {layoutMode === 'side_hexagon_scope' && (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 w-full flex-1 items-stretch">
                    <div className="min-w-0 flex flex-col h-full">
                      <SpaceVectorHexagon
                        params={params}
                        instantState={instantState}
                        theme={theme}
                        isFullScreen={false}
                        onToggleFullScreen={() => setLayoutMode('fullscreen_hexagon')}
                        onSelectSideBySide={paired => setLayoutMode(paired === 'circuit' ? 'side_circuit_hexagon' : 'side_hexagon_scope')}
                      />
                    </div>
                    <div className="min-w-0 flex flex-col h-full">
                      <Oscilloscope
                        params={params}
                        currentTime={currentTime}
                        onSeekTime={handleSeekTime}
                        instantState={instantState}
                        theme={theme}
                        isFullScreen={false}
                        onToggleFullScreen={() => setLayoutMode('fullscreen_scope')}
                        onSelectSideBySide={paired => setLayoutMode(paired === 'circuit' ? 'side_circuit_scope' : 'side_hexagon_scope')}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Harmonics & FFT Analysis */}
        {activeTab === 'harmonics' && (
          <div className="space-y-5">
            <HarmonicsViewer params={params} theme={theme} />

            {/* Harmonic Theory Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl border space-y-2 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <h3 className="text-sm font-semibold text-sky-500">Triplen Harmonics Cancellation</h3>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  In a 3-phase 3-wire star or delta load, triplen harmonics (3rd, 9th, 15th...) are co-phasal (zero-sequence).
                  When computing line voltages:
                </p>
                <div className={`p-2 rounded border font-mono text-xs ${
                  isDark ? 'bg-slate-950 border-slate-800 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}>
                  vAB = vAn - vBn → 3rd harmonic components are identical and subtract to ZERO!
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  This is why injecting a 3rd harmonic (THIPWM) or Min-Max offset does NOT distort the output line voltages or motor load currents, while boosting fundamental voltage by 15.5%.
                </p>
              </div>

              <div className={`p-4 rounded-xl border space-y-2 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <h3 className="text-sm font-semibold text-purple-500">Switching Frequency Sidebands</h3>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  The harmonic spectrum of carrier-based PWM consists of carrier frequency clusters:
                </p>
                <ul className={`text-xs font-mono space-y-1 list-disc list-inside ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <li>Cluster around mf: mf ± 2, mf ± 4</li>
                  <li>Cluster around 2·mf: 2·mf ± 1, 2·mf ± 3</li>
                  <li>Cluster around 3·mf: 3·mf ± 2, 3·mf ± 4</li>
                </ul>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Because these high-frequency sidebands are situated far above the fundamental (e.g. at {params.f0 * params.mf} Hz), the inductive load naturally filters them out, producing smooth sinusoidal current.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Theory & Working Principle Guide */}
        {activeTab === 'guide' && (
          <div className="space-y-6 max-w-4xl mx-auto py-2">
            <div className={`p-6 rounded-2xl border space-y-4 shadow-xl ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <h2 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <BookOpen className="w-5 h-5 text-sky-500" />
                Working Principle of a Two-Level Voltage Source Inverter (VSI)
              </h2>

              <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                A <strong>two-level three-phase Voltage Source Inverter (VSI)</strong> converts a DC voltage source (Vdc) into variable-voltage, variable-frequency AC power. It consists of three legs (Phases A, B, and C), each containing two power switches (MOSFETs) connected in series with antiparallel freewheeling body diodes.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className={`p-4 rounded-lg border space-y-2 ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <h3 className="text-sm font-semibold text-rose-500">1. Leg Complementary Operation</h3>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    In each leg, the top and bottom switches operate in a strictly complementary manner to prevent a short-circuit across the DC bus (shoot-through):
                  </p>
                  <ul className={`text-xs font-mono space-y-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <li>• If top switch is ON (Sx = 1): vxO = +Vdc/2</li>
                    <li>• If bottom switch is ON (Sx = 0): vxO = -Vdc/2</li>
                  </ul>
                </div>

                <div className={`p-4 rounded-lg border space-y-2 ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <h3 className="text-sm font-semibold text-emerald-500">2. Diode vs MOSFET Conduction</h3>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Even though a gate pulse is applied, current flows through the MOSFET channel or the antiparallel diode depending on current direction:
                  </p>
                  <ul className={`text-xs font-mono space-y-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <li>• Sx = 1 and ix &gt; 0: flows through <strong>top MOSFET (M)</strong></li>
                    <li>• Sx = 1 and ix &lt; 0: freewheels through <strong>top Diode (D)</strong></li>
                    <li>• Sx = 0 and ix &lt; 0: flows through <strong>bottom MOSFET (M)</strong></li>
                    <li>• Sx = 0 and ix &gt; 0: freewheels through <strong>bottom Diode (D)</strong></li>
                  </ul>
                </div>
              </div>

              <div className={`border-t pt-4 space-y-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Summary of PWM Strategies Compared
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      <tr className={`border-b ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-600'}`}>
                        <th className="py-2 pr-4">Strategy</th>
                        <th className="py-2 pr-4">Injected Offset v_offset</th>
                        <th className="py-2 pr-4">Max Linear ma</th>
                        <th className="py-2 pr-4">Switching Loss</th>
                        <th className="py-2">Primary Advantage</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-slate-800 text-slate-300' : 'divide-slate-200 text-slate-700'}`}>
                      <tr>
                        <td className={`py-2.5 font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Conventional SPWM</td>
                        <td className={`py-2.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>0</td>
                        <td className="py-2.5 text-rose-500 font-bold">1.000</td>
                        <td className={`py-2.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Baseline (100%)</td>
                        <td className="py-2.5">Simplicity, continuous carrier modulation</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold text-sky-500">Min-Max (SVPWM)</td>
                        <td className="py-2.5 text-amber-500 font-bold">-0.5 · (max + min)</td>
                        <td className="py-2.5 text-emerald-500 font-bold">1.155 (+15.5%)</td>
                        <td className={`py-2.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Continuous</td>
                        <td className="py-2.5">Exact carrier equivalent to Space Vector Modulation</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold text-purple-500">Third Harmonic (THIPWM)</td>
                        <td className="py-2.5 text-amber-500 font-bold">(ma/6) · sin(3ωt)</td>
                        <td className="py-2.5 text-emerald-500 font-bold">1.155 (+15.5%)</td>
                        <td className={`py-2.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Continuous</td>
                        <td className="py-2.5">Flattens modulation wave crest, cancels in line voltages</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold text-emerald-500">DPWM1 (60° Clamping)</td>
                        <td className="py-2.5 text-amber-500 font-bold">(max+min≥0)? 1-max : -1-min</td>
                        <td className="py-2.5 text-emerald-500 font-bold">1.155 (+15.5%)</td>
                        <td className="py-2.5 text-emerald-500 font-bold">-33% to -50%</td>
                        <td className="py-2.5">Stops switching during peak current, lowest thermal loss</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold text-amber-500">Upper Bus Clamping</td>
                        <td className="py-2.5 text-amber-500 font-bold">1.0 - max</td>
                        <td className="py-2.5 text-emerald-500 font-bold">1.155</td>
                        <td className="py-2.5 text-emerald-500 font-bold">-33% transitions</td>
                        <td className="py-2.5">Keeps positive rail switch continuously ON</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold text-sky-500">Lower Bus Clamping</td>
                        <td className="py-2.5 text-amber-500 font-bold">-1.0 - min</td>
                        <td className="py-2.5 text-emerald-500 font-bold">1.155</td>
                        <td className="py-2.5 text-emerald-500 font-bold">-33% transitions</td>
                        <td className="py-2.5">Keeps negative rail switch continuously ON</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={`border-t py-3 text-center text-xs font-mono transition-colors ${
        isDark ? 'border-slate-900 bg-slate-950 text-slate-500' : 'border-slate-200 bg-white text-slate-500 shadow-inner'
      }`}>
        Two-Level Voltage Source Inverter (VSI) Carrier-Based PWM Simulator & Analyzer
      </footer>
    </div>
  );
}
