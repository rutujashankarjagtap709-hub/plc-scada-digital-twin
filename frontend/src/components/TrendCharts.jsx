import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import { TrendingUp, Layers } from 'lucide-react';

export default function TrendCharts({ history = [] }) {
  const [selectedMetric, setSelectedMetric] = useState('all');

  // Format data points for charts
  const chartData = history.map((item, idx) => {
    let timeLabel = `${idx}s`;
    if (item.timestamp) {
      try {
        const d = new Date(item.timestamp);
        timeLabel = d.toLocaleTimeString('en-US', { hour12: false, minute: '2-digit', second: '2-digit' });
      } catch (e) {}
    }
    return {
      index: idx,
      time: timeLabel,
      temperature: Number(item.temperature || 0),
      pressure: Number(item.pressure || 0),
      rpm: Number(item.motor_rpm || 0),
    };
  });

  return (
    <div className="scada-panel p-4 rounded-lg border border-slate-800">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-200">
            Real-Time Process Trend Charts (60s Rolling Window)
          </h2>
        </div>

        {/* View Switcher */}
        <div className="flex gap-1.5 text-xs font-mono">
          {['all', 'temperature', 'pressure', 'rpm'].map((metric) => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={`px-2 py-0.5 rounded capitalize border transition-all ${
                selectedMetric === metric
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500 font-bold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              {metric}
            </button>
          ))}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-slate-500 font-mono text-xs">
          Awaiting telemetry data stream...
        </div>
      ) : (
        <div className="space-y-4">
          {/* Temperature Trend */}
          {(selectedMetric === 'all' || selectedMetric === 'temperature') && (
            <div className="bg-[#090d16] p-3 rounded border border-slate-800/70">
              <div className="flex justify-between items-center mb-1 text-xs font-mono">
                <span className="text-amber-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  Temperature (°C)
                </span>
                <span className="text-[11px] text-red-400/80">Threshold: 70.0°C</span>
              </div>
              <div className="h-28 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} />
                    <YAxis domain={[20, 85]} stroke="#475569" fontSize={9} unit="°C" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px', fontFamily: 'monospace' }} 
                    />
                    <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Alarm 70°C', fill: '#ef4444', fontSize: 9 }} />
                    <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="2 2" label={{ value: 'Fan 60°C', fill: '#f59e0b', fontSize: 9 }} />
                    <Line 
                      type="monotone" 
                      dataKey="temperature" 
                      stroke="#f59e0b" 
                      strokeWidth={2} 
                      dot={false} 
                      isAnimationActive={false} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Pressure Trend */}
          {(selectedMetric === 'all' || selectedMetric === 'pressure') && (
            <div className="bg-[#090d16] p-3 rounded border border-slate-800/70">
              <div className="flex justify-between items-center mb-1 text-xs font-mono">
                <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
                  Hydraulic Pressure (bar)
                </span>
                <span className="text-[11px] text-red-400/80">Threshold: 8.0 bar</span>
              </div>
              <div className="h-28 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} />
                    <YAxis domain={[0, 10]} stroke="#475569" fontSize={9} unit="b" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px', fontFamily: 'monospace' }} 
                    />
                    <ReferenceLine y={8.0} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'High Alarm 8.0 bar', fill: '#ef4444', fontSize: 9 }} />
                    <Line 
                      type="monotone" 
                      dataKey="pressure" 
                      stroke="#06b6d4" 
                      strokeWidth={2} 
                      dot={false} 
                      isAnimationActive={false} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Motor RPM Trend */}
          {(selectedMetric === 'all' || selectedMetric === 'rpm') && (
            <div className="bg-[#090d16] p-3 rounded border border-slate-800/70">
              <div className="flex justify-between items-center mb-1 text-xs font-mono">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  Motor Speed (RPM)
                </span>
                <span className="text-[11px] text-slate-500">Nominal: 1200 RPM</span>
              </div>
              <div className="h-28 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} />
                    <YAxis domain={[0, 1500]} stroke="#475569" fontSize={9} unit="rpm" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px', fontFamily: 'monospace' }} 
                    />
                    <ReferenceLine y={1200} stroke="#10b981" strokeDasharray="3 3" />
                    <Line 
                      type="monotone" 
                      dataKey="rpm" 
                      stroke="#10b981" 
                      strokeWidth={2} 
                      dot={false} 
                      isAnimationActive={false} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
