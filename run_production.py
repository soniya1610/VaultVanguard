"""
TrustBridge (VaultVanguard) — Production Multi-Service Orchestrator
Launches and monitors all 4 microservice backends and frontends concurrently:

  - Part 1: Conversation, NLP & Mutual Consent Layer
      Backend:  http://localhost:8000  (API Health: /api/health)
      Frontend: http://localhost:5173

  - Part 2: Transaction Passport & State Machine
      Backend:  http://localhost:8002  (API Health: /api/health)
      Frontend: http://localhost:5175

  - Part 3: Payment Orchestration & Reconciliation Engine
      Backend:  http://localhost:8001  (API Health: /api/health)
      Frontend: http://localhost:5174

  - Part 4: Merchant Dashboard & Dispute Resolution
      Backend:  http://localhost:8003  (API Health: /api/health)
      Frontend: http://localhost:5176
"""
import subprocess
import sys
import os
import time
import signal

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT_DIR = os.path.abspath(os.path.dirname(__file__))

SERVICES = [
    {
        "name": "Part 1 Backend (NLP & Consent)",
        "cmd": [sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"],
        "cwd": os.path.join(ROOT_DIR, "part1-conversation-nlp", "backend"),
        "port": 8000,
        "type": "backend",
    },
    {
        "name": "Part 2 Backend (Transaction Passport)",
        "cmd": [sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"],
        "cwd": os.path.join(ROOT_DIR, "part2-transaction-passport", "backend"),
        "port": 8002,
        "type": "backend",
    },
    {
        "name": "Part 3 Backend (Payment & Reconciliation)",
        "cmd": [sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"],
        "cwd": os.path.join(ROOT_DIR, "part3-payment-reconciliation", "backend"),
        "port": 8001,
        "type": "backend",
    },
    {
        "name": "Part 4 Backend (Dashboard & Dispute)",
        "cmd": [sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8003"],
        "cwd": os.path.join(ROOT_DIR, "part4-dashboard-dispute", "backend"),
        "port": 8003,
        "type": "backend",
    },
    {
        "name": "Part 1 Frontend",
        "cmd": ["npm", "run", "dev"],
        "cwd": os.path.join(ROOT_DIR, "part1-conversation-nlp", "frontend"),
        "port": 5173,
        "type": "frontend",
    },
    {
        "name": "Part 2 Frontend",
        "cmd": ["npm", "run", "dev"],
        "cwd": os.path.join(ROOT_DIR, "part2-transaction-passport", "frontend"),
        "port": 5175,
        "type": "frontend",
    },
    {
        "name": "Part 3 Frontend",
        "cmd": ["npm", "run", "dev"],
        "cwd": os.path.join(ROOT_DIR, "part3-payment-reconciliation", "frontend"),
        "port": 5174,
        "type": "frontend",
    },
    {
        "name": "Part 4 Frontend",
        "cmd": ["npm", "run", "dev"],
        "cwd": os.path.join(ROOT_DIR, "part4-dashboard-dispute", "frontend"),
        "port": 5176,
        "type": "frontend",
    },
]


def main():
    print("=" * 76)
    print(" TrustBridge (VaultVanguard) Production Multi-Service Orchestrator")
    print("=" * 76)
    print(" Starting all 4 decoupled microservices and frontends...\n")

    processes = []

    def shutdown(signum=None, frame=None):
        print("\n\n Gracefully terminating all microservices...")
        for p, s in processes:
            try:
                if sys.platform == "win32":
                    subprocess.run(["taskkill", "/F", "/T", "/PID", str(p.pid)], capture_output=True)
                else:
                    p.terminate()
            except Exception:
                pass
        print(" All processes stopped. Goodbye!")
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    if hasattr(signal, "SIGTERM"):
        signal.signal(signal.SIGTERM, shutdown)

    # Launch backends first, then frontends
    backends = [s for s in SERVICES if s["type"] == "backend"]
    frontends = [s for s in SERVICES if s["type"] == "frontend"]

    print("[1/2] Launching Backend Microservices:")
    for s in backends:
        shell = sys.platform == "win32"
        p = subprocess.Popen(
            s["cmd"],
            cwd=s["cwd"],
            shell=shell,
        )
        processes.append((p, s))
        print(f"  ✓ {s['name']:<42} -> http://localhost:{s['port']}")

    time.sleep(2)

    print("\n[2/2] Launching Frontend Applications:")
    for s in frontends:
        shell = sys.platform == "win32"
        p = subprocess.Popen(
            s["cmd"],
            cwd=s["cwd"],
            shell=shell,
        )
        processes.append((p, s))
        print(f"  ✓ {s['name']:<42} -> http://localhost:{s['port']}")

    print("\n" + "=" * 76)
    print(" All TrustBridge microservices are live!")
    print(" Quick Navigation:")
    print("   💬 Part 1 (Chat & NLP Intent Detection):  http://localhost:5173")
    print("   🛡️ Part 2 (Transaction Passport Ledger):   http://localhost:5175")
    print("   ⚡ Part 3 (Payment & Reconciliation):      http://localhost:5174")
    print("   📊 Part 4 (Merchant Dashboard & Dispute):   http://localhost:5176")
    print("=" * 76)
    print(" Press Ctrl+C to terminate all services.\n")

    try:
        while True:
            time.sleep(1)
            # Check for crashed processes
            for p, s in processes:
                poll = p.poll()
                if poll is not None:
                    print(f"\n[ALERT] Process {s['name']} exited unexpectedly with code {poll}")
    except KeyboardInterrupt:
        shutdown()


if __name__ == "__main__":
    main()
