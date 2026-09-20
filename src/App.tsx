import React, { useState, useEffect } from 'react';
import { InverterAppId } from './components/AppSwitcherMenu';
import TwoLevelVsiApp from './apps/vsi2level/App';
import TractionInverterApp from './apps/traction/App';
import PowerSimApp from './apps/powersim/PowerSimApp';

export default function App() {
  const [activeAppId, setActiveAppId] = useState<InverterAppId>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const paramApp = params.get('app');
      if (paramApp === 'vsi2level' || paramApp === 'traction' || paramApp === 'powersim') {
        return paramApp;
      }
    } catch {
      // Ignore URL parsing errors
    }
    const saved = localStorage.getItem('inverter_suite_active_app');
    if (saved === 'vsi2level' || saved === 'traction' || saved === 'powersim') {
      return saved;
    }
    return 'vsi2level';
  });

  const handleSelectApp = (id: InverterAppId) => {
    setActiveAppId(id);
    localStorage.setItem('inverter_suite_active_app', id);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('app', id);
      window.history.replaceState({}, '', url.toString());
    } catch {
      // Ignore history state errors
    }
  };

  // Listen to postMessage from PowerSim iframe when an app is switched from within PowerSim
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (
        e.data &&
        e.data.type === 'SWITCH_APP' &&
        (e.data.appId === 'vsi2level' || e.data.appId === 'traction' || e.data.appId === 'powersim')
      ) {
        handleSelectApp(e.data.appId);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 
        No external header reducing the app window size!
        Each app renders its own full native header with the constant AppSwitcherMenu embedded directly inside it.
      */}
      {activeAppId === 'vsi2level' && (
        <TwoLevelVsiApp activeAppId={activeAppId} onSelectApp={handleSelectApp} />
      )}
      {activeAppId === 'traction' && (
        <TractionInverterApp activeAppId={activeAppId} onSelectApp={handleSelectApp} />
      )}
      {activeAppId === 'powersim' && (
        <PowerSimApp activeAppId={activeAppId} onSelectApp={handleSelectApp} />
      )}
    </div>
  );
}
