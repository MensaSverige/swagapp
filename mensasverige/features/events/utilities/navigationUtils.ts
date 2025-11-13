import { router } from 'expo-router';
import { EventFilterOptions } from '../store/EventsSlice';
import { Event } from '../../../api_schema/types';

/**
 * Creates date range for last minute events (next 2 hours)
 */
export const getLastMinuteDateRange = () => {
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    return { now, twoHoursFromNow };
};



/**
 * Navigates to the schedule screen with filter parameters
 */
export const navigateToScheduleWithFilter = (filter: EventFilterOptions) => {
    const params: Record<string, string> = {};
    
    // Convert filter to URL params - only include non-null values
    Object.entries(filter).forEach(([key, value]) => {
        if (value === null || value === undefined) return;
        
        if (key === 'categories' && Array.isArray(value) && value.length > 0) {
            params[key] = value.join(',');
        } else if (typeof value === 'boolean') {
            params[key] = String(value);
        } else if (key === 'dateFrom' || key === 'dateTo') {
            if (value instanceof Date) {
                params[key] = value.toISOString();
            }
        }
    });
    
    router.push({ pathname: '/(tabs)/(events)', params });
};

// Convenience functions
export const navigateToAttendingEvents = () => navigateToScheduleWithFilter({ attendingOrHost: true, bookable: null, official: null, categories: [] });
export const navigateToBookableEvents = () => navigateToScheduleWithFilter({ attendingOrHost: null, bookable: true, official: null, categories: [] });
export const navigateToOfficialEvents = () => navigateToScheduleWithFilter({ attendingOrHost: null, bookable: null, official: true, categories: [] });
export const navigateToLastMinuteEvents = () => {
    const { now, twoHoursFromNow } = getLastMinuteDateRange();
    
    return navigateToScheduleWithFilter({ 
        attendingOrHost: null, 
        bookable: true, // Only show bookable events for last minute
        official: null, 
        categories: [],
        dateFrom: now,
        dateTo: twoHoursFromNow
    });
};