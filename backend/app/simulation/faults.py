"""
Fault Injection Module for PLC/SCADA Simulation
Allows operators or interview evaluators to manually inject faults into the simulation:
- Inject High Temperature Spike (>75°C)
- Inject High Pressure Spike (>8.5 bar)
- Clear Injected Faults
"""

import threading

class FaultInjector:
    def __init__(self):
        self._lock = threading.Lock()
        self.forced_temp_offset: float = 0.0
        self.forced_pressure_offset: float = 0.0
        self.temp_fault_active: bool = False
        self.pressure_fault_active: bool = False

    def inject_temperature_fault(self, target_temp: float = 76.5):
        """Forces temperature to spike above 70°C threshold to trigger cooling fan and alarm."""
        with self._lock:
            self.temp_fault_active = True
            self.forced_temp_offset = target_temp

    def inject_pressure_fault(self, target_pressure: float = 8.8):
        """Forces hydraulic/pneumatic pressure above 8.0 bar threshold to trigger critical alarm."""
        with self._lock:
            self.pressure_fault_active = True
            self.forced_pressure_offset = target_pressure

    def clear_faults(self):
        """Restores normal physics simulation parameters."""
        with self._lock:
            self.temp_fault_active = False
            self.pressure_fault_active = False
            self.forced_temp_offset = 0.0
            self.forced_pressure_offset = 0.0

    def get_status(self):
        with self._lock:
            return {
                "temp_fault_active": self.temp_fault_active,
                "pressure_fault_active": self.pressure_fault_active,
            }

fault_injector = FaultInjector()
