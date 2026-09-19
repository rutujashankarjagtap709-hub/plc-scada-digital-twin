"""
REST API Endpoints for SCADA System
Provides control actions, sensor data, alarm querying, and Modbus introspection.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

from ..plc.logic import plc_controller
from ..plc.modbus import modbus_table
from ..simulation.engine import sim_engine
from ..simulation.faults import fault_injector
from ..database.db import (
    get_latest_sensors,
    get_alarms,
    get_machine_events,
    get_latest_production
)

router = APIRouter(prefix="/api")

# --- Request Models ---
class SpeedSetpointRequest(BaseModel):
    speed_rpm: int = Field(..., ge=0, le=1500, description="Target motor RPM (0-1500)")

class EmergencyStopRequest(BaseModel):
    activate: bool = Field(..., description="True to trip E-Stop, False to release physical mushroom contact")

class FaultInjectionRequest(BaseModel):
    fault_type: str = Field(..., description="'temperature' or 'pressure'")
    value: Optional[float] = Field(None, description="Target fault level (e.g., 76.5 for temp, 8.8 for pressure)")

# --- Status & Telemetry Endpoints ---

@router.get("/status")
def get_system_status() -> Dict[str, Any]:
    """Returns overall machine, PLC, and simulation health."""
    plc_stat = plc_controller.get_status()
    return {
        "system": "PLC-SCADA Digital Twin Industrial System",
        "status": plc_stat["state_name"],
        "state_code": plc_stat["state_code"],
        "actuators": {
            "conveyor": plc_stat["conveyor_run"],
            "pump": plc_stat["pump_run"],
            "fan": plc_stat["fan_run"],
            "alarm_beacon": plc_stat["alarm_beacon"],
            "emergency_stop": plc_stat["estop_active"]
        },
        "safety_latches": plc_stat["active_alarms"]
    }

@router.get("/sensors")
def get_sensors() -> Dict[str, Any]:
    """Returns current real-time sensor measurements."""
    snapshot = sim_engine.get_telemetry_snapshot()
    return {
        "timestamp": snapshot["timestamp"],
        "sensors": snapshot["sensors"]
    }

@router.get("/alarms")
def get_alarms_list(active_only: bool = Query(False, description="Filter for active alarms only")) -> List[Dict[str, Any]]:
    """Returns alarm history from database."""
    return get_alarms(limit=50, active_only=active_only)

@router.get("/production")
def get_production_stats() -> Dict[str, Any]:
    """Returns production counts, runtime, downtime, and industrial OEE metrics."""
    snapshot = sim_engine.get_telemetry_snapshot()
    return snapshot["production"]

@router.get("/history")
def get_sensor_history(limit: int = Query(60, ge=10, le=300)) -> List[Dict[str, Any]]:
    """Returns rolling chronological history of sensor readings from SQLite."""
    return get_latest_sensors(limit=limit)

@router.get("/modbus/registers")
def get_modbus_register_dump() -> Dict[str, Any]:
    """Returns complete Modbus TCP register tables for inspection."""
    return modbus_table.dump_registers()

@router.get("/events")
def get_recent_events(limit: int = Query(30, ge=5, le=100)) -> List[Dict[str, Any]]:
    """Returns operator and machine audit events."""
    return get_machine_events(limit=limit)

# --- Control Endpoints ---

@router.post("/control/start")
def control_start() -> Dict[str, Any]:
    """Issues Start command to PLC logic."""
    success, message = plc_controller.push_start()
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"success": True, "message": message, "status": plc_controller.get_status()}

@router.post("/control/stop")
def control_stop() -> Dict[str, Any]:
    """Issues Stop command to PLC logic."""
    success, message = plc_controller.push_stop()
    return {"success": True, "message": message, "status": plc_controller.get_status()}

@router.post("/control/emergency-stop")
def control_emergency_stop(req: EmergencyStopRequest) -> Dict[str, Any]:
    """Trips or releases the Emergency Stop mushroom button."""
    success, message = plc_controller.trigger_emergency_stop(req.activate)
    return {"success": True, "message": message, "status": plc_controller.get_status()}

@router.post("/control/reset-alarm")
def control_reset_alarm() -> Dict[str, Any]:
    """Resets latched alarms if conditions are safe."""
    success, message = plc_controller.reset_alarms()
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"success": True, "message": message, "status": plc_controller.get_status()}

@router.post("/control/set-speed")
def control_set_speed(req: SpeedSetpointRequest) -> Dict[str, Any]:
    """Updates target motor speed setpoint in Modbus Holding Register 40004."""
    modbus_table.set_holding_register(4, req.speed_rpm)
    return {
        "success": True, 
        "speed_rpm": req.speed_rpm,
        "message": f"Motor speed setpoint configured to {req.speed_rpm} RPM"
    }

# --- Fault Injection Endpoints for Demo & Interview ---

@router.post("/simulation/fault")
def inject_simulation_fault(req: FaultInjectionRequest) -> Dict[str, Any]:
    """Injects over-temperature or high-pressure fault into simulation."""
    if req.fault_type.lower() == "temperature":
        target = req.value if req.value is not None else 76.5
        fault_injector.inject_temperature_fault(target)
        return {"success": True, "message": f"Injected high-temperature fault ({target}°C). Alarm & fan should trigger."}
    elif req.fault_type.lower() == "pressure":
        target = req.value if req.value is not None else 8.9
        fault_injector.inject_pressure_fault(target)
        return {"success": True, "message": f"Injected high-pressure fault ({target} bar). Critical alarm should trigger."}
    else:
        raise HTTPException(status_code=400, detail=f"Unknown fault type: {req.fault_type}. Expected 'temperature' or 'pressure'.")

@router.post("/simulation/clear-faults")
def clear_simulation_faults() -> Dict[str, Any]:
    """Clears injected faults and returns simulation to natural physics."""
    fault_injector.clear_faults()
    return {"success": True, "message": "Injected faults cleared. System returning to normal physics."}
