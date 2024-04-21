import { API_URL } from '@env';

export const getFullUrl = (url: string): string => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  } else {
    const apiUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    const relativeUrl = url.startsWith('/') ? url.slice(1) : url;
    return `${apiUrl}/${relativeUrl}`;
  }
};