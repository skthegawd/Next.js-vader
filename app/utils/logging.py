import json
import os
import logging
from datetime import datetime
from logging.handlers import RotatingFileHandler

# ✅ Define log directory and ensure it exists
LOG_DIR = "/app/logs"
os.makedirs(LOG_DIR, exist_ok=True)

# ✅ Define log file path
LOG_FILE_PATH = os.path.join(LOG_DIR, "system_logs.json")

# ✅ Ensure log file exists
if not os.path.exists(LOG_FILE_PATH):
    with open(LOG_FILE_PATH, "w") as f:
        json.dump([], f)  # Initialize as empty JSON array

# ✅ Implement Rotating Log File
log_handler = RotatingFileHandler(LOG_FILE_PATH, maxBytes=5_000_000, backupCount=5)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
logger.addHandler(log_handler)

def log_query(user_id, query, specialization, response=None, response_time=None, feedback="N/A", error=None):
    """Logs user queries, specialization usage, response, and any errors."""
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "user_id": user_id,
        "query": query,
        "specialization": specialization,
        "response": response if response else "N/A",
        "response_time": f"{response_time:.2f}s" if response_time else "N/A",
        "user_feedback": feedback,
        "error": error if error else "None"
    }

    # ✅ Live Debugging: Print logs to console
    print(json.dumps(log_entry, indent=4))

    # ✅ Append log entry to JSON file
    with open(LOG_FILE_PATH, "a") as log_file:
        json.dump(log_entry, log_file)
        log_file.write("\n")  # Ensure new line for each entry