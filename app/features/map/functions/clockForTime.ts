
export function clockForTime(time: string) {
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
