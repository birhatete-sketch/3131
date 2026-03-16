import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function AuthGuard({ children, requireAuth = true }) {
    const { customer, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading) {
            if (requireAuth && !customer) {
                // Auth gerekli ama kullanıcı giriş yapmamış
                navigate('/login');
            } else if (!requireAuth && customer) {
                // Auth gerekli değil ama kullanıcı giriş yapmış (opsiyonel)
                // Bu durumda children'ı göster
            }
        }
    }, [customer, loading, requireAuth, navigate]);

    if (loading) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (requireAuth && !customer) {
        return null; // Navigate edecek
    }

    return children;
}