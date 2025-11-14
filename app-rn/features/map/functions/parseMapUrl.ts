import { LocationLinkProps } from "./openLocation";

export const parseMapUrl = (mapUrl: string): LocationLinkProps => {
    try {
      const coordinatesRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
      const coordinatesMatch = mapUrl.match(coordinatesRegex);
      const latitude = coordinatesMatch ? parseFloat(coordinatesMatch[1]) : undefined;
      const longitude = coordinatesMatch ? parseFloat(coordinatesMatch[2]) : undefined;
  
      const placeRegex = /maps\/place\/([^/]+)\//;
      const placeMatch = mapUrl.match(placeRegex);
      const landmark = placeMatch ? decodeURIComponent(placeMatch[1]) : undefined;
  
      const searchParametersRegex = /maps\/search\/([^/]+)\//;
      const searchParametersMatch = mapUrl.match(searchParametersRegex);
      const searchParameters = searchParametersMatch ? decodeURIComponent(searchParametersMatch[1]) : undefined;
  
      return { latitude, longitude, landmark, searchParameters };
    } catch (error) {
      console.error('Failed to parse map URL:', error);
      return {};
    }
  };