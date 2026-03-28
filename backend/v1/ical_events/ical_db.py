"""Database layer for storing and retrieving iCalendar events in the unified events collection."""
from __future__ import annotations
import logging
from typing import List, Optional
from datetime import datetime
from v1.ical_events.ical_model import ICalEvent
from v1.events.events_model import Event, EventSource
from v1.events.events_mappers import map_ical_event
from v1.db.mongo import unified_events_collection


logger = logging.getLogger(__name__)


def store_ical_events(ical_events: List[ICalEvent], current_user_id: int = 0) -> int:
    """Store or update iCalendar events in the unified events collection.
    
    Args:
        ical_events: List of ICalEvent objects to store
        current_user_id: User ID for mapping context (default 0 for system)
        
    Returns:
        Number of events successfully stored/updated
    """
    stored_count = 0
    try:
        for ical_event in ical_events:
            # Map to unified Event model
            unified_event = map_ical_event(ical_event, current_user_id)
            event_dict = unified_event.model_dump()
            
            logger.debug(f"Storing iCalendar event: {event_dict['name']}")
            
            # Store with source + sourceId as unique key
            unified_events_collection.update_one(
                {
                    'source': EventSource.ical,
                    'sourceId': unified_event.sourceId
                },
                {'$set': event_dict},
                upsert=True
            )
            stored_count += 1
            
        logger.info(f"Successfully stored/updated {stored_count} iCalendar events in unified collection")
        return stored_count
        
    except Exception as e:
        logger.error(f"Failed to store iCalendar events: {e}")
        return stored_count


def get_all_unified_ical_events() -> List[Event]:
    """Retrieve all stored iCalendar events from the unified events collection.
    
    Returns:
        List of Event objects with source=ical
    """
    try:
        events = [
            Event(**event) for event in 
            unified_events_collection.find({'source': EventSource.ical})
        ]
        logger.info(f"Retrieved {len(events)} iCalendar events from unified collection")
        return events
    except Exception as e:
        logger.error(f"Failed to retrieve iCalendar events: {e}")
        return []


def get_unified_ical_events_since(start_date: datetime) -> List[Event]:
    """Retrieve iCalendar events starting from a specific date from unified collection.
    
    Args:
        start_date: The minimum start date for events
        
    Returns:
        List of Event objects with source=ical
    """
    try:
        events = [
            Event(**event) for event in 
            unified_events_collection.find({
                'source': EventSource.ical,
                'start': {'$gte': start_date}
            })
        ]
        logger.info(f"Retrieved {len(events)} iCalendar events since {start_date}")
        return events
    except Exception as e:
        logger.error(f"Failed to retrieve iCalendar events since {start_date}: {e}")
        return []


def delete_unified_ical_event(source_id: str) -> bool:
    """Delete an iCalendar event from unified collection by its source ID.
    
    Args:
        source_id: The original iCalendar UID
        
    Returns:
        True if deleted successfully, False otherwise
    """
    try:
        result = unified_events_collection.delete_one({
            'source': EventSource.ical,
            'sourceId': source_id
        })
        if result.deleted_count > 0:
            logger.info(f"Deleted iCalendar event with sourceId: {source_id}")
            return True
        logger.warning(f"No iCalendar event found with sourceId: {source_id}")
        return False
    except Exception as e:
        logger.error(f"Failed to delete iCalendar event with sourceId {source_id}: {e}")
        return False


def clear_all_unified_ical_events() -> int:
    """Delete all iCalendar events from the unified collection.
    
    Use with caution! This is mainly for testing or full refresh scenarios.
    
    Returns:
        Number of events deleted
    """
    try:
        result = unified_events_collection.delete_many({'source': EventSource.ical})
        logger.info(f"Cleared {result.deleted_count} iCalendar events from unified collection")
        return result.deleted_count
    except Exception as e:
        logger.error(f"Failed to clear iCalendar events: {e}")
        return 0
