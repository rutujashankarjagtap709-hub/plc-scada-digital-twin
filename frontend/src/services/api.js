/**
 * REST API client for SCADA backend
 */

const API_BASE = 'http://localhost:8000/api';

export async function sendStartCommand() {
  const res = await fetch(`${API_BASE}/control/start`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to start machine');
  }
  return res.json();
}

export async function sendStopCommand() {
  const res = await fetch(`${API_BASE}/control/stop`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to stop machine');
  }
  return res.json();
}

export async function sendEmergencyStop(activate = true) {
  const res = await fetch(`${API_BASE}/control/emergency-stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activate })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Emergency stop command failed');
  }
  return res.json();
}

export async function sendResetAlarm() {
  const res = await fetch(`${API_BASE}/control/reset-alarm`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Alarm reset rejected');
  }
  return res.json();
}

export async function setMotorSpeed(speed_rpm) {
  const res = await fetch(`${API_BASE}/control/set-speed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ speed_rpm: Number(speed_rpm) })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to set motor speed');
  }
  return res.json();
}

export async function injectFault(fault_type, value = null) {
  const res = await fetch(`${API_BASE}/simulation/fault`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fault_type, value })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Fault injection failed');
  }
  return res.json();
}

export async function clearFaults() {
  const res = await fetch(`${API_BASE}/simulation/clear-faults`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to clear faults');
  }
  return res.json();
}

export async function fetchSensorHistory(limit = 60) {
  const res = await fetch(`${API_BASE}/history?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch sensor history');
  return res.json();
}

export async function fetchModbusRegisters() {
  const res = await fetch(`${API_BASE}/modbus/registers`);
  if (!res.ok) throw new Error('Failed to fetch Modbus registers');
  return res.json();
}

export async function fetchAlarms(active_only = false) {
  const res = await fetch(`${API_BASE}/alarms?active_only=${active_only}`);
  if (!res.ok) throw new Error('Failed to fetch alarms');
  return res.json();
}
