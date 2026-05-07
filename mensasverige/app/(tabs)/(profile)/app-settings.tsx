import AppSettings from "@/features/account/screens/AppSettings";
import AuthGuard from "@/components/AuthGuard";

const AppSettingsWithGuard = () => (
  <AuthGuard>
    <AppSettings />
  </AuthGuard>
);

export default AppSettingsWithGuard;
