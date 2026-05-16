// Web stub for react-native-maps — native components can't run in the browser.
// MapScreen.web.tsx uses Leaflet instead; this stub prevents Metro from choking
// on codegenNativeComponent when bundling shared type/util files for web.
import React from 'react';
import { View } from 'react-native';

const noop = () => null;

const MapView = ({ children, style }) =>
  React.createElement(View, { style }, children);

const Marker = ({ children }) => React.createElement(View, null, children);
const Callout = ({ children }) => React.createElement(View, null, children);
const Polyline = noop;
const Polygon = noop;
const Circle = noop;
const Overlay = noop;
const Heatmap = noop;
const Geojson = noop;

export default MapView;
export {
  MapView,
  Marker,
  Callout,
  Polyline,
  Polygon,
  Circle,
  Overlay,
  Heatmap,
  Geojson,
};
export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = null;
