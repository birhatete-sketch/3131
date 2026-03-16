import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSite } from '../context/SiteContext';
import { orderAPI, paymentAPI } from '../services/api';
import toast from 'react-hot-toast';
import { CheckCircle } from 'lucide-react';

export default function CheckoutPage() {
    const { cart, cartTotal, clearCart, couponData, couponDiscount } = useCart();
    const { customer } = useAuth();
    const { settings } = useSite();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const status = searchParams.get('status');
    const orderNumber = searchParams.get('orderNumber');

    const shippingLimit = settings.shipping?.freeShippingLimit || 500;
    const shippingCost = cartTotal >= shippingLimit ? 0 : (settings.shipping?.defaultShippingCost || 39.90);
    const grandTotal = cartTotal - couponDiscount + shippingCost;

    const [form, setForm] = useState({
        name: customer ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() : '',
        email: customer?.email || '',
        phone: customer?.phone || '',
        address: '',
        city: 'İstanbul',
        zipCode: '',
    });
    const [paymentMethod, setPaymentMethod] = useState('credit_card');
    const [loading, setLoading] = useState(false);

    // iyzico 3D Secure ödeme başarıyla tamamlanıp callback'ten bu sayfaya dönüldüğünde sepeti temizle
    useEffect(() => {
        if (status === 'success') {
            clearCart();
        }
    }, [status, clearCart]);

    // Success page
    if (status === 'success') {
        const isBankTransfer = searchParams.get('method') === 'bank_transfer';
        return (
            <div className="min-h-[70vh] flex items-center justify-center animate-fadeIn">
                <div className="text-center max-w-md mx-auto px-4">
                    <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="text-success" size={40} />
                    </div>
                    <h1 className="font-display text-2xl font-bold text-primary mb-3">Siparişiniz Alındı!</h1>
                    <p className="text-sm text-muted mb-2">Sipariş numaranız: <span className="font-bold text-primary">{orderNumber || '—'}</span></p>
                    {isBankTransfer ? (
                        <div className="bg-accent/5 p-4 rounded-xl border border-accent/20 my-6 text-left">
                            <p className="text-xs font-bold text-accent mb-2 uppercase tracking-wide">Havale Bilgileri</p>
                            <p className="text-xs text-muted mb-4">Lütfen aşağıdaki hesaba <b>{grandTotal.toLocaleString('tr-TR')} TL</b> gönderirken açıklama kısmına <b>{orderNumber}</b> yazınız.</p>
                            {settings.payment?.bankAccounts?.filter(a => a.isActive).map((acc, i) => (
                                <div key={i} className="mb-3 last:mb-0 pb-3 last:pb-0 border-b last:border-0 border-border/50">
                                    <p className="text-sm font-bold text-primary">{acc.bankName}</p>
                                    <p className="text-xs text-muted">Alici: {acc.accountHolder}</p>
                                    <p className="text-sm font-mono text-accent mt-1 select-all">{acc.iban}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted mb-8">Siparişiniz en kısa sürede hazırlanacak ve kargoya verilecektir.</p>
                    )}
                    <button onClick={() => navigate('/')} className="px-8 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-secondary transition-colors text-sm">
                        Alışverişe Devam Et
                    </button>
                </div>
            </div>
        );
    }

    if (status === 'failed' || status === 'error') {
        const reason = searchParams.get('reason');
        return (
            <div className="min-h-[70vh] flex items-center justify-center animate-fadeIn">
                <div className="text-center max-w-md mx-auto px-4">
                    <div className="w-20 h-20 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-danger text-3xl">✕</span>
                    </div>
                    <h1 className="font-display text-2xl font-bold text-primary mb-3">Ödeme Başarısız</h1>
                    <p className="text-sm text-muted mb-8">
                        {reason === 'order-not-found'
                            ? 'Sipariş bulunamadı. Lütfen tekrar deneyin.'
                            : 'Ödemeniz işlenemedi. Lütfen tekrar deneyin.'}
                    </p>
                    <button onClick={() => navigate('/cart')} className="px-8 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-secondary transition-colors text-sm">
                        Sepete Dön
                    </button>
                </div>
            </div>
        );
    }

    const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.phone || !form.address) {
            return toast.error('Lütfen tüm alanları doldurun');
        }
        if (cart.length === 0) return toast.error('Sepetiniz boş');

        setLoading(true);
        try {
            // 1. Create order (ödeme öncesi sipariş kaydı)
            const { data: orderData } = await orderAPI.create({
                customerInfo: form,
                items: cart.map(item => ({
                    product: item.productId,
                    productName: item.name,
                    productImage: item.image || '/uploads/default_placeholder.jpg',
                    quantity: item.quantity || 1,
                    price: item.price,
                    variant: item.variant || null
                })),
                paymentMethod: paymentMethod,
                couponCode: couponData?.code || '',
                discountAmount: couponDiscount || 0,
            });

            if (!orderData.success) throw new Error(orderData.error);

            // 2. Ödeme başlatma
            if (paymentMethod === 'credit_card') {
                try {
                    const { data: payData } = await paymentAPI.initialize(orderData.order._id);
                    if (payData.success && (payData.checkoutFormContent || payData.paymentPageUrl)) {
                        if (payData.checkoutFormContent) {
                            const div = document.createElement('div');
                            div.innerHTML = payData.checkoutFormContent;
                            document.body.appendChild(div);
                            const form = div.querySelector('form');
                            if (form) {
                                form.submit();
                            } else if (payData.paymentPageUrl) {
                                window.location.href = payData.paymentPageUrl;
                            } else {
                                toast.error('Ödeme formu yüklenemedi.');
                            }
                        } else if (payData.paymentPageUrl) {
                            window.location.href = payData.paymentPageUrl;
                        } else {
                            toast.error('Ödeme sayfası alınamadı.');
                        }
                        return;
                    }
                    toast.error(payData?.error || 'Ödeme başlatılamadı. Lütfen tekrar deneyin.');
                    return;
                } catch (payErr) {
                    console.error('Payment initialize error:', payErr);
                    const apiError = payErr.response?.data?.error;
                    toast.error(apiError || 'Ödeme başlatılırken bir hata oluştu. Lütfen tekrar deneyin.');
                    return;
                }
            } else {
                // Havale / EFT veya Kapıda Ödeme: ödeme offline, sipariş hemen oluşturulur
                clearCart();
                navigate(`/checkout?status=success&orderNumber=${orderData.order.orderNumber}&method=${paymentMethod}`);
            }
        } catch (err) {
            toast.error(err.response?.data?.error || err.message || 'Sipariş oluşturulurken hata oluştu');
        } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-surface">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="font-display text-2xl lg:text-3xl font-bold text-primary mb-8">Sipariş Tamamla</h1>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        {/* Customer Info */}
                        <div className="lg:col-span-3 space-y-6">
                            <div className="bg-white rounded-2xl border border-border/50 p-6">
                                <h3 className="font-semibold text-primary mb-5">Teslimat Bilgileri</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-medium text-muted mb-1.5">Ad Soyad *</label>
                                        <input type="text" name="name" value={form.name} onChange={handleChange} required
                                            className="w-full px-4 py-3 text-sm border border-border rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 bg-surface-alt transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-muted mb-1.5">E-posta *</label>
                                        <input type="email" name="email" value={form.email} onChange={handleChange} required
                                            className="w-full px-4 py-3 text-sm border border-border rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 bg-surface-alt transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-muted mb-1.5">Telefon *</label>
                                        <input type="tel" name="phone" value={form.phone} onChange={handleChange} required placeholder="05XX XXX XX XX"
                                            className="w-full px-4 py-3 text-sm border border-border rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 bg-surface-alt transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-muted mb-1.5">Şehir *</label>
                                        <input type="text" name="city" value={form.city} onChange={handleChange} required
                                            className="w-full px-4 py-3 text-sm border border-border rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 bg-surface-alt transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-muted mb-1.5">Posta Kodu</label>
                                        <input type="text" name="zipCode" value={form.zipCode} onChange={handleChange}
                                            className="w-full px-4 py-3 text-sm border border-border rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 bg-surface-alt transition-all" />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-medium text-muted mb-1.5">Adres *</label>
                                        <textarea name="address" value={form.address} onChange={handleChange} required rows={3}
                                            className="w-full px-4 py-3 text-sm border border-border rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 bg-surface-alt transition-all resize-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method Selection */}
                            <div className="bg-white rounded-2xl border border-border/50 p-6">
                                <h3 className="font-semibold text-primary mb-5">Ödeme Yöntemi</h3>
                                <div className="space-y-3">
                                    {settings.payment?.creditCard !== false && (
                                        <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'credit_card' ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/30'}`}>
                                            <input type="radio" name="paymentMethod" value="credit_card" checked={paymentMethod === 'credit_card'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4 text-accent focus:ring-accent" />
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-primary">Kredi / Banka Kartı</p>
                                                <p className="text-xs text-muted">iyzico ile güvenli ödeme</p>
                                            </div>
                                            <span className="text-2xl">💳</span>
                                        </label>
                                    )}

                                    {settings.payment?.bankTransfer !== false && (
                                        <div className="space-y-2">
                                            <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'bank_transfer' ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/30'}`}>
                                                <input type="radio" name="paymentMethod" value="bank_transfer" checked={paymentMethod === 'bank_transfer'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4 text-accent focus:ring-accent" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-primary">Havale / EFT</p>
                                                    <p className="text-xs text-muted">Banka hesabımıza gönderim yapın</p>
                                                </div>
                                                <span className="text-2xl">🏦</span>
                                            </label>
                                            {paymentMethod === 'bank_transfer' && (
                                                <div className="p-4 bg-surface-alt rounded-xl border border-border text-xs text-muted animate-fadeIn">
                                                    Sipariş onayından sonra banka hesap bilgilerimiz paylaşılacaktır.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {settings.payment?.cashOnDelivery !== false && (
                                        <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'cash_on_delivery' ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/30'}`}>
                                            <input type="radio" name="paymentMethod" value="cash_on_delivery" checked={paymentMethod === 'cash_on_delivery'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-4 h-4 text-accent focus:ring-accent" />
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-primary">Kapıda Ödeme</p>
                                                <p className="text-xs text-muted">Ürünü teslim alırken nakit ödeyin</p>
                                            </div>
                                            <span className="text-2xl">🚪</span>
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl border border-border/50 p-6 sticky top-24 space-y-4">
                                <h3 className="font-semibold text-primary">Sipariş Özeti</h3>
                                <div className="space-y-3 max-h-60 overflow-y-auto">
                                    {cart.map((item, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-12 h-14 rounded-lg overflow-hidden bg-surface-alt flex-shrink-0">
                                                <img src={item.image} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-primary font-medium line-clamp-1">{item.name}</p>
                                                <p className="text-xs text-muted">{item.quantity} x {(item.price || 0).toLocaleString('tr-TR')} TL</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-border pt-4 space-y-2 text-sm">
                                    <div className="flex justify-between text-muted"><span>Ara Toplam</span><span>{cartTotal.toLocaleString('tr-TR')} TL</span></div>
                                    {couponDiscount > 0 && (
                                        <div className="flex justify-between text-success">
                                            <span>Kupon İndirimi ({couponData?.code})</span>
                                            <span>-{couponDiscount.toLocaleString('tr-TR')} TL</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-muted">
                                        <span>Kargo</span>
                                        <span>{shippingCost === 0 ? <span className="text-success font-medium">Ücretsiz</span> : `${shippingCost.toLocaleString('tr-TR')} TL`}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-primary text-lg pt-2 border-t border-border">
                                        <span>Genel Toplam</span><span>{grandTotal.toLocaleString('tr-TR')} TL</span>
                                    </div>
                                </div>
                                <button type="submit" disabled={loading}
                                    className="w-full py-4 bg-primary hover:bg-green-600 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 text-sm">
                                    {loading ? 'İşleniyor...' : 'Siparişi Onayla'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
