import React, { useState, useEffect } from 'react';
import { scadaWs } from './services/websocket';
import { fetchSensorHistory } from './services/api';

import Header from './components/Header';
import MachineStatusCards from './components/MachineStatusCards';
import SensorGauges from './components/SensorGauges';
import DigitalTwinView from './components/DigitalTwinView';
import ControlPanel from './components/ControlPanel';
import TrendCharts from './components/TrendCharts';
import AlarmPanel from './components/AlarmPanel';
import ProductionKPI from './components/ProductionKPI';
import OEESection from './components/OEESection';
import ModbusRegisterViewer from './components/ModbusRegisterViewer';

import { WifiOff, AlertTriangle } from 'lucide-react';

export default function App() {
  const [telemetry, setTelemetry] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('CONNECTING');
  const [history, setHistory] = useState([]);

  // Load initial history from SQLite once on startup
  useEffect(() => {
    fetchSensorHistory(60)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setHistory(data);
        }
      })
      .catch((err) => console.log('Init history fetch notice:', err));
  }, []);

  // WebSocket lifecycle
  useEffect(() => {
    const unsubStatus = scadaWs.onStatusChange((status) => {
      setConnectionStatus(status);
    });

    const unsubMsg = scadaWs.onMessage((data) => {
      setTelemetry(data);

      // Append to rolling 60-second history buffer
      if (data && data.sensors) {
        setHistory((prev) => {
          const newEntry = {
            timestamp: data.timestamp,
            temperature: data.sensors.temperature,
            pressure: data.sensors.pressure,
            motor_rpm: data.sensors.motor_rpm,
          };
          const next = [...prev, newEntry];
          if (next.length > 60) next.shift();
          return next;
        });
      }
    });

    scadaWs.connect();

    return () => {
      unsubStatus();
      unsubMsg();
      scadaWs.disconnect();
    };
  }, []);

  const activeAlarmCount = telemetry?.alarms
    ? Object.values(telemetry.alarms).filter(Boolean).length
    : 0;

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans">
      {/* 1. Header */}
      <Header
        status={telemetry?.machine}
        connectionStatus={connectionStatus}
        activeAlarmCount={activeAlarmCount}
      />

      {/* Disconnection Warning Alert Banner */}
      {connectionStatus === 'DISCONNECTED' && (
        <div className="bg-red-950/90 border-b border-red-500/80 px-4 py-2.5 text-center text-red-200 text-xs font-mono flex items-center justify-center gap-2 animate-pulse sticky top-[61px] z-30 shadow-lg">
          <WifiOff className="w-4 h-4 text-red-400" />
          <span className="font-bold">SCADA SERVER DISCONNECTED</span>
          <span className="text-red-300/80 hidden sm:inline">
            — Attempting auto-reconnection to FastAPI WebSocket (ws://localhost:8000/ws)...
          </span>
        </div>
      )}

      {/* Main SCADA Console Body */}
      <main className="flex-1 p-3 sm:p-5 space-y-4 max-w-[1600px] w-full mx-auto">
        {/* Section 1: Actuator Status Cards */}
        <MachineStatusCards
          actuators={telemetry?.actuators}
          machine={telemetry?.machine}
          sensors={telemetry?.sensors}
        />

        {/* Section 2: Sensor Gauges & Dials */}
        <SensorGauges
          sensors={telemetry?.sensors}
          production={telemetry?.production}
        />

        {/* Section 3: Digital Twin & Control Station (2-Column Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Digital Twin SVG Animated Visualizer (7 cols) */}
          <div className="lg:col-span-7">
            <DigitalTwinView
              actuators={telemetry?.actuators}
              sensors={telemetry?.sensors}
              machine={telemetry?.machine}
            />
          </div>

          {/* HMI Control Panel (5 cols) */}
          <div className="lg:col-span-5">
            <ControlPanel
              machine={telemetry?.machine}
              actuators={telemetry?.actuators}
              sensors={telemetry?.sensors}
            />
          </div>
        </div>

        {/* Section 4: Live Rolling Trend Charts */}
        <TrendCharts history={history} />

        {/* Section 5: Production KPI & Industrial OEE (2 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ProductionKPI
            production={telemetry?.production}
            activeAlarmCount={activeAlarmCount}
          />
          <OEESection production={telemetry?.production} />
        </div>

        {/* Section 6: Alarm Management Panel */}
        <AlarmPanel
          activeAlarms={telemetry?.alarms}
        />

        {/* Section 7: Modbus TCP Register Memory Map Inspector */}
        <ModbusRegisterViewer modbusData={telemetry?.modbus} />
      </main>

      {/* Industrial Footer */}
      <footer className="border-t border-slate-800/80 py-3 px-4 bg-[#070a10] text-[11px] font-mono text-slate-500 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>PLC-SCADA Digital Twin Industrial System • IEC 61131-3 Simulation</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Backend: FastAPI + Python 3.13</span>
          <span>Database: SQLite WAL</span>
          <span>Frontend: React 18 + Vite + Tailwind CSS</span>
        </div>
      </footer>
    </div>
  );
}
