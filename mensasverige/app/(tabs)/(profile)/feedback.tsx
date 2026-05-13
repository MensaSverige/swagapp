import Feedback from "@/features/account/screens/Feedback";
import AuthGuard from "@/components/AuthGuard";

const FeedbackWithGuard = () => (
  <AuthGuard>
    <Feedback />
  </AuthGuard>
);

export default FeedbackWithGuard;
