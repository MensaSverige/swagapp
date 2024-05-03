import { Linking, Platform } from "react-native";

export interface LocationLinkProps {
    displayName?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    landmark?: string;
    searchParameters?: string;
}


export const openLocation = ({ latitude, longitude, address, landmark, searchParameters }: LocationLinkProps) => {
    let query = '';
    if (landmark) {
        query += landmark;
    }
    if (searchParameters) {
        query += (query ? ', ' : '') + searchParameters;
    }
    if (address) {
        query += (query ? ', ' : '') + address;
    }
    if (!query) {
        query = `${latitude?.toString()},${longitude?.toString()}`;
    }
    const url = Platform.select({
        ios: `maps:0,0?q=${encodeURIComponent(query)}`,
        android: `geo:0,0?q=${encodeURIComponent(query)}`
    });
    if (!url) {
        return;
    }
    console.log('Opening location link:', url);
    Linking.openURL(url);
};