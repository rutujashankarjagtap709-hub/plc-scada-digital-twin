import React from 'react';
import { Package, Clock, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';

function formatDuration(totalSeconds = 0) {
  const s = Math.floor(totalSeconds);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function ProductionKPI({ production, activeAlarmCount = 0 }) {
  const total = production?.total_units || 0;
  const good = production?.good_units || 0;
  const scrap = production?.scrap_units || 0;
  const rate = production?.production_rate_ppm || 0;
  const runtime = production?.runtime_seconds || 0;
  const downtime = production?.downtime_seconds || 0;

  return (
    <div className="scada-panel p-4 rounded-lg border border-slate-800">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-200">
            Production Monitoring & Runtime KPI
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-500">SHIFT A TELEMETRY</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Total Produced */}
        <div className="scada-card p-3 border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 mb-1 flex items-center gap-1">
            <Package className="w-3.5 h-3.5 text-purple-400" />
            TOTAL PARTS
          </div>
          <div className="text-2xl font-mono font-bold text-slate-100">{total}</div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">
            Good: <span className="text-emerald-400">{good}</span> • Scrap: <span className="text-red-400">{scrap}</span>
          </div>
        </div>

        {/* Production Rate */}
        <div className="scada-card p-3 border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 mb-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            CYCLE RATE
          </div>
          <div className="text-2xl font-mono font-bold text-cyan-400">{rate}</div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">
            units / minute ({(rate * 60).toFixed(0)} / hr)
          </div>
        </div>

        {/* Operating Runtime */}
        <div className="scada-card p-3 border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 mb-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            OPERATING TIME
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-400">
            {formatDuration(runtime)}
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">
            Conveyor energized
          </div>
        </div>

        {/* Downtime */}
        <div className="scada-card p-3 border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 mb-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            DOWNTIME
          </div>
          <div className="text-2xl font-mono font-bold text-amber-400">
            {formatDuration(downtime)}
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">
            Idle / Fault stoppage
          </div>
        </div>

        {/* Active Alarms */}
        <div className="scada-card p-3 border-slate-800 col-span-2 sm:col-span-1">
          <div className="text-[11px] font-mono text-slate-400 mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            ALARM TRIPS
          </div>
          <div className={`text-2xl font-mono font-bold ${activeAlarmCount > 0 ? 'text-red-400 animate-pulse' : 'text-slate-200'}`}>
            {activeAlarmCount}
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">
            Active safety alerts
          </div>
        </div>
      </div>
    </div>
  );
}
