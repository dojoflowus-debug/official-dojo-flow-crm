interface BehaviorSectionProps {
  state: any;
  setState: (state: any) => void;
}

export default function BehaviorSection({ state, setState }: BehaviorSectionProps) {
  const handleIdleTimeoutChange = (timeout: number) => {
    setState({
      ...state,
      behavior: {
        ...state.behavior,
        idleTimeout: timeout,
      },
    });
  };

  const handleMessageChange = (message: string) => {
    setState({
      ...state,
      behavior: {
        ...state.behavior,
        message,
      },
    });
  };

  const handleScreensaverToggle = (enabled: boolean) => {
    setState({
      ...state,
      behavior: {
        ...state.behavior,
        screensaverEnabled: enabled,
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Idle Timeout */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Idle Timeout: {state.behavior.idleTimeout}s
        </label>
        <input
          type="range"
          min="10"
          max="600"
          value={state.behavior.idleTimeout}
          onChange={(e) => handleIdleTimeoutChange(Number(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
        />
        <p className="text-xs text-slate-400 mt-2">
          Kiosk will return to idle screen after {state.behavior.idleTimeout} seconds of inactivity
        </p>
      </div>

      {/* Custom Message */}
      <div className="pt-2 border-t border-white/10">
        <label className="block text-sm font-medium text-white mb-2">Custom Message</label>
        <textarea
          value={state.behavior.message}
          onChange={(e) => handleMessageChange(e.target.value)}
          maxLength={100}
          className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-red-500/50 resize-none"
          rows={3}
        />
        <p className="text-xs text-slate-400 mt-1">
          {state.behavior.message.length}/100 characters
        </p>
      </div>

      {/* Screensaver */}
      <div className="pt-2 border-t border-white/10">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={state.behavior.screensaverEnabled}
            onChange={(e) => handleScreensaverToggle(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 accent-red-500"
          />
          <span className="text-sm font-medium text-white">Enable Screensaver</span>
        </label>
        <p className="text-xs text-slate-400 mt-2">
          Show screensaver when kiosk is idle
        </p>
      </div>

      {/* Behavior Stats */}
      <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-3">
        <div className="bg-slate-700/30 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Check-ins Today</p>
          <p className="text-2xl font-bold text-white mt-1">1,584</p>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400">Avg Response Time</p>
          <p className="text-2xl font-bold text-white mt-1">2.3s</p>
        </div>
      </div>
    </div>
  );
}
