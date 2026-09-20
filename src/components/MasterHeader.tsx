import React, { useState, useRef, useEffect } from 'react';
import {
  Zap,
  Cpu,
  Activity,
  ChevronDown,
  CheckCircle2,
  Sliders,
  Layers,
  Sparkles
} from 'lucide-react';

export type InverterAppId = 'vsi2level' | 'traction' | 'powersim';

export interface AppConfig {
  id: InverterAppId;
  name: string;
  shortLabel: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  borderColor: string;
  bgLight: string;
  tags: string[];
}

export const APPS: AppConfig[] = [
  {
    id: 'vsi2level',
    name: 'Two-Level VSI Simulator & PWM Analyzer',
    shortLabel: '2-Level VSI & PWM',
    badge: 'Carrier & Space Vector',
    description: 'SPWM, THIPWM, SVPWM, DPWM0/1/2/3, offset injection, space vector hexagon, harmonics FFT & dynamic bridge schematic.',
    icon: Zap,
    accentColor: 'text-sky-400',
    borderColor: 'border-sky-500/40',
    bgLight: 'bg-sky-500/10',
    tags: ['2L-VSI', 'SVPWM', 'Hexagon', 'FFT']
  },
  {
    id: 'traction',
    name: 'EV Traction Inverter & ANPC Workbench',
    shortLabel: 'EV Traction Inverter',
    badge: 'SiC Multi-Level',
    description: '2-Level VSI, 3-Level NPC, 3-Level ANPC Control Studio, 3-Level TNPC, OEW-VSI, switching losses & 5-channel oscilloscope.',
    icon: Cpu,
    accentColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/40',
    bgLight: 'bg-emerald-500/10',
    tags: ['3L-ANPC', 'NPC', 'T-Type', 'Losses']
  },
  {
    id: 'powersim',
    name: 'PowerSim: Multi-Topology Visualizer',
    shortLabel: 'PowerSim Multi-Topo',
    badge: '1-Ph / 3-Ph / CSI',
    description: '1-Phase Half-Bridge, 1-Phase H-Bridge, 3-Phase 6-Switch VSI, and CSI with IEEE 315 MOSFET schematic animation & live diagnostics.',
    icon: Activity,
    accentColor: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    bgLight: 'bg-amber-500/10',
    tags: ['Half-Bridge', 'H-Bridge', '3-Phase', 'CSI']
  }
];

interface MasterHeaderProps {
  activeAppId: InverterAppId;
  onSelectApp: (id: InverterAppId) => void;
}

export function MasterHeader({ activeAppId, onSelectApp }: MasterHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeApp = APPS.find((a) => a.id === activeAppId) || APPS[0];
  const ActiveIcon = activeApp.icon;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-slate-950 border-b border-slate-800 text-slate-100 sticky top-0 z-50 shadow-md">
      <div className="w-full px-3 sm:px-5 py-2 flex items-center justify-between gap-3">
        {/* Left: Suite Logo & App Selector Dropdown */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pr-2 border-r border-slate-800">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-500 via-indigo-500 to-emerald-400 p-0.5 flex items-center justify-center shadow-md shadow-sky-950">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div className="hidden lg:block">
              <div className="text-xs font-bold tracking-tight text-white leading-tight">
                INVERTER SUITE
              </div>
              <div className="text-[9px] font-mono text-slate-400">PowerSim v3.0</div>
            </div>
          </div>

          {/* Core App Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              id="header-app-dropdown-btn"
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-150 text-xs font-medium cursor-pointer ${
                isDropdownOpen
                  ? 'bg-slate-800 border-sky-400 text-white shadow-lg ring-2 ring-sky-500/20'
                  : 'bg-slate-900/90 hover:bg-slate-850 border-slate-700 text-slate-200 hover:border-slate-600 shadow-sm'
              }`}
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
              aria-label="Select Inverter Application"
            >
              <ActiveIcon className={`w-4 h-4 ${activeApp.accentColor}`} />
              <span className="font-bold text-xs sm:text-sm tracking-tight text-white">
                {activeApp.shortLabel}
              </span>
              <span className="hidden sm:inline text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                {activeApp.badge}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180 text-sky-400' : ''
                }`}
              />
            </button>

            {/* Dropdown Popup Card */}
            {isDropdownOpen && (
              <div
                id="header-app-dropdown-menu"
                className="absolute left-0 mt-2 w-[340px] sm:w-[420px] bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in-50 zoom-in-95 duration-100"
              >
                <div className="px-3 py-1.5 border-b border-slate-800 flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">
                    Switch Inverter Application
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/40">
                    3 Apps Merged
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  {APPS.map((app) => {
                    const isSelected = app.id === activeAppId;
                    const IconComponent = app.icon;
                    return (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => {
                          onSelectApp(app.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-start gap-3 cursor-pointer ${
                          isSelected
                            ? `${app.bgLight} ${app.borderColor} shadow-md`
                            : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/70 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg border shrink-0 mt-0.5 ${
                            isSelected
                              ? `${app.bgLight} ${app.borderColor}`
                              : 'bg-slate-900 border-slate-800'
                          }`}
                        >
                          <IconComponent className={`w-4 h-4 ${app.accentColor}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1.5">
                            <span
                              className={`text-xs font-bold truncate ${
                                isSelected ? 'text-white' : 'text-slate-200'
                              }`}
                            >
                              {app.name}
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            )}
                          </div>

                          <p className="text-[11px] text-slate-400 leading-snug mt-1 line-clamp-2">
                            {app.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-1 mt-2">
                            {app.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center/Right: Quick Switcher Tabs (Visible on tablet & desktop) */}
        <div className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
          {APPS.map((app) => {
            const isSelected = app.id === activeAppId;
            const Icon = app.icon;
            return (
              <button
                key={app.id}
                type="button"
                onClick={() => onSelectApp(app.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
                title={app.name}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? app.accentColor : 'text-slate-500'}`} />
                <span>{app.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Far Right: Live Engine Indicator */}
        <div className="flex items-center gap-2 text-xs font-mono shrink-0">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]"></span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">Engine:</span>
            <span className="text-[11px] font-bold text-emerald-400">Synchronized</span>
          </div>
        </div>
      </div>
    </header>
  );
}
