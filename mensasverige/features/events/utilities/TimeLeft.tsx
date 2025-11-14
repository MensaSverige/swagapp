import { Text } from "react-native";
import React from 'react';

export const timeUntil = (
  comparedTo: Date,
  dateTimeStr: string,
  long: boolean = false,
) => {
  const dateTime = new Date(dateTimeStr);

  const diff = Math.abs(dateTime.getTime() - comparedTo.getTime());

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  if (!long) {
    if (days > 0) {
      return `${days} ${days > 1 ? 'dagar' : 'dag'}`;
    } else if (hours > 0) {
      return `${hours} ${hours !== 1 ? 'timmar' : 'timme'}`;
    } else if (minutes > 0) {
      return `${minutes} ${minutes !== 1 ? 'minuter' : 'minut'}`;
    } else {
      return `${seconds} ${seconds !== 1 ? 'sekunder' : 'sekund'}`;
    }
  } else {
    // Show all units that are not zero
    let timeLeft = '';
    if (days !== 0) {
      timeLeft += `${days} ${days > 1 ? 'dagar' : 'dag'}`;
    }
    if (hours > 0) {
      timeLeft += `${timeLeft === '' ? '' : ', '}${hours} ${hours !== 1 ? 'timmar' : 'timme'}`;
    }
    if (minutes > 0) {
      timeLeft += `${timeLeft === '' ? '' : ', '}${minutes} ${minutes !== 1 ? 'minuter' : 'minut'}`;
    }
    if (hours === 0 && minutes < 10) {
      timeLeft += `${timeLeft === '' ? '' : ', '}${seconds} ${seconds !== 1 ? 'sekunder' : 'sekund'}`;
    }
    return timeLeft;
  }
};

const TimeLeft: React.FC<{
  comparedTo: Date;
  start: string;
  end?: string;
  long?: boolean;
}> = ({ comparedTo, start, end, long }) => {
  let text = '';
  if (new Date(start) > new Date()) {
    text = `om ${timeUntil(comparedTo, start, long ?? false)}`;
  } else if (end) {
    text = `slutar om ${timeUntil(comparedTo, end, long ?? false)}`;
  } else {
    // Show how long ago the event started
    text = `${timeUntil(comparedTo, start)} sedan`;
  }
  return <Text>{text}</Text>;
};

export default TimeLeft;
