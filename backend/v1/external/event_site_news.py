from datetime import datetime
import json
import logging
from typing import List
import requests
from fastapi import HTTPException
from v1.external.event_api import get_external_root
from v1.db.models.event_site_news import EventSiteNews
from v1.utilities import convert_string_to_datetime
from v1.env_constants import EVENT_API_TOKEN


def get_event_site_news(url: str|bool) -> list[EventSiteNews]:

    if not url:
        logging.info("No external root URL provided, fetching from external API")
        root = get_external_root()
        url = root.restUrl

    parameters = {
        'operation': 'news',
        'token': EVENT_API_TOKEN,
    }
    headers = {'Content-Type': 'application/json'}
    response = requests.post(url,
                             json=parameters,
                             headers=headers,
                             verify=False)
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    try:
        response_json = response.json()
        news = response_json['news']
        validated_news: List[EventSiteNews] = []
        for n in news:
            try:
                news_json = json.dumps(n)
                validated = EventSiteNews.model_validate_json(news_json)

                newsdate = convert_string_to_datetime(validated.date)

                # Convert time string to time object
                newsTime = datetime.strptime(validated.time, '%H:%M').time()

                # Overwrite date with compined newsDate and startTime
                validated.date = datetime.combine(newsdate, newsTime)

                validated_news.append(validated)

            except Exception as e:
                logging.error(f"Failed to validate news: {e}")
    except Exception as e:
        logging.error(f"Failed to validate external news details: {e}")
        return

    logging.info(f"Validated news: {validated}")

    return validated_news
