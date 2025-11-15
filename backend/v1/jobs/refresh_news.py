from v1.external.event_api import get_external_root
from v1.external.event_site_news import get_event_site_news
import logging

def refresh_external_news():
    root = get_external_root()
    if not root or not root.restUrl:
        logging.error("Failed to fetch external root or missing restUrl.")
        return

    get_event_site_news(root.restUrl)