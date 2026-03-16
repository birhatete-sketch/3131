import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('customerToken');
            const saved = localStorage.getItem('customerData');
            if (token) {
                try {
                    if (saved) setCustomer(JSON.parse(saved));
                    // Fetch fresh profile in background
                    const { data } = await authAPI.getProfile();
                    if (data && data.customer) {
                        setCustomer(data.customer);
                        localStorage.setItem('customerData', JSON.stringify(data.customer));
                    }
                } catch (e) {
                    const status = e?.response?.status;
                    // Token süresi dolmuş veya müşteri bulunamıyorsa sessizce çıkış yap
                    if (status === 401 || status === 404) {
                        localStorage.removeItem('customerToken');
                        localStorage.removeItem('customerData');
                        setCustomer(null);
                    } else {
                        console.error('Failed to update profile silently', e);
                    }
                }
            }
            setLoading(false);
        };
        loadUser();
    }, []);

    const login = async (email, password) => {
        const { data } = await authAPI.login({ email, password });
        if (data.success) {
            localStorage.setItem('customerToken', data.token);
            localStorage.setItem('customerData', JSON.stringify(data.customer));
            setCustomer(data.customer);
        }
        return data;
    };

    const register = async (formData) => {
        const { data } = await authAPI.register(formData);
        if (data.success) {
            localStorage.setItem('customerToken', data.token);
            localStorage.setItem('customerData', JSON.stringify(data.customer));
            setCustomer(data.customer);
        }
        return data;
    };

    const googleLogin = async (credential, clientId) => {
        const { data } = await authAPI.googleLogin({ credential, clientId });
        if (data.success) {
            localStorage.setItem('customerToken', data.token);
            localStorage.setItem('customerData', JSON.stringify(data.customer));
            setCustomer(data.customer);
        }
        return data;
    };

    const logout = async () => {
        try { await authAPI.logout(); } catch { }
        localStorage.removeItem('customerToken');
        localStorage.removeItem('customerData');
        setCustomer(null);
    };

    const updateCustomer = (newData) => {
        const updated = { ...customer, ...newData };
        setCustomer(updated);
        localStorage.setItem('customerData', JSON.stringify(updated));
    };

    const isLoggedIn = !!customer;

    return (
        <AuthContext.Provider value={{ customer, loading, isLoggedIn, login, register, googleLogin, logout, updateCustomer }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
