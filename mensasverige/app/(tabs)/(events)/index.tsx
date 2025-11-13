import ActivitiesList from "@/features/events/screens/ActivitiesList";
import AuthGuard from "@/components/AuthGuard";

const ActivitiesWithGuard = () => (
  <AuthGuard>
    <ActivitiesList />
  </AuthGuard>
);

export default ActivitiesWithGuard;