import React, { useState, useEffect } from 'react';
import { MasterHeader, InverterAppId } from './components/MasterHeader';
import TwoLevelVsiApp from './apps/vsi2level/App';
import TractionInverterApp from './apps/traction/App';
import PowerSimApp from './apps/powersim/PowerSimApp';

export default function App() {
  const [activeAppId, setActiveAppId] = useState<InverterAppId>(() => {
    const saved = localStorage.getItem('inverter_suite_active_app');
    if (saved === 'vsi2level' || saved === 'traction' || saved === 'powersim') {
      return saved;
    }
    return 'vsi2level';
  });

  const handleSelectApp = (id: InverterAppId) => {
    setActiveAppId(id);
    localStorage.setItem('inverter_suite_active_app', id);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Universal Master Header with Dropdown Menu */}
      <MasterHeader activeAppId={activeAppId} onSelectApp={handleSelectApp} />

      {/* Main Inverter App Workspace */}
      <div className="flex-1 flex flex-col w-full relative">
        {activeAppId === 'vsi2level' && <TwoLevelVsiApp />}
        {activeAppId === 'traction' && <TractionInverterApp />}
        {activeAppId === 'powersim' && <PowerSimApp />}
      </div>
    </div>
  );
}
