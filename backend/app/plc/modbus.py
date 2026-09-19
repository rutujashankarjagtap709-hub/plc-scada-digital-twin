"""
Simulated Modbus TCP Memory Register System
Implements standard Modbus tables:
- Coils (0xxxx) - Read/Write 1-bit outputs
- Discrete Inputs (1xxxx) - Read-Only 1-bit inputs
- Input Registers (3xxxx) - Read-Only 16-bit analog registers
- Holding Registers (4xxxx) - Read/Write 16-bit parameter registers
"""

import threading
from typing import Dict, Any, List

class ModbusRegisterTable:
    def __init__(self):
        self._lock = threading.Lock()

        # Coils (00001 - 00005)
        self.coils: Dict[int, bool] = {
            1: False,  # 00001: Conveyor Motor Run
            2: False,  # 00002: Coolant Pump Run
            3: False,  # 00003: Cooling Fan Run
            4: False,  # 00004: Alarm Beacon / Horn
            5: False,  # 00005: Emergency Stop Active Flag
        }

        # Discrete Inputs (10001 - 10005)
        self.discrete_inputs: Dict[int, bool] = {
            1: False,  # 10001: Start Push Button
            2: False,  # 10002: Stop Push Button
            3: False,  # 10003: E-Stop Contact Pressed
            4: False,  # 10004: Optical Part Sensor
            5: False,  # 10005: Thermal Overload Trip
        }

        # Input Registers (30001 - 30005)
        self.input_registers: Dict[int, int] = {
            1: 240,   # 30001: Temperature (°C x 10) -> 24.0°C
            2: 10,    # 30002: Pressure (bar x 10) -> 1.0 bar
            3: 0,     # 30003: Motor Speed (RPM)
            4: 0,     # 30004: Production Part Counter
            5: 0,     # 30005: Machine Status Code (0: STOPPED, 1: RUNNING, 2: FAULT, 3: ESTOP)
        }

        # Holding Registers (40001 - 40005)
        self.holding_registers: Dict[int, int] = {
            1: 700,   # 40001: High Temp Alarm Limit (°C x 10) -> 70.0°C
            2: 600,   # 40002: Temp Fan Turn-Off Limit (°C x 10) -> 60.0°C
            3: 80,    # 40003: High Pressure Alarm Limit (bar x 10) -> 8.0 bar
            4: 1200,  # 40004: Motor Speed Setpoint (RPM)
            5: 0,     # 40005: Command / Reset Word
        }

    # Thread-safe read/write methods
    def get_coil(self, address: int) -> bool:
        with self._lock:
            return self.coils.get(address, False)

    def set_coil(self, address: int, value: bool):
        with self._lock:
            self.coils[address] = bool(value)

    def get_discrete_input(self, address: int) -> bool:
        with self._lock:
            return self.discrete_inputs.get(address, False)

    def set_discrete_input(self, address: int, value: bool):
        with self._lock:
            self.discrete_inputs[address] = bool(value)

    def get_input_register(self, address: int) -> int:
        with self._lock:
            return self.input_registers.get(address, 0)

    def set_input_register(self, address: int, value: int):
        with self._lock:
            self.input_registers[address] = int(value)

    def get_holding_register(self, address: int) -> int:
        with self._lock:
            return self.holding_registers.get(address, 0)

    def set_holding_register(self, address: int, value: int):
        with self._lock:
            self.holding_registers[address] = int(value)

    def dump_registers(self) -> Dict[str, List[Dict[str, Any]]]:
        """Returns full register table formatted for industrial SCADA inspection."""
        with self._lock:
            coils_meta = [
                {"address": 1, "modbus": "00001", "name": "Conveyor Motor Run", "value": self.coils[1], "type": "BOOL"},
                {"address": 2, "modbus": "00002", "name": "Coolant Pump Run", "value": self.coils[2], "type": "BOOL"},
                {"address": 3, "modbus": "00003", "name": "Cooling Fan Run", "value": self.coils[3], "type": "BOOL"},
                {"address": 4, "modbus": "00004", "name": "Alarm Beacon/Horn", "value": self.coils[4], "type": "BOOL"},
                {"address": 5, "modbus": "00005", "name": "E-Stop Active Flag", "value": self.coils[5], "type": "BOOL"},
            ]
            di_meta = [
                {"address": 1, "modbus": "10001", "name": "Start Push Button", "value": self.discrete_inputs[1], "type": "BOOL"},
                {"address": 2, "modbus": "10002", "name": "Stop Push Button", "value": self.discrete_inputs[2], "type": "BOOL"},
                {"address": 3, "modbus": "10003", "name": "E-Stop Button Contact", "value": self.discrete_inputs[3], "type": "BOOL"},
                {"address": 4, "modbus": "10004", "name": "Optical Part Sensor", "value": self.discrete_inputs[4], "type": "BOOL"},
                {"address": 5, "modbus": "10005", "name": "Thermal Overload Trip", "value": self.discrete_inputs[5], "type": "BOOL"},
            ]
            ir_meta = [
                {"address": 1, "modbus": "30001", "name": "Measured Temperature (°C x 10)", "value": self.input_registers[1], "engineering": f"{self.input_registers[1]/10:.1f} °C", "type": "INT16"},
                {"address": 2, "modbus": "30002", "name": "Measured Pressure (bar x 10)", "value": self.input_registers[2], "engineering": f"{self.input_registers[2]/10:.1f} bar", "type": "INT16"},
                {"address": 3, "modbus": "30003", "name": "Motor Tachometer (RPM)", "value": self.input_registers[3], "engineering": f"{self.input_registers[3]} RPM", "type": "INT16"},
                {"address": 4, "modbus": "30004", "name": "Total Part Counter", "value": self.input_registers[4], "engineering": f"{self.input_registers[4]} units", "type": "INT16"},
                {"address": 5, "modbus": "30005", "name": "Machine State Code", "value": self.input_registers[5], "engineering": ["STOPPED", "RUNNING", "FAULT", "ESTOP"][min(self.input_registers[5], 3)], "type": "INT16"},
            ]
            hr_meta = [
                {"address": 1, "modbus": "40001", "name": "High Temp Alarm Limit (°C x 10)", "value": self.holding_registers[1], "engineering": f"{self.holding_registers[1]/10:.1f} °C", "type": "INT16"},
                {"address": 2, "modbus": "40002", "name": "Temp Reset Limit (°C x 10)", "value": self.holding_registers[2], "engineering": f"{self.holding_registers[2]/10:.1f} °C", "type": "INT16"},
                {"address": 3, "modbus": "40003", "name": "High Pressure Alarm Limit (bar x 10)", "value": self.holding_registers[3], "engineering": f"{self.holding_registers[3]/10:.1f} bar", "type": "INT16"},
                {"address": 4, "modbus": "40004", "name": "Speed Setpoint (RPM)", "value": self.holding_registers[4], "engineering": f"{self.holding_registers[4]} RPM", "type": "INT16"},
                {"address": 5, "modbus": "40005", "name": "Command Register", "value": self.holding_registers[5], "engineering": hex(self.holding_registers[5]), "type": "INT16"},
            ]
            return {
                "coils": coils_meta,
                "discrete_inputs": di_meta,
                "input_registers": ir_meta,
                "holding_registers": hr_meta,
            }

# Global singleton register table
modbus_table = ModbusRegisterTable()
