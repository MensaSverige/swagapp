import React from "react";
import { faMapLocationDot, faCalendarDays, faAddressCard } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";

export interface TabBarIconProps {
    focused: boolean;
    color: string;
    size: number;
  }

export const MapIcon: React.FC<TabBarIconProps> = ({ color, size }) => (
  <FontAwesomeIcon color={color} size={size} icon={faMapLocationDot} />
);

export const CalendarIcon: React.FC<TabBarIconProps> = ({ color, size }) => (
  <FontAwesomeIcon color={color} size={size} icon={faCalendarDays} />
);

export const ProfileIcon: React.FC<TabBarIconProps> = ({ color, size }) => (
  <FontAwesomeIcon color={color} size={size} icon={faAddressCard} />
);

