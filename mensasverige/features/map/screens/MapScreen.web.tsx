import 'leaflet/dist/leaflet.css';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

import useStore from '../../common/store/store';
import useRequestLocationPermission from '../hooks/useRequestLocationPermission';
import useGetUsersShowingLocation from '../hooks/useGetUsersShowingLocation';
import ContactCard from '../components/ContactCard';
import { UserListPanel } from '../components/UserListPanel';
import IncognitoInfo from '../components/IncognitoInfo';
import { ThemedView } from '@/components/ThemedView';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import UserWithLocation from '../types/userWithLocation';
import { getFullUrl } from '@/features/common/functions/GetFullUrl';
import { defaultFilter } from '../store/LocationSlice';

// Fix leaflet's default icon paths broken by bundlers (browser-only, guarded for SSR)
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

const ZOOM_DELTA = 0.005;
const INITIAL_ZOOM = 14;

function latDeltaToZoom(latitudeDelta: number): number {
  return Math.min(18, Math.max(1, Math.round(Math.log2(360 / latitudeDelta))));
}

// ─── custom divIcon factory ───────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  online: '#22c55e',
  away: '#f59e0b',
  offline: '#9ca3af',
};

function getInitials(firstName?: string | null, lastName?: string | null): string {
  const f = (firstName ?? '').trim().charAt(0).toUpperCase();
  const l = (lastName ?? '').trim().charAt(0).toUpperCase();
  return (f + l) || '?';
}

function createUserIcon(user: UserWithLocation, highlighted: boolean): L.DivIcon {
  const size = highlighted ? 48 : 40;
  const ring = highlighted ? 3 : 2;
  const statusColor = statusColors[user.onlineStatus] ?? '#9ca3af';
  const ringColor = highlighted ? Colors.primary300 : '#ffffff';

  const avatarUrl = user.avatar_url ? getFullUrl(user.avatar_url) : null;

  const inner = avatarUrl
    ? `<img src="${avatarUrl}"
            style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;"
            onerror="this.style.display='none';this.parentElement.querySelector('.initials').style.display='flex';"
        />
        <span class="initials" style="display:none;position:absolute;inset:0;align-items:center;justify-content:center;
          font-size:${Math.round(size * 0.34)}px;font-weight:700;color:#fff;font-family:system-ui,sans-serif;">
          ${getInitials(user.firstName, user.lastName)}
        </span>`
    : `<span class="initials" style="display:flex;position:absolute;inset:0;align-items:center;justify-content:center;
         font-size:${Math.round(size * 0.34)}px;font-weight:700;color:#fff;font-family:system-ui,sans-serif;">
         ${getInitials(user.firstName, user.lastName)}
       </span>`;

  const html = `
    <div style="
      position:relative;
      width:${size}px;
      height:${size}px;
      border-radius:50%;
      border:${ring}px solid ${ringColor};
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
      background:${Colors.primary300};
      overflow:hidden;
      box-sizing:border-box;
      cursor:pointer;
    ">
      ${inner}
    </div>
    <div style="
      position:absolute;
      bottom:-2px;
      right:0px;
      width:${Math.round(size * 0.28)}px;
      height:${Math.round(size * 0.28)}px;
      border-radius:50%;
      background:${statusColor};
      border:2px solid #fff;
      box-shadow:0 1px 3px rgba(0,0,0,0.3);
    "></div>
  `;

  return L.divIcon({
    html,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
}

// ─── Inner components that need map context ───────────────────────────────────

function MapClickHandler({ onClick }: { onClick: () => void }) {
  useMapEvents({ click: onClick });
  return null;
}

function FlyToUser({ user }: { user: UserWithLocation | null }) {
  const map = useMap();
  const prevUserId = useRef<number | string | null>(null);

  useEffect(() => {
    if (user && user.userId !== prevUserId.current) {
      prevUserId.current = user.userId;
      map.flyTo([user.location.latitude, user.location.longitude], Math.max(map.getZoom(), 15), {
        animate: true,
        duration: 0.4,
      });
    }
    if (!user) {
      prevUserId.current = null;
    }
  }, [user, map]);

  return null;
}

function FitBoundsOnLoad({ users, done }: { users: UserWithLocation[]; done: boolean }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (fitted.current || done || users.length === 0) return;
    fitted.current = true;

    if (users.length === 1) {
      map.setView([users[0].location.latitude, users[0].location.longitude], 14);
      return;
    }

    const lats = users.map(u => u.location.latitude);
    const lngs = users.map(u => u.location.longitude);
    map.fitBounds(
      [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]],
      { padding: [40, 40], maxZoom: 16, animate: true },
    );
  }, [users, done, map]);

  return null;
}

