import { StyleSheet } from 'react-native';
import { Colors } from '../../../constants/Colors';

/**
 * Shared styles for event card components (UnifiedEventCard and CreateEventCard)
 * These styles are used for displaying event information in both read and edit modes
 */
export const createEventCardStyles = (colorScheme: string) => {
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  
  return StyleSheet.create({
  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.coolGray200,
    marginBottom: 16,
  },

  // Typography styles
  subHeading: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: colors.coolGray900,
  },
  detailText: {
    fontSize: 14,
    color: colors.coolGray700,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.blueGray500,
    marginBottom: 4,
  },
  
  // Image styles
  eventImage: {
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },

  // Location styles
  locationSection: {
    marginBottom: 12,
  },

  // Event status and info
  eventStatusSection: {
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  // Tags and categories
  tagsSection: {
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },

  // Hosts and attendees
  hostsSection: {
    marginBottom: 12,
  },
  attendeesSection: {
    marginBottom: 12,
  },

  // Links
  linksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 10,
  },
  linkButton: {
    marginRight: 12,
    marginBottom: 8,
  },

  // Additional styles for UnifiedEventCard
  titleContainer: {
    marginBottom: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  statusLabelMinWidth: {
    minWidth: 60,
  },
  attendeeItem: {
    marginBottom: 2,
  },
  attendeesMoreText: {
    fontStyle: 'italic',
    marginTop: 4,
  },

  // Admin styles
  adminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  adminInfo: {
    flex: 1,
    marginLeft: 8,
  },

  // Button styles
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },

  // Attending buttons
  attendingButtonContainer: {
    marginTop: 16,
  },
  attendingButton: {
    backgroundColor: colors.teal700,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  unattendButton: {
    backgroundColor: colors.red600,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },

  // Edit mode styles
  editEventContainer: {
    marginTop: 40,
  },
  editModeContainer: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },

  // Component-specific button colors
  createButton: {
    backgroundColor: colors.teal600,
  },
  cancelButton: {
    backgroundColor: colors.blueGray500,
  },
  });
};

// Backward compatibility - keep the old export names as functions that default to light theme
export const eventCardStyles = createEventCardStyles('light');

// Export individual style objects for granular imports
export { eventCardStyles as default };