import { StyleSheet } from 'react-native';

/**
 * Shared styles for event card components (UnifiedEventCard and CreateEventCard)
 * These styles are used for displaying event information in both read and edit modes
 */
export const eventCardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },

  // Typography styles
  heading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 0,
    color: '#111827',
  },
  subHeading: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#111827',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },

  // Header and content styles
  headingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  locationText: {
    fontSize: 14,
    color: '#6B7280',
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
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    minWidth: 60,
  },
  statusText: {
    fontSize: 14,
    color: '#374151',
  },
  cancelledText: {
    color: '#DC2626',
    fontWeight: '600',
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
  attendeesList: {
    marginTop: 4,
  },
  attendeeText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  moreAttendeesText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
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
  linkText: {
    fontSize: 14,
    color: '#2563EB',
    textDecorationLine: 'underline',
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Attending buttons
  attendingButtonContainer: {
    marginTop: 16,
  },
  attendingButton: {
    backgroundColor: '#0F766E',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  unattendButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },

  // Edit mode styles
  editModeContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },

  // Component-specific button colors
  createButton: {
    backgroundColor: '#0d9488',
  },
  cancelButton: {
    backgroundColor: '#64748b',
  },
});

/**
 * Editable field styles that extend the base styles
 */
export const editableFieldStyles = StyleSheet.create({
  editableInputHeading: {
    fontSize: 18,
    fontWeight: '600',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

/**
 * Date and time display styles
 */
export const dateTimeStyles = StyleSheet.create({
  dateText: {
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 18,
    marginBottom: 0,
    color: '#374151',
  },
  timeText: {
    fontSize: 14,
    color: '#0F766E',
    marginBottom: 12,
    paddingTop: 2,
  },
});

// Export individual style objects for granular imports
export { eventCardStyles as default };