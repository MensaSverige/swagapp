export function clockForTime(time: string | Date) {
  if (typeof time !== 'string') {
    time = time.toISOString();
  }
  if (!time) {
    return '🕛';
  }
  return [
    '🕛',
    '🕐',
    '🕑',
    '🕒',
    '🕓',
    '🕔',
    '🕕',
    '🕖',
    '🕗',
    '🕘',
    '🕙',
    '🕚',
  ][parseInt(time.split(':')[0], 10) % 12];
}
