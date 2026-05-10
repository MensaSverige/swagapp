import { useLocalSearchParams } from 'expo-router';
import AuthGuard from '@/components/AuthGuard';
import PublicUserProfile from '@/features/account/screens/PublicUserProfile';

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  return (
    <AuthGuard>
      <PublicUserProfile userId={Number(userId)} />
    </AuthGuard>
  );
}
