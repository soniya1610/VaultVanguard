import os
from dotenv import load_dotenv

load_dotenv()

HOST = os.getenv("P2_HOST", "0.0.0.0")
PORT = int(os.getenv("P2_PORT", "8002"))

P1_URL = os.getenv("P1_URL", "http://localhost:8000")
P3_URL = os.getenv("P3_URL", "http://localhost:8001")
P4_URL = os.getenv("P4_URL", "http://localhost:8003")