// ─── Main component ───────────────────────────────────────────────────────────

const MapScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const colorMode = colorScheme ?? 'light';
  const isDark = colorMode === 'dark';

  const { region, filteredUsers, selectedUser, setSelectedUser, userFilter } = useStore();

  const [showContactCard, setShowContactCard] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [hasFitted, setHasFitted] = useState(false);

  useRequestLocationPermission();
  useGetUsersShowingLocation();

  const initialCenter: [number, number] = [region.latitude, region.longitude];
  const initialZoom = latDeltaToZoom(region.latitudeDelta ?? 0.002);

  const onClose = useCallback(() => {
    setShowContactCard(false);
    setSelectedUser(null);
  }, [setSelectedUser]);

  const focusOnUser = useCallback((u: UserWithLocation) => {
    setSelectedUser(u);
    setShowContactCard(true);
    setShowUserList(false);
  }, [setSelectedUser]);

  const handleMapClick = useCallback(() => {
    setShowContactCard(false);
    setSelectedUser(null);
  }, [setSelectedUser]);

  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const tileAttribution = isDark
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  const markers = useMemo(() =>
    filteredUsers.map(u => (
      <Marker
        key={u.userId}
        position={[u.location.latitude, u.location.longitude]}
        icon={createUserIcon(u, selectedUser?.userId === u.userId)}
        zIndexOffset={selectedUser?.userId === u.userId ? 1000 : 0}
        eventHandlers={{
          click: (e) => {
            e.originalEvent.stopPropagation();
            focusOnUser(u);
          },
        }}
      />
    )),
    [filteredUsers, selectedUser, focusOnUser],
  );

  const buttonBg = isDark ? '#1f2937' : '#ffffff';

  const filterActive = userFilter.showHoursAgo !== defaultFilter.showHoursAgo;

  return (
    <ThemedView style={styles.root}>
      {/* Map fills the background */}
      <View style={styles.mapWrapper}>
        <MapContainer
          center={initialCenter}
          zoom={initialZoom}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
        >
          <TileLayer url={tileUrl} attribution={tileAttribution} />

          <MapClickHandler onClick={handleMapClick} />
          <FlyToUser user={showContactCard ? selectedUser : null} />
          <FitBoundsOnLoad users={filteredUsers} done={hasFitted} />

          {markers}
        </MapContainer>
      </View>

      {/* Controls overlay */}
      <View style={[styles.controls, { right: 10, top: 50 }]}>
        <TouchableOpacity
          style={[styles.controlBtn, { backgroundColor: buttonBg }]}
          onPress={() => setShowUserList(true)}
        >
          <MaterialIcons
            name="filter-list"
            size={30}
            color={(showUserList || filterActive) ? Colors.primary300 : Colors.coolGray400}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlBtn, { backgroundColor: buttonBg }]}
          onPress={() => {
            setHasFitted(false);
            // reset so FitBoundsOnLoad fires again
            setTimeout(() => setHasFitted(false), 0);
          }}
        >
          <MaterialIcons name="zoom-out-map" size={30} color={Colors.coolGray400} />
        </TouchableOpacity>
      </View>

      {/* UserListPanel */}
      <UserListPanel
        visible={showUserList}
        onClose={() => setShowUserList(false)}
        onFilterApplied={() => setShowUserList(false)}
        onUserPress={(u) => {
          setShowUserList(false);
          focusOnUser(u);
        }}
      />

      {/* ContactCard */}
      {selectedUser && (
        <ContactCard
          key={`${selectedUser.userId}-${colorMode}`}
          user={selectedUser}
          showCard={showContactCard}
          onClose={onClose}
        />
      )}

      <IncognitoInfo />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  mapWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  controls: {
    position: 'absolute',
    zIndex: 1,
    flexDirection: 'column',
    gap: 10,
    width: 50,
  },
  controlBtn: {
    borderRadius: 10,
    shadowColor: 'black',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MapScreen;
