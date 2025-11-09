/**
 * Utility functions for formatting time and date values
 */

/**
 * Formats a datetime string to display time in Swedish locale format (HH:MM)
 * @param dateTimeString - The datetime string to format
 * @returns Formatted time string or the original string if parsing fails
 */
export const DisplayTime = (dateTimeString: string): string => {
    try {
        const date = new Date(dateTimeString);
        return date.toLocaleTimeString('sv-SE', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
    } catch (error) {
        return dateTimeString; // fallback to original string if parsing fails
    }
};