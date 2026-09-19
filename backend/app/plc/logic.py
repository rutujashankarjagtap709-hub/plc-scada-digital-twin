"""
PLC Control Logic Engine
Simulates IEC 61131-3 Cyclic Execution and Industrial Ladder Logic:
- Rung 1: Master Start/Stop latch with E-Stop interlock
- Rung 2: Coolant Pump interlock (runs when conveyor runs)
- Rung 3: Thermal Interlock (Hysteresis cooling fan control >70°C on, <60°C off)
- Rung 4: High Pressure trip (>8.0 bar latches alarm)
- Rung 5: Emergency Stop trip (instant shutdown of all actuators)
- Rung 6: Master Alarm Horn/Beacon output
- Rung 7: Reset permissive check
"""

import logging
from typing import Tuple, Dict, Any
from .modbus import modbus_table
from ..database.db import log_alarm, resolve_alarm, log_machine_event

logger = logging.getLogger("plc.logic")

class PLCController:
    def __init__(self):
        # Internal PLC Memory Bits / Flags (M-registers)
        self.conveyor_run_latch: bool = False
        self.pump_run_latch: bool = False
        self.cooling_fan_active: bool = False
        self.emergency_stop_tripped: bool = False

        # Alarm Latch States
        self.alarm_high_temp: bool = False
        self.alarm_high_pressure: bool = False
        self.alarm_estop: bool = False
        self.alarm_motor_fault: bool = False

        # Physical / HMI Input contact flags
        self.start_pb_pressed: bool = False
        self.stop_pb_pressed: bool = False
        self.estop_contact: bool = False

    def push_start(self) -> Tuple[bool, str]:
        """Operator presses Start pushbutton."""
        if self.emergency_stop_tripped or self.estop_contact:
            return False, "Cannot start: Emergency Stop is currently activated."
        if self.alarm_high_pressure:
            return False, "Cannot start: Critical High Pressure fault active."
        
        self.start_pb_pressed = True
        self.stop_pb_pressed = False
        log_machine_event("OPERATOR_START_COMMAND", {"source": "HMI_PANEL"})
        self.scan_cycle(temperature=modbus_table.get_input_register(1)/10, 
                        pressure=modbus_table.get_input_register(2)/10)
        return True, "Start command acknowledged. Conveyor and Pump energizing."

    def push_stop(self) -> Tuple[bool, str]:
        """Operator presses Stop pushbutton."""
        self.stop_pb_pressed = True
        self.start_pb_pressed = False
        log_machine_event("OPERATOR_STOP_COMMAND", {"source": "HMI_PANEL"})
        self.scan_cycle(temperature=modbus_table.get_input_register(1)/10, 
                        pressure=modbus_table.get_input_register(2)/10)
        return True, "Stop command acknowledged. System ramping down to safe idle."

    def trigger_emergency_stop(self, activate: bool) -> Tuple[bool, str]:
        """Operator hits or twists-to-release the Mushroom Emergency Stop button."""
        self.estop_contact = activate
        if activate:
            self.emergency_stop_tripped = True
            self.conveyor_run_latch = False
            self.pump_run_latch = False
            self.cooling_fan_active = False
            self.alarm_estop = True
            log_machine_event("EMERGENCY_STOP_TRIPPED", {"source": "E_STOP_MUSHROOM_PB"})
            log_alarm("EMERGENCY STOP", "CRITICAL", "Emergency Stop button engaged. All actuators de-energized.")
            self.scan_cycle(temperature=modbus_table.get_input_register(1)/10, 
                            pressure=modbus_table.get_input_register(2)/10)
            return True, "EMERGENCY STOP ACTIVATED! All actuators immediately stopped."
        else:
            # Releasing physical button contact alone does not clear the safety latch until alarm reset
            log_machine_event("EMERGENCY_STOP_RELEASED", {"source": "E_STOP_MUSHROOM_PB"})
            return True, "Emergency Stop button released. Alarm must be manually reset before starting."

    def reset_alarms(self) -> Tuple[bool, str]:
        """
        Operator presses Reset Alarm button.
        Safety Permissive: Reset allowed ONLY if conditions are back in normal safe range.
        """
        curr_temp = modbus_table.get_input_register(1) / 10.0
        curr_pressure = modbus_table.get_input_register(2) / 10.0

        unsafe_reasons = []
        if self.estop_contact:
            unsafe_reasons.append("Emergency Stop mushroom button is still pressed down.")
        if curr_temp >= 70.0:
            unsafe_reasons.append(f"Temperature is too high ({curr_temp:.1f}°C >= 70.0°C). Wait for cooling.")
        if curr_pressure > 8.0:
            unsafe_reasons.append(f"System pressure is dangerously high ({curr_pressure:.1f} bar > 8.0 bar).")

        if unsafe_reasons:
            msg = "Alarm reset rejected! Safety interlock active: " + " ".join(unsafe_reasons)
            log_machine_event("ALARM_RESET_REJECTED", {"reasons": unsafe_reasons})
            return False, msg

        # Conditions safe -> clear latched alarms
        if self.alarm_high_temp:
            self.alarm_high_temp = False
            resolve_alarm("HIGH TEMPERATURE")
        if self.alarm_high_pressure:
            self.alarm_high_pressure = False
            resolve_alarm("HIGH PRESSURE")
        if self.alarm_estop:
            self.alarm_estop = False
            self.emergency_stop_tripped = False
            resolve_alarm("EMERGENCY STOP")
        if self.alarm_motor_fault:
            self.alarm_motor_fault = False
            resolve_alarm("MOTOR FAULT")

        log_machine_event("ALARMS_RESET_SUCCESSFUL", {"source": "OPERATOR_RESET_PB"})
        self.scan_cycle(temperature=curr_temp, pressure=curr_pressure)
        return True, "All alarms reset successfully. System returned to normal ready state."

    def scan_cycle(self, temperature: float, pressure: float):
        """
        Executes one PLC ladder logic scan cycle.
        Called on every 1-second simulation clock or immediate operator event.
        """
        # Update Modbus Input Registers for temperature and pressure
        modbus_table.set_input_register(1, int(temperature * 10))
        modbus_table.set_input_register(2, int(pressure * 10))

        # Read Holding Register limits
        temp_high_limit = modbus_table.get_holding_register(1) / 10.0   # e.g., 70.0
        temp_reset_limit = modbus_table.get_holding_register(2) / 10.0  # e.g., 60.0
        pressure_high_limit = modbus_table.get_holding_register(3) / 10.0 # e.g., 8.0

        # --- RUNG 1: Master E-STOP Trip Logic ---
        if self.estop_contact:
            self.emergency_stop_tripped = True
            self.alarm_estop = True

        # --- RUNG 2: High Temperature Interlock & Hysteresis ---
        if temperature > temp_high_limit:
            self.cooling_fan_active = True
            if not self.alarm_high_temp:
                self.alarm_high_temp = True
                log_alarm("HIGH TEMPERATURE", "WARNING", f"Temperature exceeded {temp_high_limit}°C (measured: {temperature:.1f}°C)")
        elif temperature < temp_reset_limit:
            # Fan turns off once cooled below safe hysteresis threshold
            self.cooling_fan_active = False

        # --- RUNG 3: High Pressure Interlock ---
        if pressure > pressure_high_limit:
            if not self.alarm_high_pressure:
                self.alarm_high_pressure = True
                log_alarm("HIGH PRESSURE", "CRITICAL", f"Pressure exceeded {pressure_high_limit} bar (measured: {pressure:.1f} bar)")

        # --- RUNG 4: Conveyor Motor & Coolant Pump Latch ---
        if self.emergency_stop_tripped or self.alarm_high_pressure:
            # Safety trip drops out conveyor and pump
            self.conveyor_run_latch = False
            self.pump_run_latch = False
        elif self.stop_pb_pressed:
            self.conveyor_run_latch = False
            self.pump_run_latch = False
            self.stop_pb_pressed = False
        elif self.start_pb_pressed and not self.emergency_stop_tripped:
            self.conveyor_run_latch = True
            self.pump_run_latch = True
            self.start_pb_pressed = False

        # If E-STOP is active, cooling fan is also cut off as per safety shutdown requirements
        fan_output = self.cooling_fan_active and not self.emergency_stop_tripped
        alarm_output = (self.alarm_high_temp or self.alarm_high_pressure or self.alarm_estop or self.alarm_motor_fault)

        # Update Machine State Code for Modbus IR 30005:
        # 0: STOPPED, 1: RUNNING, 2: FAULT/ALARM, 3: ESTOP
        if self.emergency_stop_tripped:
            state_code = 3
        elif alarm_output:
            state_code = 2
        elif self.conveyor_run_latch:
            state_code = 1
        else:
            state_code = 0

        # --- Write to Modbus Coils & Inputs ---
        modbus_table.set_coil(1, self.conveyor_run_latch)   # Conveyor Run
        modbus_table.set_coil(2, self.pump_run_latch)       # Coolant Pump Run
        modbus_table.set_coil(3, fan_output)               # Cooling Fan Run
        modbus_table.set_coil(4, alarm_output)             # Master Alarm Horn/Beacon
        modbus_table.set_coil(5, self.emergency_stop_tripped) # E-Stop Active Flag

        modbus_table.set_discrete_input(1, self.start_pb_pressed)
        modbus_table.set_discrete_input(2, self.stop_pb_pressed)
        modbus_table.set_discrete_input(3, self.estop_contact)

        modbus_table.set_input_register(5, state_code)

    def get_status(self) -> Dict[str, Any]:
        """Returns the current PLC status object."""
        state_names = {0: "STOPPED", 1: "RUNNING", 2: "FAULT / ALARM", 3: "EMERGENCY STOP"}
        state_code = modbus_table.get_input_register(5)
        return {
            "state_code": state_code,
            "state_name": state_names.get(state_code, "UNKNOWN"),
            "conveyor_run": modbus_table.get_coil(1),
            "pump_run": modbus_table.get_coil(2),
            "fan_run": modbus_table.get_coil(3),
            "alarm_beacon": modbus_table.get_coil(4),
            "estop_active": modbus_table.get_coil(5),
            "estop_contact": self.estop_contact,
            "active_alarms": {
                "high_temperature": self.alarm_high_temp,
                "high_pressure": self.alarm_high_pressure,
                "emergency_stop": self.alarm_estop,
                "motor_fault": self.alarm_motor_fault
            }
        }

# Global singleton PLC controller
plc_controller = PLCController()
