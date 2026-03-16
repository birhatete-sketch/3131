import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useSite } from '../context/SiteContext';
import { couponAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag, X } from 'lucide-react';

export default function CartPage() {
    const { cart, cartTotal, updateQuantity, removeFromCart, clearCart, couponData, couponDiscount, applyCoupon, removeCoupon } = useCart();
    const { settings } = useSite();
    const [couponCode, setCouponCode] = useState('');

    const shippingLimit = settings.shipping?.freeShippingLimit || 500;
    const shippingCost = cartTotal >= shippingLimit ? 0 : (settings.shipping?.defaultShippingCost || 39.90);
    const grandTotal = cartTotal - couponDiscount + shippingCost;

    const handleCoupon = async () => {
        if (!couponCode.trim()) return;
        try {
            const { data } = await couponAPI.validate(couponCode, cartTotal);
            if (data.success) {
                applyCoupon(data.coupon, data.coupon.discount);
                toast.success(`Kupon uygulandı: -${data.coupon.discount.toLocaleString('tr-TR')} TL`);
                setCouponCode('');
            }
        } catch (e) {
            toast.error(e.response?.data?.error || 'Geçersiz kupon kodu');
        }
    };

    const handleRemoveCoupon = () => {
        removeCoupon();
        toast.success('Kupon kaldırıldı');
    };

    if (cart.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 animate-fadeIn">
                <div className="w-20 h-20 rounded-full bg-surface-alt flex items-center justify-center">
                    <ShoppingBag className="text-muted" size={32} />
                </div>
                <h2 className="text-xl font-semibold text-primary">Sepetiniz Boş</h2>
                <p className="text-sm text-muted">Henüz sepetinize ürün eklemediniz.</p>
                <Link to="/search" className="mt-4 px-6 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-secondary transition-colors">
                    Alışverişe Başla
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="font-display text-2xl lg:text-3xl font-bold text-primary mb-8">Sepetim <span className="text-muted font-normal text-lg">({cart.length} ürün)</span></h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {cart.map((item, i) => (
                            <div key={item.productId || i} className="flex gap-4 bg-white p-4 rounded-2xl border border-border/50 animate-fadeIn" style={{ animationDelay: `${i * 60}ms` }}>
                                <Link to={`/product/${item.productId}`} className="w-24 h-28 rounded-xl overflow-hidden bg-surface-alt flex-shrink-0">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://placehold.co/200x250/f8fafc/94a3b8?text=Ürün'; }} />
                                </Link>
                                <div className="flex-1 min-w-0">
                                    <Link to={`/product/${item.productId}`} className="text-sm font-medium text-primary hover:text-accent transition-colors line-clamp-2">{item.name}</Link>
                                    <p className="text-sm font-bold text-primary mt-2">{(item.price || 0).toLocaleString('tr-TR')} TL</p>
                                    <div className="flex items-center justify-between mt-3">
                                        <div className="flex items-center border border-border rounded-lg overflow-hidden">
                                            <button onClick={() => updateQuantity(item.productId, Math.max(1, (item.quantity || 1) - 1), item.variant)} className="px-2.5 py-1.5 hover:bg-surface-alt transition-colors">
                                                <Minus size={12} />
                                            </button>
                                            <span className="px-4 py-1.5 text-xs font-semibold">{item.quantity || 1}</span>
                                            <button
                                                onClick={() => {
                                                    if ((item.quantity || 1) >= (item.stock || 999)) {
                                                        toast.error(`Üzgünüz, stokta sadece ${item.stock} adet var.`);
                                                    } else {
                                                        updateQuantity(item.productId, (item.quantity || 1) + 1, item.variant);
                                                    }
                                                }}
                                                disabled={(item.quantity || 1) >= (item.stock || 999)}
                                                className={`px-2.5 py-1.5 hover:bg-surface-alt transition-colors ${(item.quantity || 1) >= (item.stock || 999) ? 'opacity-30 cursor-not-allowed' : ''}`}>
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                        <button onClick={() => removeFromCart(item.productId)} className="p-2 text-muted hover:text-danger transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button onClick={clearCart} className="text-xs text-muted hover:text-danger transition-colors underline">Sepeti Temizle</button>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl border border-border/50 p-6 sticky top-24 space-y-5">
                            <h3 className="font-semibold text-primary text-lg">Sipariş Özeti</h3>

                            {/* Coupon */}
                            {!couponData ? (
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
                                        <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Kupon Kodu"
                                            className="w-full pl-9 pr-3 py-2.5 text-xs border border-border rounded-lg focus:outline-none focus:border-accent bg-surface-alt"
                                            onKeyDown={(e) => e.key === 'Enter' && handleCoupon()} />
                                    </div>
                                    <button onClick={handleCoupon} className="px-4 py-2.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-secondary transition-colors">Uygula</button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between bg-success/5 border border-success/20 rounded-lg px-3 py-2">
                                    <p className="text-xs text-success font-medium">✓ {couponData.code} kupon uygulandı</p>
                                    <button onClick={handleRemoveCoupon} className="p-1 text-muted hover:text-danger transition-colors" title="Kuponu kaldır">
                                        <X size={14} />
                                    </button>
                                </div>
                            )}

                            <div className="space-y-3 text-sm border-t border-border pt-4">
                                <div className="flex justify-between text-muted">
                                    <span>Ara Toplam</span>
                                    <span>{cartTotal.toLocaleString('tr-TR')} TL</span>
                                </div>
                                {couponDiscount > 0 && (
                                    <div className="flex justify-between text-success">
                                        <span>Kupon İndirimi</span>
                                        <span>-{couponDiscount.toLocaleString('tr-TR')} TL</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-muted">
                                    <span>Kargo</span>
                                    <span>{shippingCost === 0 ? <span className="text-success font-medium">Ücretsiz</span> : `${shippingCost.toLocaleString('tr-TR')} TL`}</span>
                                </div>
                                {shippingCost > 0 && (
                                    <p className="text-[11px] text-accent">{(shippingLimit - cartTotal).toLocaleString('tr-TR')} TL daha ekleyin, ücretsiz kargo kazanın!</p>
                                )}
                                <div className="flex justify-between font-bold text-primary text-lg border-t border-border pt-3">
                                    <span>Toplam</span>
                                    <span>{grandTotal.toLocaleString('tr-TR')} TL</span>
                                </div>
                            </div>

                            <Link to="/checkout"
                                className="flex items-center justify-center gap-2 w-full py-4 bg-primary hover:bg-green-600 text-white font-semibold rounded-xl transition-all duration-300 text-sm">
                                Siparişi Tamamla <ArrowRight />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
