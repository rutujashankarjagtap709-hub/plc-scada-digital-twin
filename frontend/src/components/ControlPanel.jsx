import React, { useState } from 'react';
import { Play, Square, AlertOctagon, RotateCcw, Sliders, Flame, Gauge, Check } from 'lucide-react';
import { 
  sendStartCommand, 
  sendStopCommand, 
  sendEmergencyStop, 
  sendResetAlarm, 
  setMotorSpeed, 
  injectFault, 
  clearFaults 
} from '../services/api';

export default function ControlPanel({ machine, actuators, sensors }) {
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [isError, setIsError] = useState(false);
  const [speedVal, setSpeedVal] = useState(1200);

  const isEstopActive = !!actuators?.emergency_stop;
  const isRunning = !!actuators?.conveyor_motor;

  const showFeedback = (msg, error = false) => {
    setActionMessage(msg);
    setIsError(error);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await sendStartCommand();
      showFeedback(res.message);
    } catch (err) {
      showFeedback(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      const res = await sendStopCommand();
      showFeedback(res.message);
    } catch (err) {
      showFeedback(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleEstop = async () => {
    setLoading(true);
    try {
      // Toggle E-Stop: If already tripped, release button contact; if normal, trip E-Stop
      const activate = !isEstopActive;
      const res = await sendEmergencyStop(activate);
      showFeedback(res.message, activate);
    } catch (err) {
      showFeedback(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleResetAlarm = async () => {
    setLoading(true);
    try {
      const res = await sendResetAlarm();
      showFeedback(res.message);
    } catch (err) {
      showFeedback(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeedChange = async (newSpeed) => {
    setSpeedVal(newSpeed);
    try {
      await setMotorSpeed(newSpeed);
      showFeedback(`Target speed updated to ${newSpeed} RPM`);
    } catch (err) {
      showFeedback(err.message, true);
    }
  };

  const handleInjectFault = async (type) => {
    try {
      const res = await injectFault(type);
      showFeedback(res.message, true);
    } catch (err) {
      showFeedback(err.message, true);
    }
  };

  const handleClearFaults = async () => {
    try {
      const res = await clearFaults();
      showFeedback(res.message);
    } catch (err) {
      showFeedback(err.message, true);
    }
  };

  return (
    <div className="scada-panel p-4 rounded-lg border border-slate-800">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-200">
            HMI Operator Control Station
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-500">
          DI 10001 - 10003
        </span>
      </div>

      {/* Main Industrial Push Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* START PUSH BUTTON */}
        <button
          onClick={handleStart}
          disabled={loading || isRunning || isEstopActive}
          className={`btn-industrial flex flex-col items-center justify-center p-3.5 rounded-lg font-mono font-bold transition-all ${
            isRunning
              ? 'bg-emerald-950/40 border border-emerald-800/50 text-emerald-600 cursor-not-allowed opacity-60'
              : isEstopActive
              ? 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 border border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
          }`}
        >
          <Play className="w-6 h-6 mb-1 fill-current" />
          <span className="text-sm">START</span>
          <span className="text-[10px] font-normal opacity-80">RUN CONVEYOR</span>
        </button>

        {/* STOP PUSH BUTTON */}
        <button
          onClick={handleStop}
          disabled={loading || !isRunning}
          className={`btn-industrial flex flex-col items-center justify-center p-3.5 rounded-lg font-mono font-bold transition-all ${
            !isRunning
              ? 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed opacity-60'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 shadow-md'
          }`}
        >
          <Square className="w-6 h-6 mb-1 fill-current" />
          <span className="text-sm">STOP</span>
          <span className="text-[10px] font-normal opacity-80">DECEL LINE</span>
        </button>

        {/* EMERGENCY STOP MUSHROOM BUTTON */}
        <button
          onClick={handleEstop}
          disabled={loading}
          className={`btn-industrial flex flex-col items-center justify-center p-3.5 rounded-lg font-mono font-bold transition-all border-2 ${
            isEstopActive
              ? 'bg-red-700 text-white border-yellow-400 shadow-[0_0_25px_rgba(239,68,68,0.7)] animate-pulse'
              : 'bg-red-600 hover:bg-red-500 text-white border-red-800 shadow-[0_0_15px_rgba(220,38,38,0.4)]'
          }`}
        >
          <AlertOctagon className="w-6 h-6 mb-1" />
          <span className="text-sm">{isEstopActive ? 'RELEASE E-STOP' : 'E-STOP'}</span>
          <span className="text-[10px] font-normal opacity-90">
            {isEstopActive ? 'TWIST TO ARMED' : 'MUSHROOM TRIP'}
          </span>
        </button>

        {/* RESET ALARM BUTTON */}
        <button
          onClick={handleResetAlarm}
          disabled={loading}
          className="btn-industrial flex flex-col items-center justify-center p-3.5 rounded-lg font-mono font-bold bg-amber-600 hover:bg-amber-500 text-slate-950 border border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all"
        >
          <RotateCcw className="w-6 h-6 mb-1" />
          <span className="text-sm">RESET ALARM</span>
          <span className="text-[10px] font-normal opacity-80">UNLATCH FAULTS</span>
        </button>
      </div>

      {/* Speed Setpoint & Fault Injection Panel */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Speed Adjustment */}
        <div>
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
            <span>MOTOR SPEED SETPOINT (HR 40004)</span>
            <span className="text-emerald-400 font-bold">{speedVal} RPM</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="600"
              max="1500"
              step="50"
              value={speedVal}
              onChange={(e) => handleSpeedChange(e.target.value)}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>
          <div className="flex gap-2 mt-2">
            {[900, 1200, 1400].map(val => (
              <button
                key={val}
                onClick={() => handleSpeedChange(val)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-all ${
                  speedVal === val 
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500' 
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {val} RPM
              </button>
            ))}
          </div>
        </div>

        {/* Fault Injection Simulation Controls for Demo */}
        <div>
          <div className="text-xs font-mono text-slate-400 mb-1.5 flex items-center justify-between">
            <span className="text-amber-400/90 font-semibold">TEST / FAULT INJECTION (DEMO)</span>
            <span className="text-[10px] text-slate-500">SIM PHYSICS OVERRIDE</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleInjectFault('temperature')}
              className="px-2.5 py-1 rounded text-xs font-mono bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-700/60 flex items-center gap-1.5"
            >
              <Flame className="w-3.5 h-3.5 text-red-400" />
              Spike Temp (&gt;75°C)
            </button>

            <button
              onClick={() => handleInjectFault('pressure')}
              className="px-2.5 py-1 rounded text-xs font-mono bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-700/60 flex items-center gap-1.5"
            >
              <Gauge className="w-3.5 h-3.5 text-red-400" />
              Spike Pressure (&gt;8.8 bar)
            </button>

            <button
              onClick={handleClearFaults}
              className="px-2.5 py-1 rounded text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              Clear Faults
            </button>
          </div>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionMessage && (
        <div className={`mt-3 p-2.5 rounded font-mono text-xs flex items-center gap-2 animate-fadeIn ${
          isError 
            ? 'bg-red-950/90 border border-red-500 text-red-200' 
            : 'bg-emerald-950/90 border border-emerald-500 text-emerald-200'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isError ? 'bg-red-400 led-glow-red' : 'bg-emerald-400 led-glow-green'}`} />
          <span>{actionMessage}</span>
        </div>
      )}
    </div>
  );
}
