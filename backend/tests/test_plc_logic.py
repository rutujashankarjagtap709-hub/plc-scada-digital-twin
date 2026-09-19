"""
Unit Tests for PLC Logic, Safety Interlocks, and Simulation Calculations
"""

import pytest
from app.plc.logic import PLCController
from app.plc.modbus import ModbusRegisterTable
from app.simulation.engine import SimulationEngine
from app.database.db import init_db

@pytest.fixture(autouse=True)
def setup_test_env():
    """Initializes SQLite DB and resets test state before each test."""
    init_db()

def test_start_logic():
    plc = PLCController()
    # Ensure starting from stopped state
    assert not plc.conveyor_run_latch
    assert not plc.emergency_stop_tripped

    success, msg = plc.push_start()
    assert success is True
    assert "Start command acknowledged" in msg
    assert plc.conveyor_run_latch is True
    assert plc.pump_run_latch is True

def test_stop_logic():
    plc = PLCController()
    plc.push_start()
    assert plc.conveyor_run_latch is True

    success, msg = plc.push_stop()
    assert success is True
    assert "Stop command acknowledged" in msg
    assert plc.conveyor_run_latch is False
    assert plc.pump_run_latch is False

def test_emergency_stop_trip_and_lockout():
    plc = PLCController()
    plc.push_start()
    assert plc.conveyor_run_latch is True

    # Trip Emergency Stop
    success, msg = plc.trigger_emergency_stop(True)
    assert success is True
    assert plc.emergency_stop_tripped is True
    assert plc.conveyor_run_latch is False
    assert plc.pump_run_latch is False
    assert plc.alarm_estop is True

    # Verify Start is prevented during E-Stop
    start_success, start_msg = plc.push_start()
    assert start_success is False
    assert "Emergency Stop is currently activated" in start_msg

def test_high_temperature_fan_and_alarm_hysteresis():
    plc = PLCController()
    # Normal temperature 45°C
    plc.scan_cycle(temperature=45.0, pressure=5.0)
    assert plc.cooling_fan_active is False
    assert plc.alarm_high_temp is False

    # Temperature exceeds 70°C -> Cooling Fan = ON, Alarm = ON
    plc.scan_cycle(temperature=72.5, pressure=5.0)
    assert plc.cooling_fan_active is True
    assert plc.alarm_high_temp is True

    # Temperature cools to 65°C -> Fan should still be ON (hysteresis band 60-70°C)
    plc.scan_cycle(temperature=65.0, pressure=5.0)
    assert plc.cooling_fan_active is True

    # Temperature cools below 60°C -> Fan turns OFF
    plc.scan_cycle(temperature=58.0, pressure=5.0)
    assert plc.cooling_fan_active is False

def test_high_pressure_alarm():
    plc = PLCController()
    plc.push_start()
    assert plc.conveyor_run_latch is True

    # Pressure normal 5.5 bar
    plc.scan_cycle(temperature=45.0, pressure=5.5)
    assert plc.alarm_high_pressure is False

    # Pressure exceeds 8.0 bar -> Alarm = ON, conveyor trips out
    plc.scan_cycle(temperature=45.0, pressure=8.6)
    assert plc.alarm_high_pressure is True
    assert plc.conveyor_run_latch is False

def test_alarm_reset_conditions():
    plc = PLCController()
    
    # Trip high temp alarm
    plc.scan_cycle(temperature=74.0, pressure=5.0)
    assert plc.alarm_high_temp is True

    # Attempt to reset while temperature is still high (>= 70°C) -> Must be rejected
    can_reset, reject_msg = plc.reset_alarms()
    assert can_reset is False
    assert "Temperature is too high" in reject_msg
    assert plc.alarm_high_temp is True

    # Cool down to safe temperature (< 70°C)
    plc.scan_cycle(temperature=55.0, pressure=5.0)

    # Now reset should succeed
    reset_ok, ok_msg = plc.reset_alarms()
    assert reset_ok is True
    assert "All alarms reset successfully" in ok_msg
    assert plc.alarm_high_temp is False

def test_production_counter_and_runtime():
    sim = SimulationEngine()
    sim.ideal_cycle_time_seconds = 1.0  # Fast cycle for testing
    sim.runtime_seconds = 10.0
    sim.downtime_seconds = 2.0
    sim.production_count = 8
    sim.good_parts = 8

    oee = sim.calculate_oee()
    # Availability = 10 / 12 = 83.3%
    assert oee["availability"] == pytest.approx(83.3, 0.5)
    # Target parts = 10 / 1.0 = 10 parts -> Performance = 8 / 10 = 80.0%
    assert oee["performance"] == pytest.approx(80.0, 0.5)
    # Quality = 8 / 8 = 100%
    assert oee["quality"] == pytest.approx(100.0, 0.5)
    # OEE = 0.833 * 0.80 * 1.0 * 100 = 66.6%
    assert oee["oee"] == pytest.approx(66.6, 1.0)
