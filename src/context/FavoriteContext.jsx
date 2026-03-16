import { createContext, useContext, useState, useEffect } from 'react';
import { favoritesAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

export const FavoriteContext = createContext();

export const FavoriteProvider = ({ children }) => {
    const { isLoggedIn } = useAuth();
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadFavorites = async () => {
        try {
            const res = await favoritesAPI.getAll();
            if (res.data.success) {
                setFavorites(res.data.favorites || []);
            }
        } catch (error) {
            console.error('Favorites load error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            loadFavorites();
        } else {
            setFavorites([]);
            setLoading(false);
        }
    }, [isLoggedIn]);

    const toggleFavorite = async (productId) => {
        const isFav = favorites.some(p => (p.productId || p._id || p) === productId);
        try {
            if (isFav) {
                const res = await favoritesAPI.remove(productId);
                if (res.data.success) {
                    setFavorites(prev => prev.filter(p => (p.productId || p._id || p) !== productId));
                    toast.success('Favorilerden çıkarıldı');
                }
            } else {
                const res = await favoritesAPI.add(productId);
                if (res.data.success) {
                    setFavorites(prev => [...prev, productId]);
                    toast.success('Favorilere eklendi');
                }
            }
        } catch (error) {
            toast.error('İşlem başarısız');
        }
    };

    const isFavorite = (productId) => {
        return favorites.some(p => (p.productId || p._id || p) === productId);
    };

    return (
        <FavoriteContext.Provider value={{ favorites, toggleFavorite, isFavorite, loading }}>
            {children}
        </FavoriteContext.Provider>
    );
};

export const useFavorites = () => useContext(FavoriteContext);
