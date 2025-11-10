import { router } from 'expo-router';
import { EventFilterOptions } from '../components/EventFilter';

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
        }
    });
    
    router.push({ pathname: '/(tabs)/schedule', params });
};

// Convenience functions
export const navigateToAttendingEvents = () => navigateToScheduleWithFilter({ attending: true, bookable: null, official: null, categories: [] });
export const navigateToBookableEvents = () => navigateToScheduleWithFilter({ attending: null, bookable: true, official: null, categories: [] });
export const navigateToOfficialEvents = () => navigateToScheduleWithFilter({ attending: null, bookable: null, official: true, categories: [] });