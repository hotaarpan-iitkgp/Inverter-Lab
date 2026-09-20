import React, { useState } from 'react';
import { RefreshCw, ExternalLink, Info, CheckCircle2 } from 'lucide-react';

export default function PowerSimApp() {
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col w-full h-[calc(100vh-48px)] bg-[#090B0E] relative overflow-hidden">
      {/* PowerSim Sub-Header info strip */}
      <div className="bg-[#11141B] border-b border-[#242B38] px-4 py-1.5 flex items-center justify-between gap-3 text-xs shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00FF9C] shadow-[0_0_8px_#00FF9C]"></span>
          <span className="font-semibold text-slate-200">PowerSim Classic:</span>
          <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
            1-Ph Half-Bridge • 1-Ph H-Bridge • 3-Ph 6-Switch VSI • Current Source Inverter (CSI)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReload}
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#161B24] hover:bg-[#1E2430] border border-[#242B38] text-slate-300 text-[11px] transition-colors"
            title="Reset Simulation Canvas"
          >
            <RefreshCw className="w-3 h-3 text-[#00FF9C]" />
            <span className="hidden md:inline">Reset</span>
          </button>
          <a
            href="/powersim.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#161B24] hover:bg-[#1E2430] border border-[#242B38] text-slate-300 text-[11px] transition-colors"
            title="Open PowerSim standalone in new tab"
          >
            <ExternalLink className="w-3 h-3 text-sky-400" />
            <span className="hidden md:inline">Full Window</span>
          </a>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 top-8 flex flex-col items-center justify-center bg-[#090B0E] z-10 gap-2">
          <div className="w-7 h-7 border-2 border-[#00FF9C] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-mono text-slate-400">Loading PowerSim Multi-Topology Engine...</span>
        </div>
      )}

      {/* Embedded Simulation Canvas Frame */}
      <iframe
        key={iframeKey}
        src="/powersim.html"
        title="PowerSim Interactive Inverter Visualizer"
        className="w-full flex-1 border-0 h-full bg-[#090B0E]"
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
}
