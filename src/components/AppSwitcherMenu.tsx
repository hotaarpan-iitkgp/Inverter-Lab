import React, { useState, useRef, useEffect } from 'react';
import {
  Zap,
  Cpu,
  Activity,
  ChevronDown,
  CheckCircle2,
  Layers
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
    shortLabel: 'Two-Level VSI & PWM',
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
    badge: 'SiC 3-Level',
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
    accentColor: 'text-[#00FF9C]',
    borderColor: 'border-emerald-500/40',
    bgLight: 'bg-emerald-500/10',
    tags: ['Half-Bridge', 'H-Bridge', '3-Phase', 'CSI']
  }
];

interface AppSwitcherMenuProps {
  activeAppId: InverterAppId;
  onSelectApp: (id: InverterAppId) => void;
  isDark?: boolean;
}

export function AppSwitcherMenu({
  activeAppId,
  onSelectApp,
  isDark = true
}: AppSwitcherMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeApp = APPS.find((a) => a.id === activeAppId) || APPS[0];
  const ActiveIcon = activeApp.icon;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Switcher Trigger Button */}
      <button
        type="button"
        id="app-switcher-trigger-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all duration-150 cursor-pointer shadow-sm ${
          isOpen
            ? isDark
              ? 'bg-slate-800 border-sky-400 text-white ring-2 ring-sky-500/20 shadow-md'
              : 'bg-slate-100 border-sky-500 text-slate-900 ring-2 ring-sky-500/20 shadow-md'
            : isDark
              ? 'bg-slate-900/95 hover:bg-slate-800 border-slate-700/80 text-slate-200 hover:border-slate-600'
              : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800 hover:border-slate-400'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Switch Inverter Application"
      >
        <div className="flex items-center gap-1.5">
          <ActiveIcon className={`w-4 h-4 shrink-0 ${activeApp.accentColor}`} />
          <span className="font-bold text-xs sm:text-sm tracking-tight whitespace-nowrap">
            {activeApp.shortLabel}
          </span>
        </div>

        <span
          className={`hidden sm:inline-block text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border whitespace-nowrap ${
            isDark
              ? 'bg-slate-800/80 text-slate-300 border-slate-700'
              : 'bg-slate-100 text-slate-600 border-slate-200 font-semibold'
          }`}
        >
          {activeApp.badge}
        </span>

        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-sky-400' : isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        />
      </button>

      {/* Switcher Dropdown Menu */}
      {isOpen && (
        <div
          id="app-switcher-dropdown-panel"
          className="absolute left-0 mt-1.5 w-[330px] sm:w-[410px] bg-slate-900/98 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in-50 zoom-in-95 duration-100"
          style={{ maxHeight: 'calc(100vh - 70px)', overflowY: 'auto' }}
        >
          <div className="px-3 py-1.5 border-b border-slate-800 flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-sky-400" />
              Switch Inverter Tool
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
              3 Workbench Engines
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
                    setIsOpen(false);
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
  );
}
