import React from 'react';
import useStore from '@/features/common/store/store';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * AuthGuard component ensures that children are only rendered when user is authenticated.
 * This prevents hooks count mismatches by ensuring components with hooks are either
 * fully rendered (with all hooks) or not rendered at all (with no hooks).
 */
const AuthGuard: React.FC<AuthGuardProps> = ({ children, fallback = null }) => {
  const { user } = useStore();
  
  // Only render children if user is authenticated
  if (!user) {
    return fallback as React.ReactElement;
  }
  
  return children as React.ReactElement;
};

export default AuthGuard;