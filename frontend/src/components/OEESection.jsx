import React, { useState } from 'react';
import { Award, Info, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

export default function OEESection({ production }) {
  const [showFormula, setShowFormula] = useState(false);

  const availability = production?.availability ?? 100.0;
  const performance = production?.performance ?? 100.0;
  const quality = production?.quality ?? 100.0;
  const oee = production?.oee ?? 100.0;

  // Industrial benchmark rating
  let oeeBadge = { text: 'WORLD CLASS', color: 'text-emerald-400 bg-emerald-950/80 border-emerald-500' };
  if (oee < 60) {
    oeeBadge = { text: 'NEEDS ATTENTION', color: 'text-red-400 bg-red-950/80 border-red-500' };
  } else if (oee < 75) {
    oeeBadge = { text: 'FAIR', color: 'text-amber-400 bg-amber-950/80 border-amber-500' };
  } else if (oee < 85) {
    oeeBadge = { text: 'GOOD', color: 'text-cyan-400 bg-cyan-950/80 border-cyan-500' };
  }

  return (
    <div className="scada-panel p-4 rounded-lg border border-slate-800">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-200">
            Overall Equipment Effectiveness (OEE)
          </h2>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono border font-bold ${oeeBadge.color}`}>
            {oeeBadge.text}
          </span>
        </div>

        <button
          onClick={() => setShowFormula(!showFormula)}
          className="text-xs font-mono text-slate-400 hover:text-cyan-300 flex items-center gap-1"
        >
          <Info className="w-3.5 h-3.5" />
          <span>Formula</span>
          {showFormula ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Formula Explanation Accordion */}
      {showFormula && (
        <div className="mb-4 p-3 rounded bg-[#090d16] border border-cyan-500/30 text-xs font-mono text-slate-300 space-y-1.5 animate-fadeIn">
          <div className="text-cyan-300 font-bold">Standard Industrial OEE Equation:</div>
          <div><code className="text-emerald-400">OEE = Availability × Performance × Quality</code></div>
          <div className="text-slate-400 text-[11px] pt-1">
            • <b className="text-slate-200">Availability:</b> Operating Time / Planned Production Time (Captures unplanned downtime & E-Stops)<br />
            • <b className="text-slate-200">Performance:</b> (Total Parts × Ideal Cycle Time [3.5s]) / Operating Time (Captures speed losses)<br />
            • <b className="text-slate-200">Quality:</b> Good Parts / Total Parts (Captures defect and scrap rates)
          </div>
        </div>
      )}

      {/* 4 OEE Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {/* Availability */}
        <div className="scada-card p-3.5 border-slate-800">
          <div className="flex justify-between items-center mb-1 text-xs font-mono text-slate-400">
            <span>AVAILABILITY</span>
            <span className="text-emerald-400 font-bold">{availability.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden my-2">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${availability}%` }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-500">
            Operating vs Total Time
          </div>
        </div>

        {/* Performance */}
        <div className="scada-card p-3.5 border-slate-800">
          <div className="flex justify-between items-center mb-1 text-xs font-mono text-slate-400">
            <span>PERFORMANCE</span>
            <span className="text-cyan-400 font-bold">{performance.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden my-2">
            <div
              className="bg-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${performance}%` }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-500">
            Actual vs Target Speed
          </div>
        </div>

        {/* Quality */}
        <div className="scada-card p-3.5 border-slate-800">
          <div className="flex justify-between items-center mb-1 text-xs font-mono text-slate-400">
            <span>QUALITY</span>
            <span className="text-purple-400 font-bold">{quality.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden my-2">
            <div
              className="bg-purple-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${quality}%` }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-500">
            Good Parts / Total Parts
          </div>
        </div>

        {/* Overall OEE Composite Score */}
        <div className="scada-card p-3.5 border-cyan-500/40 bg-cyan-950/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          <div className="flex justify-between items-center mb-1 text-xs font-mono text-cyan-300">
            <span className="font-extrabold">OVERALL OEE</span>
            <span className="text-xl font-bold font-mono text-cyan-400">{oee.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden my-1.5">
            <div
              className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, oee)}%` }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-400 flex justify-between">
            <span>Target: &gt;85%</span>
            <span className="text-cyan-400 font-bold">{oee >= 85 ? 'OPTIMAL' : 'MONITOR'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
