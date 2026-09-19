import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Cpu, Radio, Clock, AlertTriangle } from 'lucide-react';

export default function Header({ status, connectionStatus, activeAlarmCount }) {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false }));
      setDateStr(now.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const stateName = status?.state_name || 'STOPPED';

  const getStateBadge = () => {
    switch (stateName) {
      case 'RUNNING':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 font-mono font-bold text-sm shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 led-glow-green animate-pulse" />
            SYSTEM RUNNING
          </div>
        );
      case 'EMERGENCY STOP':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-red-950/90 border border-red-500 text-red-400 font-mono font-bold text-sm shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse">
            <ShieldAlert className="w-4 h-4 text-red-400 animate-bounce" />
            EMERGENCY STOP
          </div>
        );
      case 'FAULT / ALARM':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-amber-950/80 border border-amber-500/60 text-amber-400 font-mono font-bold text-sm shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
            ALARM / FAULT ACTIVE
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-slate-900 border border-slate-700 text-slate-400 font-mono font-bold text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            STANDBY / STOPPED
          </div>
        );
    }
  };

  return (
    <header className="scada-panel px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40">
      {/* Title & Brand */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-cyan-950/70 border border-cyan-500/40 rounded-lg shadow-[0_0_12px_rgba(6,182,212,0.25)]">
          <Cpu className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-extrabold tracking-wider text-slate-100 uppercase">
              PLC-SCADA Digital Twin
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono tracking-widest bg-cyan-900/60 text-cyan-300 border border-cyan-600/50">
              V1.0 INDUSTRIAL
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Automated Manufacturing Cell 01 • Modbus TCP Node #1
          </p>
        </div>
      </div>

      {/* Center Status Indicators */}
      <div className="flex items-center gap-3 flex-wrap">
        {getStateBadge()}

        {activeAlarmCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-950/60 border border-red-500/40 text-red-300 font-mono text-xs animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>{activeAlarmCount} Active Alert{activeAlarmCount > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Right Telemetry & Clock */}
      <div className="flex items-center gap-4 text-xs font-mono">
        {/* Connection Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-900/80 border border-slate-700/60">
          <Radio className={`w-3.5 h-3.5 ${
            connectionStatus === 'CONNECTED' ? 'text-emerald-400' : 'text-red-400 animate-pulse'
          }`} />
          <span className="text-slate-400">SCADA:</span>
          {connectionStatus === 'CONNECTED' ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block led-glow-green" />
              ONLINE
            </span>
          ) : (
            <span className="text-red-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block led-glow-red" />
              DISCONNECTED
            </span>
          )}
        </div>

        {/* Clock & Shift */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded bg-slate-900/80 border border-slate-700/60 text-slate-300">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{dateStr}</span>
          <span className="text-cyan-400 font-bold">{timeStr}</span>
          <span className="text-[10px] text-slate-500 pl-1 border-l border-slate-700">SHIFT A</span>
        </div>
      </div>
    </header>
  );
}
