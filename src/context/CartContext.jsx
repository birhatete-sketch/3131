import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI } from '../services/api';
import toast from 'react-hot-toast';

export const CartContext = createContext(null);

export function CartProvider({ children }) {
    const [cart, setCart] = useState([]);
    const [cartTotal, setCartTotal] = useState(0);
    const [cartCount, setCartCount] = useState(0);
    const [loading, setLoading] = useState(false);
    // Kupon bilgisi — sayfa geçişlerinde kaybolmaması için context'te tutuluyor
    const [couponData, setCouponData] = useState(() => {
        try {
            const saved = sessionStorage.getItem('appliedCoupon');
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    });
    const [couponDiscount, setCouponDiscount] = useState(() => {
        try {
            const saved = sessionStorage.getItem('couponDiscount');
            return saved ? parseFloat(saved) : 0;
        } catch { return 0; }
    });

    const applyCoupon = (coupon, discount) => {
        setCouponData(coupon);
        setCouponDiscount(discount);
        sessionStorage.setItem('appliedCoupon', JSON.stringify(coupon));
        sessionStorage.setItem('couponDiscount', String(discount));
    };

    const removeCoupon = () => {
        setCouponData(null);
        setCouponDiscount(0);
        sessionStorage.removeItem('appliedCoupon');
        sessionStorage.removeItem('couponDiscount');
    };

    const fetchCart = useCallback(async () => {
        try {
            const { data } = await cartAPI.get();
            if (data.success) {
                setCart(data.cart || []);
                setCartTotal(data.total || 0);
                setCartCount((data.cart || []).reduce((a, i) => a + (i.quantity || 1), 0));
            }
        } catch (e) { /* silent */ }
    }, []);

    useEffect(() => { fetchCart(); }, [fetchCart]);

    const addToCart = async (productId, quantity = 1, variant) => {
        setLoading(true);
        try {
            const { data } = await cartAPI.add(productId, quantity, variant);
            if (data.success) {
                toast.success('Ürün sepete eklendi', { icon: '🛒' });
                await fetchCart();
            }
        } catch (e) {
            toast.error('Ürün eklenirken hata oluştu');
        } finally { setLoading(false); }
    };

    const updateQuantity = async (productId, quantity) => {
        try {
            await cartAPI.update(productId, quantity);
            await fetchCart();
        } catch (e) { toast.error('Güncelleme başarısız'); }
    };

    const removeFromCart = async (productId) => {
        try {
            await cartAPI.remove(productId);
            toast.success('Ürün sepetten çıkarıldı');
            await fetchCart();
        } catch (e) { toast.error('Silme başarısız'); }
    };

    const clearCart = async () => {
        try {
            await cartAPI.clear();
            setCart([]);
            setCartTotal(0);
            setCartCount(0);
            removeCoupon();
        } catch (e) { /* silent */ }
    };

    return (
        <CartContext.Provider value={{ cart, cartTotal, cartCount, loading, addToCart, updateQuantity, removeFromCart, clearCart, fetchCart, couponData, couponDiscount, applyCoupon, removeCoupon }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);

