import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, useColorScheme } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { LocationLinkButton } from '@/features/map/components/LocationLinkIcon';
import useStore from '@/features/common/store/store';
import { Event } from '../../../../api_schema/types';
import { AttendanceStatus, formatPlacesLeft, isMainEventSource, placesLeft } from '../../utils/eventAttendance';
import {
  formatMainEventDateRange,
  formatRegion,
  formatRelativeStart,
  getMainEventName,
  splitAddress,
} from '../../utils/mainEventUtils';
import { canonicalCategoryCode, getCategoryByCode } from '../../utilities/EventCategories';
import { DIVIDER_COLOR, EVENT_HEADER_BG, PAGE_PADDING, typeScale } from '../../styles/typeScale';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

interface EventInfoRowsProps {
  event: Event;
  status: AttendanceStatus;
  busy?: boolean;
  onUnregister?: () => void;
}

/**
 * The rows at the top of every event page: when, where (or which local
 * group), what it is part of, what kind of event and what it costs, and the
 * viewer's status. Stretches to the screen edges inside a PAGE_PADDING page.
 */
const EventInfoRows: React.FC<EventInfoRowsProps> = ({ event, status, busy = false, onUnregister }) => {
  const dark = useColorScheme() === 'dark';
  const styles = useMemo(() => createStyles(dark), [dark]);
  const mainEvents = useStore(s => s.mainEvents);
  const selectMainEvent = useStore(s => s.selectMainEvent);
  const bookingSiteUrl = useStore(s => s.eventInfo?.siteUrl);

  const iconGray = dark ? Colors.coolGray400 : '#4B5563';
  const green = dark ? Colors.green400 : '#047857';
  const red = dark ? Colors.red400 : '#B91C1C';
  const link = dark ? Colors.primary300 : EVENT_HEADER_BG;

  const relative = formatRelativeStart(event, Date.now());
  const region = formatRegion(event);
  const place = splitAddress(event.address, event.locationDescription);
  const placeText = place ? [place.line1, place.line2].filter(Boolean).join(', ') : null;
  const hasDirections = !!(event.address || (event.latitude && event.longitude));
  const parentName = event.parentEvent ? getMainEventName(mainEvents, event.parentEvent) : null;

  // Kind, price and places: activities only. A main event's price is in its description.
  const tags = event.tags ?? [];
  const category = tags.length > 0 ? getCategoryByCode(canonicalCategoryCode(tags[0])) : undefined;
  const priceText = (event.price ?? 0) > 0 ? `${event.price} kr` : null;
  const placesText = formatPlacesLeft(placesLeft(event));
  const showDetails = !isMainEventSource(event) && (tags.length > 0 || !!priceText || !!placesText);
  const detailsLine1 = tags.length > 0
    ? tags.map(t => t.text).join(', ')
    : (event.official ? 'Officiell aktivitet' : 'Medlemsaktivitet');
  const detailsLine2 = [tags.length > 0 && event.official ? 'Officiell' : null, priceText, placesText]
    .filter(Boolean).join(' · ');

  const openParent = () => {
    if (!event.parentEvent) return;
    selectMainEvent(event.parentEvent);
    router.navigate('/(tabs)/(home)');
  };

  const statusRow = (() => {
    const row = (icon: IconName, color: string, text: string, action?: React.ReactNode) => (
      <View style={[styles.row, action ? styles.rowWithAction : null]}>
        <MaterialIcons name={icon} size={22} color={color} style={styles.icon} />
        <ThemedText style={[styles.line1, styles.text, { color }]}>{text}</ThemedText>
        {action}
      </View>
    );
    switch (status.kind) {
      case 'attending':
        return row('check-circle', green, 'Du är anmäld', status.canLeave && onUnregister ? (
          <TouchableOpacity
            onPress={onUnregister}
            disabled={busy}
            style={styles.action}
            accessibilityRole="button"
            accessibilityLabel={`Avanmäl dig från ${event.name}`}
          >
            <ThemedText style={[styles.actionText, { color: link }, busy && styles.disabled]}>
              {busy ? 'Avanmäler...' : 'Avanmäl'}
            </ThemedText>
          </TouchableOpacity>
        ) : undefined);
      case 'host':
        return row('person', iconGray, 'Du är värd');
      case 'open':
        return row('info-outline', iconGray, 'Du är inte anmäld');
      case 'paid':
        return row('payments', iconGray, 'Anmälan och betalning på bokningssidan', bookingSiteUrl ? (
          <TouchableOpacity
            onPress={() => Linking.openURL(bookingSiteUrl)}
            style={styles.action}
            accessibilityRole="link"
          >
            <ThemedText style={[styles.actionText, { color: link }]}>Öppna</ThemedText>
          </TouchableOpacity>
        ) : undefined);
      case 'full':
        return row('event-busy', iconGray, 'Fullbokat');
      case 'closed':
        return row('event-busy', iconGray, 'Anmälan är stängd');
      case 'past':
        return row('history', iconGray, 'Evenemanget har varit');
      case 'cancelled':
        return row('cancel', red, 'Inställt');
    }
  })();

  return (
    <View style={styles.rows}>
      <View style={styles.row}>
        <MaterialIcons name="event" size={22} color={iconGray} style={styles.icon} />
        <View style={styles.text}>
          <ThemedText style={styles.line1}>{formatMainEventDateRange(event)}</ThemedText>
          {!!relative && <ThemedText style={styles.line2}>{relative}</ThemedText>}
        </View>
      </View>

      {(!!region || !!place) && (
        <View style={[styles.row, hasDirections && styles.rowWithAction]}>
          <MaterialIcons name={region ? 'groups' : 'place'} size={22} color={iconGray} style={styles.icon} />
          <View style={styles.text}>
            <ThemedText style={styles.line1}>{region ?? place?.line1}</ThemedText>
            {region ? (
              <ThemedText style={styles.line2}>{placeText ?? 'Ingen plats angiven'}</ThemedText>
            ) : (
              !!place?.line2 && <ThemedText style={styles.line2}>{place.line2}</ThemedText>
            )}
          </View>
          {hasDirections && (
            <View style={styles.directions}>
              <LocationLinkButton
                address={event.address ?? undefined}
                latitude={event.latitude ?? undefined}
                longitude={event.longitude ?? undefined}
              />
            </View>
          )}
        </View>
      )}

      {!!parentName && (
        <TouchableOpacity
          style={[styles.row, styles.rowWithAction]}
          onPress={openParent}
          accessibilityRole="link"
          accessibilityLabel={`Del av ${parentName}`}
        >
          <MaterialIcons name="flag" size={22} color={iconGray} style={styles.icon} />
          <View style={styles.text}>
            <ThemedText style={[styles.line1, { color: link }]}>{parentName}</ThemedText>
            <ThemedText style={styles.line2}>Del av</ThemedText>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={iconGray} style={styles.chevron} />
        </TouchableOpacity>
      )}

      {showDetails && (
        <View style={styles.row}>
          <MaterialIcons
            name={category?.icon ?? 'local-offer'}
            size={22}
            color={category?.color ?? iconGray}
            style={styles.icon}
          />
          <View style={styles.text}>
            <ThemedText style={styles.line1}>{detailsLine1}</ThemedText>
            {!!detailsLine2 && <ThemedText style={styles.line2}>{detailsLine2}</ThemedText>}
          </View>
        </View>
      )}

      {statusRow}
    </View>
  );
};

const createStyles = (dark: boolean) =>
  StyleSheet.create({
    rows: {
      marginHorizontal: -PAGE_PADDING,
      borderTopWidth: 1,
      borderTopColor: dark ? Colors.coolGray700 : DIVIDER_COLOR,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 56,
      paddingVertical: 10,
      paddingHorizontal: PAGE_PADDING,
      borderBottomWidth: 1,
      borderBottomColor: dark ? Colors.coolGray700 : DIVIDER_COLOR,
    },
    rowWithAction: {
      paddingRight: 8,
    },
    icon: {
      width: 22,
      marginRight: 14,
    },
    text: {
      flex: 1,
    },
    line1: {
      ...typeScale.body,
      color: dark ? Colors.coolGray100 : '#11181C',
    },
    line2: {
      ...typeScale.meta,
      color: dark ? Colors.coolGray400 : '#4B5563',
    },
    action: {
      minHeight: 44,
      paddingHorizontal: 8,
      justifyContent: 'center',
    },
    actionText: {
      ...typeScale.link,
    },
    disabled: {
      opacity: 0.5,
    },
    directions: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chevron: {
      marginRight: 2,
    },
  });

export default EventInfoRows;
