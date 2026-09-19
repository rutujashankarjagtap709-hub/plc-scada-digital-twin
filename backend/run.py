"""
Convenience Launcher for the PLC-SCADA Backend Server
Run with: python run.py
"""

import uvicorn
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print("================================================================")
    print("  Starting PLC-SCADA Digital Twin Server on http://localhost:8000")
    print("  Interactive API Swagger Docs: http://localhost:8000/docs")
    print("  WebSocket Live Telemetry Feed: ws://localhost:8000/ws")
    print("================================================================")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=False, log_level="info")
