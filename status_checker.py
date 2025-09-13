import requests
import time
from datetime import datetime, timezone

# Import Firebase libraries
import firebase_admin
from firebase_admin import credentials, firestore

# --- FIREBASE INITIALIZATION ---
# This block connects to Firebase using your secret key file
try:
    cred = credentials.Certificate("firebase-credentials.json")
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("✅ Successfully connected to Firebase.")
except Exception as e:
    print(f"❌ ERROR: Could not connect to Firebase. Check your 'firebase-credentials.json' file. Details: {e}")
    db = None
# ------------------------------------


SITES_TO_CHECK = [
    "https://google.com",
    "https://github.com",
    "https://www.terna.it",
]

def check_site_status(url):
    """
    Checks a single website and returns a dictionary with the results.
    """
    status_info = {
        "url": url,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status_code": None,
        "response_time_ms": None,
        "status": "DOWN" # Assume DOWN by default
    }

    try:
        start_time = time.time()
        # Add a 10-second timeout to avoid getting stuck
        response = requests.get(url, timeout=10)
        end_time = time.time()

        response_time = (end_time - start_time) * 1000

        status_info["response_time_ms"] = round(response_time)
        status_info["status_code"] = response.status_code

        # If status code is < 400 (e.g., 200 OK, 301 Redirect), consider it UP
        if response.status_code < 400:
            status_info["status"] = "UP"

    except requests.exceptions.RequestException:
        # If a connection error occurs, the status remains "DOWN"
        pass

    return status_info

if __name__ == "__main__":
    # Exit if Firebase connection failed
    if not db:
        exit()

    print("\n--- Starting website status check and save to Firebase ---")

    for site_url in SITES_TO_CHECK:
        result = check_site_status(site_url)

        # --- NEW PART: Write to Firestore ---
        try:
            # Adds a new document to the 'status_logs' collection
            db.collection('status_logs').add(result)
            print(f"  - {result['url']}: {result['status']} ({result['response_time_ms']}ms) -> Data saved.")
        except Exception as e:
            print(f"  - {result['url']}: ERROR saving to Firebase: {e}")
        # -----------------------------------------

    print("--- Check complete ---")