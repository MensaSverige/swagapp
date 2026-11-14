import { StyleSheet } from 'react-native';
import { Colors } from '../../../constants/Colors';
import { BUTTON_HEIGHT, EVENT_HEADER_BG, themeColors, typeScale } from './typeScale';

/**
 * Shared styles for the activity form (CreateEventCard) and UserList
 * These styles are used for displaying event information in both read and edit modes
 */
export const createEventCardStyles = (colorScheme: string) => {
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const { link } = themeColors(colorScheme === 'dark');
  
  return StyleSheet.create({
  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.coolGray200,
    marginBottom: 16,
  },

  // Typography styles
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.blueGray500,
    marginBottom: 4,
  },
  

  // Hosts and attendees
  hostsSection: {
    marginBottom: 12,
  },

  // UserList styles
  userListHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  titleCount: {
    fontWeight: '400',
    color: themeColors(colorScheme === 'dark').meta,
  },
  viewAllText: {
    ...typeScale.link,
    color: link,
  },
  userListContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  userListGridItem: {
    width: '50%',
    paddingBottom: 8,
    paddingRight: 8,
  },
  compactAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  compactAvatarRing: {
    padding: 2,
    borderRadius: 999,
  },
  compactOverflowBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactOverflowText: {
    fontSize: 16,
    fontWeight: '600' as const,
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
    minHeight: BUTTON_HEIGHT,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: EVENT_HEADER_BG,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: link,
  },
  cancelButtonText: {
    color: link,
  },
  });
};

// Backward compatibility - keep the old export names as functions that default to light theme
export const eventCardStyles = createEventCardStyles('light');

// Export individual style objects for granular imports
export { eventCardStyles as default };