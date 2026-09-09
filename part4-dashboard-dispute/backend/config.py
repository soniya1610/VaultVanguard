import os
from dotenv import load_dotenv

load_dotenv()

HOST = os.getenv("P4_HOST", "0.0.0.0")
PORT = int(os.getenv("P4_PORT", "8002"))

# Upstream service URLs
PART3_BASE_URL = os.getenv("PART3_BASE_URL", "http://localhost:8001")
PART1_BASE_URL = os.getenv("PART1_BASE_URL", "http://localhost:8000")
