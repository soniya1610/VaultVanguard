import os
from dotenv import load_dotenv

load_dotenv()

HOST = os.getenv("P3_HOST", "0.0.0.0")
PORT = int(os.getenv("P3_PORT", "8001"))

# Demo configuration
DEMO_PAYER = os.getenv("DEMO_PAYER", "Arjun")
DEMO_RECEIVER = os.getenv("DEMO_RECEIVER", "Riya")
DEMO_AMOUNT = float(os.getenv("DEMO_AMOUNT", "250.0"))
DEMO_CURRENCY = os.getenv("DEMO_CURRENCY", "INR")
DEMO_PURPOSE = os.getenv("DEMO_PURPOSE", "tea")

# Gateway simulation delay (ms) — for realistic feel in demo
GATEWAY_SIMULATE_DELAY_MS = int(os.getenv("GATEWAY_SIMULATE_DELAY_MS", "0"))
