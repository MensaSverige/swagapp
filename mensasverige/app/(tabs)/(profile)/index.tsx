import UserProfile from "@/features/account/screens/UserProfile";
import AuthGuard from "@/components/AuthGuard";

const ProfileWithGuard = () => (
  <AuthGuard>
    <UserProfile />
  </AuthGuard>
);

export default ProfileWithGuard;
