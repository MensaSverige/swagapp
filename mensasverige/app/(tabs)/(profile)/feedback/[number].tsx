import FeedbackDetail from "@/features/account/screens/FeedbackDetail";
import AuthGuard from "@/components/AuthGuard";

const FeedbackDetailWithGuard = () => (
  <AuthGuard>
    <FeedbackDetail />
  </AuthGuard>
);

export default FeedbackDetailWithGuard;
