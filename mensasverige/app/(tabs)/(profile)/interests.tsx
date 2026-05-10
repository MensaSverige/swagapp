import AuthGuard from '@/components/AuthGuard';
import InterestsSettings from '@/features/account/screens/InterestsSettings';

export default function InterestsScreen() {
  return (
    <AuthGuard>
      <InterestsSettings />
    </AuthGuard>
  );
}
