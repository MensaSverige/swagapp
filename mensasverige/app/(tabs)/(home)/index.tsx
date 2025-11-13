import WelcomeScreen from "@/features/common/screens/WelcomeScreen";
import AuthGuard from "@/components/AuthGuard";

const WelcomeWithGuard = () => (
  <AuthGuard>
    <WelcomeScreen />
  </AuthGuard>
);

export default WelcomeWithGuard;