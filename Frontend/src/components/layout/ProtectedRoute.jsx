import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { FullPageSpinner } from '@/components/ui/LoadingSpinner';
import { canAccess } from '@/lib/permissions';

export default function ProtectedRoute({ module, children }) {
    const { session, profile, loading } = useAuth();

    if (loading) {
        return <FullPageSpinner />;
    }

    if (!session) {
        return <Navigate to="/login" replace />;
    }

    if (!profile) {
        return <FullPageSpinner />;
    }

    if (module && !canAccess(profile.role, module)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}
