import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle, RefreshCw, Bell } from 'lucide-react';
import { fetchAlarms } from '../services/api';

export default function AlarmPanel({ activeAlarms = {}, onAlarmResetRequested }) {
  const [alarmsList, setAlarmsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterActive, setFilterActive] = useState(false);

  const loadAlarms = async () => {
    try {
      setLoading(true);
      const data = await fetchAlarms(filterActive);
      setAlarmsList(data);
    } catch (err) {
      console.warn('Failed to load alarms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlarms();
    const interval = setInterval(loadAlarms, 3000);
    return () => clearInterval(interval);
  }, [filterActive]);

  // Determine currently active alarms from real-time state
  const activeKeys = Object.entries(activeAlarms)
    .filter(([_, isActive]) => isActive)
    .map(([key]) => key);

  return (
    <div className="scada-panel p-4 rounded-lg border border-slate-800">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-red-400" />
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-200">
            Alarm Management System
          </h2>
          {activeKeys.length > 0 && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-950 text-red-300 border border-red-500 animate-pulse">
              {activeKeys.length} CRITICAL
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterActive(!filterActive)}
            className={`px-2 py-0.5 rounded text-xs font-mono border transition-all ${
              filterActive
                ? 'bg-red-950 text-red-300 border-red-500'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            {filterActive ? 'Active Only' : 'All Records'}
          </button>
          <button
            onClick={loadAlarms}
            disabled={loading}
            className="p-1 rounded bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
            title="Refresh Alarm Log"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Active Alarms Banner Callout */}
      {activeKeys.length > 0 ? (
        <div className="mb-3 space-y-2">
          {activeAlarms.emergency_stop && (
            <div className="p-3 rounded bg-red-950/80 border border-red-500/80 flex items-center justify-between text-xs font-mono shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span className="text-red-200 font-bold">EMERGENCY STOP TRIPPED</span>
                <span className="text-red-400/80 hidden sm:inline">- All motors and actuators forced OFF</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-red-900 text-red-100 rounded font-bold">
                PRIORITY 1
              </span>
            </div>
          )}

          {activeAlarms.high_pressure && (
            <div className="p-3 rounded bg-red-950/80 border border-red-500/80 flex items-center justify-between text-xs font-mono shadow-[0_0_15px_rgba(239,68,68,0.3)]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-red-200 font-bold">HIGH PRESSURE ALARM</span>
                <span className="text-red-400/80 hidden sm:inline">- Exceeded 8.0 bar safe limit</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-red-900 text-red-100 rounded font-bold">
                PRIORITY 1
              </span>
            </div>
          )}

          {activeAlarms.high_temperature && (
            <div className="p-3 rounded bg-amber-950/80 border border-amber-500/80 flex items-center justify-between text-xs font-mono shadow-[0_0_15px_rgba(245,158,11,0.25)]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-amber-200 font-bold">OVER TEMPERATURE WARNING</span>
                <span className="text-amber-400/80 hidden sm:inline">- Exceeded 70°C. Cooling fan engaged.</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-amber-900 text-amber-100 rounded font-bold">
                PRIORITY 2
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-3 p-2.5 rounded bg-emerald-950/30 border border-emerald-800/40 text-emerald-400 text-xs font-mono flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>All systems within safe operating thresholds. No active safety interlocks.</span>
        </div>
      )}

      {/* Historical Alarms Table */}
      <div className="overflow-x-auto max-h-52 overflow-y-auto">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500 bg-slate-900/60 sticky top-0">
              <th className="py-2 px-2.5">Time</th>
              <th className="py-2 px-2.5">Alarm Type</th>
              <th className="py-2 px-2.5">Severity</th>
              <th className="py-2 px-2.5">Diagnostics</th>
              <th className="py-2 px-2.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {alarmsList.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-4 text-center text-slate-600">
                  No historical alarm records logged in database.
                </td>
              </tr>
            ) : (
              alarmsList.map((alarm) => {
                const isResolved = alarm.status === 'RESOLVED';
                const isCrit = alarm.severity === 'CRITICAL';
                return (
                  <tr key={alarm.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-2.5 text-slate-400 whitespace-nowrap">
                      {alarm.timestamp ? new Date(alarm.timestamp).toLocaleTimeString() : 'N/A'}
                    </td>
                    <td className="py-2 px-2.5 font-bold whitespace-nowrap">
                      {alarm.alarm_type}
                    </td>
                    <td className="py-2 px-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        isCrit ? 'bg-red-950 text-red-300 border border-red-700' : 'bg-amber-950 text-amber-300 border border-amber-700'
                      }`}>
                        {alarm.severity}
                      </span>
                    </td>
                    <td className="py-2 px-2.5 text-slate-400 text-[11px] max-w-xs truncate" title={alarm.message}>
                      {alarm.message}
                    </td>
                    <td className="py-2 px-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                        isResolved ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-300 animate-pulse'
                      }`}>
                        {alarm.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
