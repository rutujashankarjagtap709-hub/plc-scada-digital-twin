"""
Integration Tests for FastAPI REST Endpoints
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.db import init_db

@pytest.fixture(scope="module")
def client():
    init_db()
    with TestClient(app) as test_client:
        yield test_client

def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ONLINE"
    assert "endpoints" in data

def test_get_status_endpoint(client):
    response = client.get("/api/status")
    assert response.status_code == 200
    data = response.json()
    assert "actuators" in data
    assert "conveyor" in data["actuators"]
    assert "safety_latches" in data

def test_get_sensors_endpoint(client):
    response = client.get("/api/sensors")
    assert response.status_code == 200
    data = response.json()
    assert "sensors" in data
    assert "temperature" in data["sensors"]
    assert "pressure" in data["sensors"]
    assert "motor_rpm" in data["sensors"]

def test_control_start_and_stop(client):
    # Test start
    res_start = client.post("/api/control/start")
    assert res_start.status_code == 200
    assert res_start.json()["success"] is True

    # Test stop
    res_stop = client.post("/api/control/stop")
    assert res_stop.status_code == 200
    assert res_stop.json()["success"] is True

def test_emergency_stop_api(client):
    # Trip E-stop
    res_trip = client.post("/api/control/emergency-stop", json={"activate": True})
    assert res_trip.status_code == 200
    assert "ACTIVATED" in res_trip.json()["message"]

    # Release E-stop contact
    res_release = client.post("/api/control/emergency-stop", json={"activate": False})
    assert res_release.status_code == 200

    # Reset alarm
    res_reset = client.post("/api/control/reset-alarm")
    assert res_reset.status_code == 200

def test_speed_setpoint_api(client):
    res = client.post("/api/control/set-speed", json={"speed_rpm": 1350})
    assert res.status_code == 200
    assert res.json()["speed_rpm"] == 1350

def test_modbus_register_dump(client):
    res = client.get("/api/modbus/registers")
    assert res.status_code == 200
    data = res.json()
    assert "coils" in data
    assert "discrete_inputs" in data
    assert "input_registers" in data
    assert "holding_registers" in data
