import React, { useState, useMemo } from 'react';
import { RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';

/**
 * Dynamically resolves the correct absolute URL for powersim.html.
 * This guarantees proper loading in:
 * 1. GitHub Pages subpaths (https://<username>.github.io/<repo-name>/powersim.html)
 * 2. Cloud Run preview environments (https://<domain>/powersim.html)
 * 3. Local Vite development server (http://localhost:3000/powersim.html)
 */
function resolvePowerSimUrl(): string {
  if (typeof window === 'undefined') return './powersim.html';

  const metaEnv = ((import.meta as unknown) as { env?: { BASE_URL?: string } })?.env;
  const base = metaEnv?.BASE_URL;

  // 1. If Vite base is an absolute subpath (e.g. '/my-repo/' or '/subpath/')
  if (base && base.startsWith('/') && base !== '/') {
    const cleanBase = base.endsWith('/') ? base : `${base}/`;
    return `${window.location.origin}${cleanBase}powersim.html`;
  }

  // 2. Otherwise calculate accurately from the current window pathname
  let pathname = window.location.pathname;
  if (!pathname.endsWith('/')) {
    // If it has a file extension like index.html, strip the file part
    if (pathname.includes('.') || pathname.split('/').pop()?.includes('.')) {
      pathname = pathname.substring(0, pathname.lastIndexOf('/') + 1);
    } else {
      pathname = `${pathname}/`;
    }
  }

  return `${window.location.origin}${pathname}powersim.html`;
}

export default function PowerSimApp() {
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  const powerSimUrl = useMemo(() => resolvePowerSimUrl(), []);

  const handleReload = () => {
    setIsLoading(true);
    setHasError(false);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col w-full h-[calc(100vh-48px)] bg-[#090B0E] relative overflow-hidden">
      {/* PowerSim Sub-Header info strip */}
      <div className="bg-[#11141B] border-b border-[#242B38] px-4 py-1.5 flex items-center justify-between gap-3 text-xs shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-[#00FF9C] shadow-[0_0_8px_#00FF9C] shrink-0"></span>
          <span className="font-semibold text-slate-200 shrink-0">PowerSim Classic:</span>
          <span className="text-slate-400 font-mono text-[11px] truncate hidden sm:inline">
            1-Ph Half-Bridge • 1-Ph H-Bridge • 3-Ph 6-Switch VSI • Current Source Inverter (CSI)
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleReload}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#161B24] hover:bg-[#1E2430] border border-[#242B38] text-slate-300 text-[11px] transition-colors cursor-pointer"
            title="Reset Simulation Canvas"
          >
            <RefreshCw className="w-3 h-3 text-[#00FF9C]" />
            <span className="hidden md:inline">Reset</span>
          </button>
          <a
            href={powerSimUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#161B24] hover:bg-[#1E2430] border border-[#242B38] text-slate-300 text-[11px] transition-colors"
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

      {/* Error Fallback */}
      {hasError && (
        <div className="absolute inset-0 top-8 flex flex-col items-center justify-center bg-[#090B0E] z-20 gap-3 px-4 text-center">
          <AlertCircle className="w-8 h-8 text-amber-400" />
          <p className="text-sm text-slate-200">Unable to load PowerSim visualizer canvas</p>
          <p className="text-xs text-slate-400 font-mono">Attempted: {powerSimUrl}</p>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleReload}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white border border-slate-700"
            >
              Try Again
            </button>
            <a
              href={powerSimUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-xs font-medium text-white"
            >
              Open Directly
            </a>
          </div>
        </div>
      )}

      {/* Embedded Simulation Canvas Frame with dynamically resolved URL */}
      <iframe
        key={iframeKey}
        src={powerSimUrl}
        title="PowerSim Interactive Inverter Visualizer"
        className="w-full flex-1 border-0 h-full bg-[#090B0E]"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
}
