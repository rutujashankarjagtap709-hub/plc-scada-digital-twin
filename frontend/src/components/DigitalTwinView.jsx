import React from 'react';
import { Wind, Droplets, Zap, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function DigitalTwinView({ actuators, sensors, machine }) {
  const isConveyorRunning = !!actuators?.conveyor_motor;
  const isPumpRunning = !!actuators?.coolant_pump;
  const isFanRunning = !!actuators?.cooling_fan;
  const isAlarmActive = !!actuators?.alarm_beacon;
  const isEstop = !!actuators?.emergency_stop;

  const rpm = sensors?.motor_rpm || 0;
  const temp = sensors?.temperature || 24;
  const pressure = sensors?.pressure || 1;
  const opticalSensor = sensors?.optical_sensor_pulse;
  const partProgress = sensors?.part_progress ?? 0;

  // Calculate 3 part positions across the conveyor based on part progress
  // Part 1: Infeed to Machining (x: 140 to 330)
  // Part 2: Machining to Inspection (x: 330 to 520)
  // Part 3: Inspection to Outfeed (x: 520 to 690)
  const part1X = isConveyorRunning ? 140 + partProgress * 190 : 180;
  const part2X = isConveyorRunning ? 330 + partProgress * 190 : 380;
  const part3X = isConveyorRunning ? 520 + partProgress * 170 : 570;

  return (
    <div className="scada-panel p-4 rounded-lg border border-slate-800">
      {/* Title & Legend */}
      <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 led-glow-cyan" />
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-200">
            Digital Twin • Process Line Visualization
          </h2>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isConveyorRunning ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            Conveyor: {isConveyorRunning ? 'RUN' : 'STOP'}
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isPumpRunning ? 'bg-cyan-400' : 'bg-slate-600'}`} />
            Coolant: {isPumpRunning ? 'FLOW' : 'OFF'}
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isFanRunning ? 'bg-amber-400' : 'bg-slate-600'}`} />
            Fan: {isFanRunning ? 'RUN' : 'OFF'}
          </span>
        </div>
      </div>

      {/* SVG Industrial Process Cell */}
      <div className="relative w-full bg-[#080c14] rounded-lg border border-slate-800/80 p-2 overflow-hidden">
        {/* Alarm Beacon Flash Overlay */}
        {isAlarmActive && (
          <div className="absolute inset-0 bg-red-500/10 pointer-events-none animate-pulse border border-red-500/40 rounded-lg z-20" />
        )}

        <svg
          viewBox="0 0 800 280"
          className="w-full h-auto select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="beltGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            <linearGradient id="machineGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#090d16" />
            </linearGradient>

            <linearGradient id="coolantGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>

            <pattern id="conveyorTrack" width="20" height="10" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="10" stroke="#475569" strokeWidth="1.5" />
            </pattern>
          </defs>

          {/* Background Grid Lines */}
          <line x1="20" y1="240" x2="780" y2="240" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />

          {/* --- STATION 1: INFEED / RAW MATERIAL HOPPER --- */}
          <g id="infeed-station">
            {/* Structural Stand */}
            <rect x="50" y="160" width="60" height="80" fill="#111827" stroke="#334155" strokeWidth="1.5" rx="2" />
            {/* Hopper Funnel */}
            <polygon points="40,70 120,70 95,140 65,140" fill="#1f2937" stroke="#475569" strokeWidth="2" />
            <rect x="65" y="140" width="30" height="20" fill="#374151" stroke="#475569" />
            {/* Raw material text */}
            <text x="80" y="60" fill="#94a3b8" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
              [RAW INFEED]
            </text>
            <circle cx="80" cy="100" r="10" fill="#f59e0b" opacity="0.8" />
            <circle cx="70" cy="115" r="8" fill="#f59e0b" opacity="0.6" />
            <circle cx="90" cy="115" r="8" fill="#f59e0b" opacity="0.6" />
          </g>

          {/* --- MAIN CONVEYOR BED --- */}
          <g id="conveyor-system">
            {/* Bed Frame */}
            <rect x="110" y="170" width="580" height="14" fill="url(#beltGrad)" stroke="#475569" strokeWidth="1.5" rx="3" />
            
            {/* Animated conveyor belt markings */}
            <rect 
              x="112" y="171" width="576" height="12" 
              fill="url(#conveyorTrack)" 
              className={isConveyorRunning ? 'animate-[spin_4s_linear_infinite]' : ''} 
            />

            {/* Rollers / Pulleys */}
            <circle cx="120" cy="177" r="9" fill="#0f172a" stroke="#64748b" strokeWidth="2" />
            <circle cx="120" cy="177" r="3" fill="#38bdf8" />
            <circle cx="680" cy="177" r="9" fill="#0f172a" stroke="#64748b" strokeWidth="2" />
            <circle cx="680" cy="177" r="3" fill="#38bdf8" />

            {/* Center Rollers */}
            {[230, 340, 450, 560].map((rx) => (
              <g key={rx}>
                <circle cx={rx} cy="177" r="7" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                <circle cx={rx} cy="177" r="2" fill="#94a3b8" />
              </g>
            ))}

            {/* Conveyor Support Legs */}
            <rect x="180" y="184" width="8" height="56" fill="#1f2937" stroke="#334155" />
            <rect x="340" y="184" width="8" height="56" fill="#1f2937" stroke="#334155" />
            <rect x="500" y="184" width="8" height="56" fill="#1f2937" stroke="#334155" />
            <rect x="660" y="184" width="8" height="56" fill="#1f2937" stroke="#334155" />

            {/* Conveyor Motor & Gearbox housing */}
            <rect x="125" y="195" width="40" height="35" fill="#111827" stroke="#0284c7" strokeWidth="1.5" rx="3" />
            <text x="145" y="217" fill="#38bdf8" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
              MOTOR
            </text>
            <circle cx="145" cy="215" r="14" fill="none" stroke="#0284c7" strokeWidth="1" strokeDasharray="3 3"
              className={isConveyorRunning ? 'animate-[spin_2s_linear_infinite]' : ''} 
            />
          </g>

          {/* --- STATION 2: PROCESSING / MACHINING CHAMBER --- */}
          <g id="processing-station">
            {/* Chamber Enclosure */}
            <rect x="290" y="80" width="120" height="90" fill="url(#machineGrad)" stroke="#38bdf8" strokeWidth="1.5" rx="4" />
            
            {/* Chamber Window */}
            <rect x="305" y="95" width="90" height="40" fill="#0c1322" stroke="#1e293b" rx="2" />
            
            {/* Toolhead */}
            <rect x="342" y="90" width="16" height="24" fill="#64748b" stroke="#94a3b8" />
            <polygon points="345,114 355,114 350,126" fill="#f59e0b" />

            {/* Coolant Spray Mist (when pump active) */}
            {isPumpRunning && (
              <polygon points="340,126 360,126 375,160 325,160" fill="url(#coolantGrad)" className="animate-pulse" />
            )}

            {/* Station Label */}
            <text x="350" y="70" fill="#38bdf8" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
              [PROCESSING HEAD]
            </text>

            {/* Hydraulic Pressure Sensor Callout */}
            <g transform="translate(380, 50)">
              <rect x="0" y="0" width="65" height="18" fill="#0f172a" stroke="#06b6d4" rx="2" />
              <text x="32" y="13" fill="#06b6d4" fontSize="10" fontFamily="monospace" textAnchor="middle">
                {pressure.toFixed(1)} bar
              </text>
            </g>
          </g>

          {/* --- STATION 3: THERMAL COOLING FAN CHAMBER --- */}
          <g id="cooling-station">
            <rect x="440" y="80" width="100" height="90" fill="url(#machineGrad)" stroke="#f59e0b" strokeWidth="1.5" rx="4" />
            
            {/* Fan Housing Grill */}
            <circle cx="490" cy="120" r="26" fill="#0c1322" stroke="#334155" strokeWidth="2" />
            
            {/* Rotating Fan Blades */}
            <g transform="translate(490, 120)">
              <g className={isFanRunning ? 'animate-[spin_0.8s_linear_infinite]' : ''}>
                <ellipse cx="0" cy="-14" rx="5" ry="12" fill={isFanRunning ? '#f59e0b' : '#64748b'} />
                <ellipse cx="0" cy="14" rx="5" ry="12" fill={isFanRunning ? '#f59e0b' : '#64748b'} />
                <ellipse cx="-14" cy="0" rx="12" ry="5" fill={isFanRunning ? '#f59e0b' : '#64748b'} />
                <ellipse cx="14" cy="0" rx="12" ry="5" fill={isFanRunning ? '#f59e0b' : '#64748b'} />
                <circle cx="0" cy="0" r="6" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
              </g>
            </g>

            {/* Station Label */}
            <text x="490" y="70" fill="#f59e0b" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
              [COOLING FAN]
            </text>

            {/* Thermal Sensor Callout */}
            <g transform="translate(515, 50)">
              <rect x="0" y="0" width="60" height="18" fill="#0f172a" 
                stroke={temp >= 70 ? '#ef4444' : temp >= 60 ? '#f59e0b' : '#10b981'} rx="2" />
              <text x="30" y="13" 
                fill={temp >= 70 ? '#ef4444' : temp >= 60 ? '#f59e0b' : '#10b981'} 
                fontSize="10" fontFamily="monospace" textAnchor="middle">
                {temp.toFixed(1)}°C
              </text>
            </g>
          </g>

          {/* --- STATION 4: OPTICAL INSPECTION SENSOR & LASER GATE --- */}
          <g id="optical-gate" transform="translate(620, 110)">
            {/* Photoelectric Sensor Head */}
            <rect x="0" y="0" width="14" height="60" fill="#1e293b" stroke="#a855f7" strokeWidth="1.5" rx="2" />
            <circle cx="7" cy="45" r="4" fill={opticalSensor ? '#22c55e' : '#ef4444'} />
            
            {/* Laser Detection Beam */}
            <line 
              x1="7" y1="45" x2="7" y2="60" 
              stroke={opticalSensor ? '#22c55e' : '#a855f7'} 
              strokeWidth="2" 
              strokeDasharray={opticalSensor ? 'none' : '2 2'}
              className={opticalSensor ? 'led-glow-green' : ''} 
            />

            <text x="7" y="-10" fill="#c084fc" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
              [OPTICAL GATE]
            </text>
          </g>

          {/* --- STATION 5: OUTPUT / FINISHED GOODS BINS --- */}
          <g id="output-station">
            <rect x="700" y="160" width="70" height="80" fill="#111827" stroke="#334155" strokeWidth="1.5" rx="2" />
            <polygon points="695,140 765,140 755,160 705,160" fill="#1f2937" stroke="#475569" />
            <text x="735" y="130" fill="#94a3b8" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
              [OUTPUT]
            </text>
            <rect x="715" y="175" width="22" height="18" fill="#3b82f6" rx="2" />
            <rect x="735" y="195" width="22" height="18" fill="#3b82f6" rx="2" />
          </g>

          {/* --- MOVING WORKPIECES / PRODUCT PARTS --- */}
          {/* Part 1 (Infeed -> Machining) */}
          <g transform={`translate(${part1X}, 145)`}>
            <rect x="0" y="0" width="26" height="22" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" rx="2" />
            <line x1="6" y1="6" x2="20" y2="6" stroke="#075985" strokeWidth="2" />
          </g>

          {/* Part 2 (Machining -> Cooling) */}
          <g transform={`translate(${part2X}, 145)`}>
            <rect x="0" y="0" width="26" height="22" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" rx="2" />
            <circle cx="13" cy="11" r="5" fill="#f59e0b" />
          </g>

          {/* Part 3 (Cooling -> Output / Laser) */}
          <g transform={`translate(${part3X}, 145)`}>
            <rect x="0" y="0" width="26" height="22" fill="#10b981" stroke="#059669" strokeWidth="1.5" rx="2" />
            <path d="M7 11l3 3 7-7" stroke="#ecfdf5" strokeWidth="2" fill="none" />
          </g>

          {/* --- TOP STROBE / ALARM BEACON --- */}
          <g id="alarm-beacon" transform="translate(400, 15)">
            <rect x="-10" y="10" width="20" height="12" fill="#1e293b" stroke="#475569" />
            <circle 
              cx="0" cy="8" r="10" 
              fill={isAlarmActive ? '#ef4444' : isEstop ? '#ef4444' : '#10b981'} 
              className={isAlarmActive ? 'animate-ping' : ''} 
            />
            <circle 
              cx="0" cy="8" r="7" 
              fill={isAlarmActive ? '#f87171' : isEstop ? '#f87171' : '#34d399'} 
            />
          </g>
        </svg>

        {/* Dynamic Status Pill underneath visualization */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">LINE FLOW:</span>
            <span className={isConveyorRunning ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
              {isConveyorRunning ? '>>> FORWARD TRAVELING (CONTINUOUS) >>>' : 'HALTED'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500">MODBUS ADDRESS:</span>
            <span className="text-cyan-400">TCP 127.0.0.1:502 (EMULATED)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
