export const getFullUrl = (url: string): string => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  } else {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL?.endsWith('/') 
      ? process.env.EXPO_PUBLIC_API_URL.slice(0, -1) 
      : process.env.EXPO_PUBLIC_API_URL;
    const relativeUrl = url.startsWith('/') ? url.slice(1) : url;
    return `${apiUrl}/${relativeUrl}`;
  }
};