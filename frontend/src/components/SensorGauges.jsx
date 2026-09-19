import React from 'react';
import { Thermometer, Gauge, Zap, Package, AlertCircle } from 'lucide-react';

export default function SensorGauges({ sensors, production }) {
  const temp = sensors?.temperature ?? 24.0;
  const pressure = sensors?.pressure ?? 1.0;
  const rpm = sensors?.motor_rpm ?? 0;
  const parts = production?.total_units ?? sensors?.part_counter ?? 0;
  const ppm = production?.production_rate_ppm ?? 0;

  // Temperature color logic (Thresholds: 60°C warning, 70°C alarm trip)
  const isTempCritical = temp >= 70.0;
  const isTempWarning = temp >= 60.0 && temp < 70.0;
  const tempPercent = Math.min(100, Math.max(0, ((temp - 20) / (80 - 20)) * 100));

  // Pressure color logic (Threshold: 8.0 bar alarm trip)
  const isPressureCritical = pressure >= 8.0;
  const isPressureHigh = pressure >= 7.0 && pressure < 8.0;
  const pressurePercent = Math.min(100, Math.max(0, ((pressure - 1) / (10 - 1)) * 100));

  // RPM percentage (0 - 1500 RPM)
  const rpmPercent = Math.min(100, Math.max(0, (rpm / 1500) * 100));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Temperature Gauge Card */}
      <div className={`scada-card p-4 transition-all relative overflow-hidden ${
        isTempCritical 
          ? 'border-red-500/80 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
          : isTempWarning 
          ? 'border-amber-500/60 bg-amber-950/10' 
          : 'border-slate-800'
      }`}>
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
          <span className="flex items-center gap-1.5 font-semibold text-slate-300">
            <Thermometer className={`w-4 h-4 ${
              isTempCritical ? 'text-red-400' : isTempWarning ? 'text-amber-400' : 'text-cyan-400'
            }`} />
            TEMPERATURE
          </span>
          <span className="text-[10px] text-slate-500">IR 30001</span>
        </div>

        <div className="flex items-baseline justify-between my-1">
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-mono font-extrabold tracking-tight ${
              isTempCritical ? 'text-red-400' : isTempWarning ? 'text-amber-300' : 'text-slate-100'
            }`}>
              {temp.toFixed(1)}
            </span>
            <span className="text-sm font-mono text-slate-400">°C</span>
          </div>

          {isTempCritical ? (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-red-900/60 text-red-300 border border-red-600/60 animate-pulse">
              OVER TEMP
            </span>
          ) : isTempWarning ? (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-900/50 text-amber-300 border border-amber-600/50">
              FAN ZONE
            </span>
          ) : (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400">
              NORMAL
            </span>
          )}
        </div>

        {/* Level Bar with Limit Marks */}
        <div className="mt-3">
          <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden relative">
            {/* Warning limit line at ~67% (60°C) and Alarm limit at ~83% (70°C) */}
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                isTempCritical ? 'bg-red-500 led-glow-red' : isTempWarning ? 'bg-amber-400' : 'bg-cyan-500'
              }`}
              style={{ width: `${tempPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
            <span>20°C</span>
            <span className="text-amber-400/80">Fan: 60°</span>
            <span className="text-red-400/80">Trip: 70°</span>
            <span>80°C</span>
          </div>
        </div>
      </div>

      {/* 2. Pressure Gauge Card */}
      <div className={`scada-card p-4 transition-all relative overflow-hidden ${
        isPressureCritical 
          ? 'border-red-500/80 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
          : 'border-slate-800'
      }`}>
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
          <span className="flex items-center gap-1.5 font-semibold text-slate-300">
            <Gauge className={`w-4 h-4 ${isPressureCritical ? 'text-red-400' : 'text-cyan-400'}`} />
            HYDRAULIC PRESSURE
          </span>
          <span className="text-[10px] text-slate-500">IR 30002</span>
        </div>

        <div className="flex items-baseline justify-between my-1">
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-mono font-extrabold tracking-tight ${
              isPressureCritical ? 'text-red-400' : 'text-slate-100'
            }`}>
              {pressure.toFixed(1)}
            </span>
            <span className="text-sm font-mono text-slate-400">bar</span>
          </div>

          {isPressureCritical ? (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-red-900/60 text-red-300 border border-red-600/60 animate-pulse">
              HIGH ALARM
            </span>
          ) : (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              SAFE
            </span>
          )}
        </div>

        {/* Level Bar */}
        <div className="mt-3">
          <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                isPressureCritical ? 'bg-red-500 led-glow-red' : 'bg-cyan-500'
              }`}
              style={{ width: `${pressurePercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
            <span>1.0 bar</span>
            <span className="text-emerald-400">Target: ~5.4</span>
            <span className="text-red-400/80">Max: 8.0</span>
            <span>10.0 bar</span>
          </div>
        </div>
      </div>

      {/* 3. Motor Tachometer */}
      <div className="scada-card p-4 border-slate-800 transition-all">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
          <span className="flex items-center gap-1.5 font-semibold text-slate-300">
            <Zap className="w-4 h-4 text-emerald-400" />
            MOTOR SPEED
          </span>
          <span className="text-[10px] text-slate-500">IR 30003</span>
        </div>

        <div className="flex items-baseline justify-between my-1">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-mono font-extrabold tracking-tight text-emerald-400">
              {rpm.toFixed(0)}
            </span>
            <span className="text-sm font-mono text-slate-400">RPM</span>
          </div>

          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800">
            {rpm > 100 ? 'ROTATING' : 'IDLE'}
          </span>
        </div>

        {/* Level Bar */}
        <div className="mt-3">
          <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-emerald-400 rounded-full transition-all duration-300 led-glow-green"
              style={{ width: `${rpmPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
            <span>0 RPM</span>
            <span className="text-slate-400">Nominal: 1200</span>
            <span>1500 RPM</span>
          </div>
        </div>
      </div>

      {/* 4. Production Unit Counter */}
      <div className="scada-card p-4 border-slate-800 transition-all">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
          <span className="flex items-center gap-1.5 font-semibold text-slate-300">
            <Package className="w-4 h-4 text-purple-400" />
            PARTS PRODUCED
          </span>
          <span className="text-[10px] text-slate-500">IR 30004</span>
        </div>

        <div className="flex items-baseline justify-between my-1">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-mono font-extrabold tracking-tight text-purple-400">
              {parts}
            </span>
            <span className="text-sm font-mono text-slate-400">units</span>
          </div>

          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800">
            {ppm.toFixed(1)} / min
          </span>
        </div>

        {/* Batch Target Progress */}
        <div className="mt-3">
          <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-purple-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (parts % 100))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
            <span>Shift Target: 500</span>
            <span>Batch Progress: {(parts % 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
