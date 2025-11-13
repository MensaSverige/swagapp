import UserSettings from "@/features/account/screens/Settings";
import AuthGuard from "@/components/AuthGuard";

const SettingsWithGuard = () => (
  <AuthGuard>
    <UserSettings />
  </AuthGuard>
);

export default SettingsWithGuard;