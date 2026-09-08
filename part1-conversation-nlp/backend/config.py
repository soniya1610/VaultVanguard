import os
from dotenv import load_dotenv

# Load environment variables from .env file if available
load_dotenv()

# Configurable constants
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.75"))
DEFAULT_CURRENCY = os.getenv("DEFAULT_CURRENCY", "INR")

# LLM API keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

# Server Config
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
