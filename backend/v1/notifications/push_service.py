import logging
import requests

EXPO_PUSH_URL = "https://exp.host/push/send"


def send_push_notifications(messages: list[dict]) -> None:
    if not messages:
        return
    for i in range(0, len(messages), 100):
        chunk = messages[i:i + 100]
        try:
            r = requests.post(
                EXPO_PUSH_URL,
                json=chunk,
                headers={"Content-Type": "application/json"},
                timeout=10,
            )
            r.raise_for_status()
            for item in r.json().get("data", []):
                if item.get("status") == "error":
                    logging.warning("Expo push error: %s", item)
        except Exception as e:
            logging.error("Push notification batch failed: %s", e)
