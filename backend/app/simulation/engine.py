"""
Industrial Simulation Engine
Generates smooth, realistic physics for:
- Motor acceleration, deceleration, and emergency drop
- Thermal generation from motor load and forced-air cooling fan dissipation
- Hydraulic/pneumatic pressure dynamics and process variance
- Photoelectric optical part detection and production unit counting
- OEE calculation (Availability, Performance, Quality, Overall OEE)
"""

import asyncio
import random
import time
from datetime import datetime, timezone
from typing import Dict, Any, Optional

from ..plc.modbus import modbus_table
from ..plc.logic import plc_controller
from .faults import fault_injector
from ..database.db import (
    log_sensor_reading,
    log_production_kpi,
    init_db
)

class SimulationEngine:
    def __init__(self):
        # Physics state
        self.temperature: float = 24.5       # °C
        self.pressure: float = 1.2          # bar
        self.motor_rpm: float = 0.0         # RPM
        self.production_count: int = 0      # units
        self.good_parts: int = 0            # units
        self.part_detection_pulse: bool = False
        self._part_progress: float = 0.0    # 0.0 to 1.0 cycle

        # Time tracking for OEE (seconds)
        self.start_epoch: float = time.time()
        self.runtime_seconds: float = 0.0
        self.downtime_seconds: float = 0.0
        self.ideal_cycle_time_seconds: float = 3.5  # 1 part every 3.5s at full speed

        # Simulation loop control
        self.is_running: bool = False
        self._task: Optional[asyncio.Task] = None
        self._websocket_broadcast_callback = None

    def register_broadcast_callback(self, callback):
        """Registers the WebSocket manager callback for pushing 1Hz frames."""
        self._websocket_broadcast_callback = callback

    async def start(self):
        """Starts the asynchronous simulation engine background loop."""
        if self.is_running:
            return
        self.is_running = True
        init_db()
        self._task = asyncio.create_task(self._simulation_loop())

    async def stop(self):
        """Stops the simulation loop."""
        self.is_running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

    async def _simulation_loop(self):
        """Main 1-second cyclic tick."""
        while self.is_running:
            try:
                t0 = time.time()
                self._tick()
                
                # Broadcast real-time packet via WebSocket
                if self._websocket_broadcast_callback:
                    await self._websocket_broadcast_callback(self.get_telemetry_snapshot())

                # Sleep until next 1-second boundary
                elapsed = time.time() - t0
                sleep_time = max(0.05, 1.0 - elapsed)
                await asyncio.sleep(sleep_time)
            except asyncio.CancelledError:
                break
            except Exception as e:
                # Log exception without crashing background loop
                print(f"[SimulationEngine Error]: {e}")
                await asyncio.sleep(1.0)

    def _tick(self):
        """Executes one simulation step (1 Hz)."""
        conveyor_coil = modbus_table.get_coil(1)   # Conveyor Run
        pump_coil = modbus_table.get_coil(2)       # Pump Run
        fan_coil = modbus_table.get_coil(3)        # Cooling Fan Run
        estop_active = modbus_table.get_coil(5)    # E-Stop
        speed_setpoint = modbus_table.get_holding_register(4) or 1200 # Target RPM

        # --- 1. Motor Speed Dynamics ---
        if estop_active:
            # Emergency Stop: instantaneous dynamic stop
            self.motor_rpm = 0.0
        elif conveyor_coil:
            # Smooth acceleration ramp towards setpoint
            target = float(speed_setpoint)
            if self.motor_rpm < target:
                self.motor_rpm = min(target, self.motor_rpm + 220.0 + random.uniform(-10, 10))
            else:
                self.motor_rpm = max(target, self.motor_rpm - 150.0)
            # Add subtle industrial jitter when at speed
            if self.motor_rpm >= target - 50:
                self.motor_rpm = target + random.uniform(-6.0, 6.0)
        else:
            # Normal deceleration ramp down
            if self.motor_rpm > 0:
                self.motor_rpm = max(0.0, self.motor_rpm - 180.0)

        self.motor_rpm = round(max(0.0, min(1500.0, self.motor_rpm)), 1)

        # --- 2. Thermal Dynamics ---
        # Heat generation is proportional to motor load
        ambient_temp = 24.0
        heat_factor = (self.motor_rpm / 1500.0) * 0.85
        
        if fan_coil:
            # Cooling fan draws heat out effectively
            cooling_rate = 1.35
            self.temperature -= (cooling_rate - heat_factor * 0.3)
        elif conveyor_coil:
            # Temperature gradually increases while motor operates
            self.temperature += heat_factor + random.uniform(-0.05, 0.08)
        else:
            # Decays naturally towards ambient
            if self.temperature > ambient_temp:
                self.temperature -= 0.15
            elif self.temperature < ambient_temp:
                self.temperature += 0.10

        # Inject fault override if active
        if fault_injector.temp_fault_active:
            target_fault = fault_injector.forced_temp_offset
            self.temperature += (target_fault - self.temperature) * 0.45

        self.temperature = round(max(20.0, min(85.0, self.temperature)), 2)

        # --- 3. Pressure Dynamics ---
        if fault_injector.pressure_fault_active:
            target_fault_p = fault_injector.forced_pressure_offset
            self.pressure += (target_fault_p - self.pressure) * 0.5
        elif pump_coil and not estop_active:
            # Pump generates 4.8 - 6.2 bar hydraulic pressure with realistic fluctuations
            target_p = 5.4 + random.uniform(-0.3, 0.3)
            self.pressure += (target_p - self.pressure) * 0.4
        else:
            # Pressure bleeds down to baseline atmospheric pressure (~1.0 bar)
            if self.pressure > 1.2:
                self.pressure -= 0.6
            else:
                self.pressure = 1.0 + random.uniform(0.0, 0.15)

        self.pressure = round(max(1.0, min(10.0, self.pressure)), 2)

        # --- 4. Product Movement & Optical Counter ---
        self.part_detection_pulse = False
        if conveyor_coil and self.motor_rpm > 500:
            # Increment conveyor travel progress
            cycle_speed = self.motor_rpm / 1200.0
            self._part_progress += cycle_speed * (1.0 / self.ideal_cycle_time_seconds)
            if self._part_progress >= 1.0:
                self._part_progress = 0.0
                self.production_count += 1
                self.part_detection_pulse = True
                # Quality check simulation (approx 98.8% first-pass yield)
                if random.random() > 0.012:
                    self.good_parts += 1
        else:
            self._part_progress = 0.0

        # Discrete input 10004 for optical sensor
        modbus_table.set_discrete_input(4, self.part_detection_pulse)

        # --- 5. OEE & Production Runtime Tracking ---
        if conveyor_coil and not estop_active:
            self.runtime_seconds += 1.0
        else:
            self.downtime_seconds += 1.0

        oee_data = self.calculate_oee()

        # --- 6. Update Modbus Input Registers ---
        # 30001: Temp (°C x 10)
        modbus_table.set_input_register(1, int(self.temperature * 10))
        # 30002: Pressure (bar x 10)
        modbus_table.set_input_register(2, int(self.pressure * 10))
        # 30003: Motor RPM
        modbus_table.set_input_register(3, int(self.motor_rpm))
        # 30004: Part Counter
        modbus_table.set_input_register(4, self.production_count)

        # --- 7. PLC Scan Cycle Execution ---
        plc_controller.scan_cycle(self.temperature, self.pressure)

        # --- 8. SQLite Telemetry Persistence ---
        now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        log_sensor_reading(
            temperature=self.temperature,
            pressure=self.pressure,
            motor_rpm=self.motor_rpm,
            fan_state=int(modbus_table.get_coil(3)),
            pump_state=int(modbus_table.get_coil(2)),
            conveyor_state=int(modbus_table.get_coil(1)),
            timestamp=now_iso
        )

        # Save production KPI snapshot periodically (e.g. every 5 seconds)
        if int(self.runtime_seconds + self.downtime_seconds) % 5 == 0:
            log_production_kpi(
                part_count=self.production_count,
                run_time_seconds=self.runtime_seconds,
                down_time_seconds=self.downtime_seconds,
                availability=oee_data["availability"],
                performance=oee_data["performance"],
                quality=oee_data["quality"],
                oee=oee_data["oee"],
                timestamp=now_iso
            )

    def calculate_oee(self) -> Dict[str, float]:
        """
        Standard Industrial OEE Formula:
        - Availability = Operating Time / Total Planned Time
        - Performance = (Actual Production / Target Production for Operating Time)
        - Quality = Good Parts / Total Parts
        - OEE = Availability × Performance × Quality
        """
        total_time = self.runtime_seconds + self.downtime_seconds
        if total_time <= 0:
            availability = 1.0
        else:
            availability = self.runtime_seconds / total_time

        if self.runtime_seconds > 0:
            # Ideal production target during operating time
            target_parts = self.runtime_seconds / self.ideal_cycle_time_seconds
            performance = min(1.0, max(0.0, self.production_count / target_parts))
        else:
            performance = 1.0 if self.production_count == 0 else 0.0

        if self.production_count > 0:
            quality = min(1.0, max(0.0, self.good_parts / self.production_count))
        else:
            quality = 1.0

        oee = availability * performance * quality * 100.0

        return {
            "availability": round(availability * 100.0, 1),
            "performance": round(performance * 100.0, 1),
            "quality": round(quality * 100.0, 1),
            "oee": round(oee, 1)
        }

    def get_telemetry_snapshot(self) -> Dict[str, Any]:
        """Returns complete real-time SCADA state packet."""
        oee = self.calculate_oee()
        plc_status = plc_controller.get_status()
        
        # Production rate calculation (parts per minute based on current speed)
        rate_ppm = round((self.motor_rpm / 1200.0) * (60.0 / self.ideal_cycle_time_seconds), 1) if plc_status["conveyor_run"] else 0.0

        return {
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "sensors": {
                "temperature": self.temperature,
                "pressure": self.pressure,
                "motor_rpm": self.motor_rpm,
                "part_counter": self.production_count,
                "optical_sensor_pulse": self.part_detection_pulse,
                "part_progress": round(self._part_progress, 2),
            },
            "actuators": {
                "conveyor_motor": plc_status["conveyor_run"],
                "coolant_pump": plc_status["pump_run"],
                "cooling_fan": plc_status["fan_run"],
                "alarm_beacon": plc_status["alarm_beacon"],
                "emergency_stop": plc_status["estop_active"],
            },
            "machine": {
                "state_code": plc_status["state_code"],
                "state_name": plc_status["state_name"],
                "estop_contact": plc_status["estop_contact"],
            },
            "alarms": plc_status["active_alarms"],
            "production": {
                "total_units": self.production_count,
                "good_units": self.good_parts,
                "scrap_units": max(0, self.production_count - self.good_parts),
                "production_rate_ppm": rate_ppm,
                "runtime_seconds": round(self.runtime_seconds, 1),
                "downtime_seconds": round(self.downtime_seconds, 1),
                "oee": oee["oee"],
                "availability": oee["availability"],
                "performance": oee["performance"],
                "quality": oee["quality"]
            },
            "modbus": modbus_table.dump_registers()
        }

# Global singleton simulation engine
sim_engine = SimulationEngine()
