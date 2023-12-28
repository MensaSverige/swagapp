import {Text} from 'native-base';
import React from 'react';

const timeUntil = (
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
      return `${days}d`;
    } else if (hours > 0) {
      return `${hours}t`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  } else {
    // Show all units that are not zero
    let timeLeft = '';
    if (days !== 0) {
      timeLeft += `${days} dag${days > 1 ? 'ar' : ''}`;
    }
    if (hours > 0) {
      timeLeft += `${timeLeft === '' ? '' : ', '}${hours} timma${
        hours !== 1 ? 'r' : ''
      }`;
    }
    if (minutes > 0) {
      timeLeft += `${timeLeft === '' ? '' : ', '}${minutes} minut${
        minutes !== 1 ? 'er' : ''
      }`;
    }
    if (hours === 0 && minutes < 10) {
      timeLeft += `${timeLeft === '' ? '' : ', '}${seconds} sekund${
        seconds !== 1 ? 'er' : ''
      }`;
    }
    return timeLeft;
  }
};

const TimeLeft: React.FC<{
  comparedTo: Date;
  start: string;
  end?: string;
  long?: boolean;
}> = ({comparedTo, start, end, long}) => {
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
