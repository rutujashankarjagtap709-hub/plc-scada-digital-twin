import React from 'react';
import { PlayCircle, StopCircle, Wind, Droplets, ShieldAlert, Cpu } from 'lucide-react';

export default function MachineStatusCards({ actuators, machine, sensors }) {
  const conveyor = actuators?.conveyor_motor;
  const pump = actuators?.coolant_pump;
  const fan = actuators?.cooling_fan;
  const estop = actuators?.emergency_stop;
  const rpm = sensors?.motor_rpm || 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Conveyor Motor */}
      <div className={`scada-card p-3.5 transition-all ${
        conveyor ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-slate-800 bg-slate-900/60'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wide">
            Conveyor Motor
          </span>
          <span className={`w-3 h-3 rounded-full ${
            conveyor ? 'bg-emerald-400 led-glow-green' : 'bg-slate-600'
          }`} />
        </div>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-md ${
            conveyor ? 'bg-emerald-900/60 text-emerald-300' : 'bg-slate-800 text-slate-500'
          }`}>
            <PlayCircle className={`w-5 h-5 ${conveyor ? 'animate-spin-slow' : ''}`} />
          </div>
          <div>
            <div className={`font-mono text-sm font-bold ${conveyor ? 'text-emerald-400' : 'text-slate-400'}`}>
              {conveyor ? 'RUNNING' : 'STOPPED'}
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              Coil 00001 • {rpm.toFixed(0)} RPM
            </div>
          </div>
        </div>
      </div>

      {/* 2. Coolant Pump */}
      <div className={`scada-card p-3.5 transition-all ${
        pump ? 'border-cyan-500/50 bg-cyan-950/20' : 'border-slate-800 bg-slate-900/60'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wide">
            Coolant Pump
          </span>
          <span className={`w-3 h-3 rounded-full ${
            pump ? 'bg-cyan-400 led-glow-cyan' : 'bg-slate-600'
          }`} />
        </div>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-md ${
            pump ? 'bg-cyan-900/60 text-cyan-300' : 'bg-slate-800 text-slate-500'
          }`}>
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <div className={`font-mono text-sm font-bold ${pump ? 'text-cyan-400' : 'text-slate-400'}`}>
              {pump ? 'ACTIVE' : 'IDLE'}
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              Coil 00002 • Hydraulic Line
            </div>
          </div>
        </div>
      </div>

      {/* 3. Cooling Fan */}
      <div className={`scada-card p-3.5 transition-all ${
        fan ? 'border-amber-500/60 bg-amber-950/20' : 'border-slate-800 bg-slate-900/60'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wide">
            Cooling Fan
          </span>
          <span className={`w-3 h-3 rounded-full ${
            fan ? 'bg-amber-400 led-glow-amber animate-pulse' : 'bg-slate-600'
          }`} />
        </div>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-md ${
            fan ? 'bg-amber-900/60 text-amber-300' : 'bg-slate-800 text-slate-500'
          }`}>
            <Wind className={`w-5 h-5 ${fan ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <div className={`font-mono text-sm font-bold ${fan ? 'text-amber-400' : 'text-slate-400'}`}>
              {fan ? 'FORCED ON' : 'STANDBY'}
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              Coil 00003 • Auto Hysteresis
            </div>
          </div>
        </div>
      </div>

      {/* 4. Emergency Stop Circuit */}
      <div className={`scada-card p-3.5 transition-all ${
        estop ? 'border-red-500/80 bg-red-950/30' : 'border-slate-800 bg-slate-900/60'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wide">
            E-Stop Circuit
          </span>
          <span className={`w-3 h-3 rounded-full ${
            estop ? 'bg-red-500 led-glow-red animate-ping' : 'bg-emerald-500'
          }`} />
        </div>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-md ${
            estop ? 'bg-red-900/70 text-red-300' : 'bg-slate-800 text-emerald-400'
          }`}>
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className={`font-mono text-sm font-bold ${estop ? 'text-red-400' : 'text-emerald-400'}`}>
              {estop ? 'TRIPPED' : 'ARMED / OK'}
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              Coil 00005 • Hardware Safety
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
