import MapScreen from "@/features/map/screens/MapScreen";
import AuthGuard from "@/components/AuthGuard";

const MapWithGuard = () => (
  <AuthGuard>
    <MapScreen />
  </AuthGuard>
);

export default MapWithGuard;