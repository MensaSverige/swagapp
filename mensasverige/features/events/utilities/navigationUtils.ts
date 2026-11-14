import { router } from 'expo-router';
import { EventFilterOptions } from '../store/EventsSlice';

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

/** A member's bookings: someone else's with `userId`, those on one main event with `parent`. */
export const navigateToUserEvents = ({ userId, parent }: { userId?: number; parent?: string } = {}) => {
    const params: Record<string, string> = {};
    if (userId) params.userId = String(userId);
    if (parent) params.parent = parent;
    router.push({ pathname: '/events/user-events', params });
};