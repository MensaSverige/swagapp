import PrivacySettings from "@/features/account/screens/PrivacySettings";
import AuthGuard from "@/components/AuthGuard";

const PrivacyWithGuard = () => (
  <AuthGuard>
    <PrivacySettings />
  </AuthGuard>
);

export default PrivacyWithGuard;
