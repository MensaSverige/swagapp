import React, { Suspense } from 'react';
import { View } from 'react-native';

// Leaflet accesses `window` at module init — lazy-load so SSR never evaluates it.
const LeafletMapContent = React.lazy(() => import('./LeafletMapContent.web'));

const MapScreen: React.FC = () => (
  <Suspense fallback={<View style={{ flex: 1 }} />}>
    <LeafletMapContent />
  </Suspense>
);

export default MapScreen;
