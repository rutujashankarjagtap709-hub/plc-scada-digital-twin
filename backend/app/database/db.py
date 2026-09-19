import sqlite3
import os
import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(DB_DIR, "scada.db")

def get_connection() -> sqlite3.Connection:
    """Returns a thread-safe connection to the SQLite database with row factory enabled."""
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    return conn

def _current_iso_time() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

def init_db():
    """Initializes the database schema if tables do not exist."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS sensor_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            temperature REAL NOT NULL,
            pressure REAL NOT NULL,
            motor_rpm REAL NOT NULL,
            fan_state INTEGER NOT NULL,
            pump_state INTEGER NOT NULL,
            conveyor_state INTEGER NOT NULL
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS alarms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            resolved_at TEXT,
            alarm_type TEXT NOT NULL,
            severity TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT NOT NULL
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS machine_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            event_type TEXT NOT NULL,
            details TEXT
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS production (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            part_count INTEGER NOT NULL,
            run_time_seconds REAL NOT NULL,
            down_time_seconds REAL NOT NULL,
            availability REAL NOT NULL,
            performance REAL NOT NULL,
            quality REAL NOT NULL,
            oee REAL NOT NULL
        );
        """)

        # Create indices for fast historical query lookups
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_sensor_timestamp ON sensor_history(timestamp);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_alarms_timestamp ON alarms(timestamp);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_timestamp ON machine_events(timestamp);")

        conn.commit()
    finally:
        conn.close()

def log_sensor_reading(
    temperature: float,
    pressure: float,
    motor_rpm: float,
    fan_state: int,
    pump_state: int,
    conveyor_state: int,
    timestamp: Optional[str] = None
):
    """Inserts a single sensor snapshot into sensor_history."""
    if timestamp is None:
        timestamp = _current_iso_time()
    conn = get_connection()
    try:
        with conn:
            conn.execute("""
                INSERT INTO sensor_history 
                (timestamp, temperature, pressure, motor_rpm, fan_state, pump_state, conveyor_state)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (timestamp, round(temperature, 2), round(pressure, 2), round(motor_rpm, 1),
                  int(fan_state), int(pump_state), int(conveyor_state)))
    finally:
        conn.close()

def log_alarm(alarm_type: str, severity: str, message: str, timestamp: Optional[str] = None) -> int:
    """Logs a newly triggered alarm if an active one of the same type does not already exist."""
    if timestamp is None:
        timestamp = _current_iso_time()
    conn = get_connection()
    try:
        with conn:
            # Check if identical alarm type is already ACTIVE
            cursor = conn.execute(
                "SELECT id FROM alarms WHERE alarm_type = ? AND status = 'ACTIVE'", 
                (alarm_type,)
            )
            row = cursor.fetchone()
            if row:
                return row['id']

            cursor = conn.execute("""
                INSERT INTO alarms (timestamp, alarm_type, severity, message, status)
                VALUES (?, ?, ?, ?, 'ACTIVE')
            """, (timestamp, alarm_type, severity, message))
            return cursor.lastrowid
    finally:
        conn.close()

def resolve_alarm(alarm_type: str, timestamp: Optional[str] = None):
    """Marks an active alarm as RESOLVED."""
    if timestamp is None:
        timestamp = _current_iso_time()
    conn = get_connection()
    try:
        with conn:
            conn.execute("""
                UPDATE alarms 
                SET status = 'RESOLVED', resolved_at = ?
                WHERE alarm_type = ? AND status != 'RESOLVED'
            """, (timestamp, alarm_type))
    finally:
        conn.close()

def log_machine_event(event_type: str, details: Optional[Dict[str, Any]] = None, timestamp: Optional[str] = None):
    """Logs an operator or system action (START, STOP, EMERGENCY STOP, RESET)."""
    if timestamp is None:
        timestamp = _current_iso_time()
    details_str = json.dumps(details or {})
    conn = get_connection()
    try:
        with conn:
            conn.execute("""
                INSERT INTO machine_events (timestamp, event_type, details)
                VALUES (?, ?, ?)
            """, (timestamp, event_type, details_str))
    finally:
        conn.close()

def log_production_kpi(
    part_count: int,
    run_time_seconds: float,
    down_time_seconds: float,
    availability: float,
    performance: float,
    quality: float,
    oee: float,
    timestamp: Optional[str] = None
):
    """Records production & OEE calculations."""
    if timestamp is None:
        timestamp = _current_iso_time()
    conn = get_connection()
    try:
        with conn:
            conn.execute("""
                INSERT INTO production
                (timestamp, part_count, run_time_seconds, down_time_seconds, availability, performance, quality, oee)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (timestamp, part_count, round(run_time_seconds, 1), round(down_time_seconds, 1),
                  round(availability, 2), round(performance, 2), round(quality, 2), round(oee, 2)))
    finally:
        conn.close()

def get_latest_sensors(limit: int = 60) -> List[Dict[str, Any]]:
    """Fetches the latest N sensor readings in chronological order."""
    conn = get_connection()
    try:
        cursor = conn.execute("""
            SELECT * FROM (
                SELECT * FROM sensor_history ORDER BY id DESC LIMIT ?
            ) sub ORDER BY id ASC;
        """, (limit,))
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()

def get_alarms(limit: int = 50, active_only: bool = False) -> List[Dict[str, Any]]:
    """Fetches alarm records."""
    conn = get_connection()
    try:
        if active_only:
            cursor = conn.execute(
                "SELECT * FROM alarms WHERE status = 'ACTIVE' ORDER BY id DESC LIMIT ?", 
                (limit,)
            )
        else:
            cursor = conn.execute(
                "SELECT * FROM alarms ORDER BY id DESC LIMIT ?", 
                (limit,)
            )
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()

def get_machine_events(limit: int = 30) -> List[Dict[str, Any]]:
    """Fetches recent machine events."""
    conn = get_connection()
    try:
        cursor = conn.execute("SELECT * FROM machine_events ORDER BY id DESC LIMIT ?", (limit,))
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()

def get_latest_production() -> Optional[Dict[str, Any]]:
    """Fetches the most recent production & OEE record."""
    conn = get_connection()
    try:
        cursor = conn.execute("SELECT * FROM production ORDER BY id DESC LIMIT 1")
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()
