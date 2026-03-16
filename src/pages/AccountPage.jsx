import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSite } from '../context/SiteContext';
import { authAPI, orderAPI, returnAPI } from '../services/api';
import toast from 'react-hot-toast';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from '../utils/firebaseClient';
import { User, LogOut, MapPin, ShieldCheck, ShoppingBag, RefreshCw, CreditCard, Truck } from 'lucide-react';

export default function AccountPage() {
    const { customer, isLoggedIn, logout, updateCustomer } = useAuth();
    const { settings } = useSite();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('orders'); // orders | addresses | returns
    const [showIbanModal, setShowIbanModal] = useState(null);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [newAddress, setNewAddress] = useState({ title: '', fullName: '', phone: '', address: '', city: 'İstanbul', district: '', zipCode: '' });

    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [firebaseConfirmation, setFirebaseConfirmation] = useState(null);

    useEffect(() => {
        if (isLoggedIn) {
            fetchData();
        } else {
            navigate('/login');
        }
    }, [isLoggedIn]);

    const handleSaveAddress = async (e) => {
        e.preventDefault();
        try {
            // Auto-fill fullName if empty
            const addressToSave = {
                ...newAddress,
                fullName: newAddress.fullName || `${customer?.firstName} ${customer?.lastName}`,
                phone: newAddress.phone || customer?.phone
            };
            const { data } = await authAPI.addAddress(addressToSave);
            if (data.success) {
                if (updateCustomer) updateCustomer({ addresses: data.addresses });
                toast.success('Adres başarıyla eklendi');
                setShowAddressModal(false);
                setNewAddress({ title: '', fullName: '', phone: '', address: '', city: 'İstanbul', district: '', zipCode: '' });
            }
        } catch (err) {
            toast.error('Adres eklenemedi');
        }
    };

    const handleDeleteAddress = async (index) => {
        if (!window.confirm('Bu adresi silmek istediğinize emin misiniz?')) return;
        try {
            const updatedAddresses = customer.addresses.filter((_, i) => i !== index);
            const { data } = await authAPI.updateProfile({ addresses: updatedAddresses });
            if (data.success) {
                if (updateCustomer) updateCustomer({ addresses: updatedAddresses });
                toast.success('Adres silindi');
            }
        } catch { toast.error('Adres silinemedi'); }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [orderRes, returnRes] = await Promise.all([
                orderAPI.getMyOrders(),
                returnAPI.getMyReturns()
            ]);
            if (orderRes.data.success) setOrders(orderRes.data.orders);
            if (returnRes.data.success) setReturns(returnRes.data.requests);
        } catch (err) {
            console.error('Fetch data error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const handleSendOTP = async () => {
        try {
            // Firebase varsa SMS doğrulamasını Firebase üzerinden yap
            if (isFirebaseConfigured()) {
                const auth = getFirebaseAuth();
                if (!auth) throw new Error('Firebase yapılandırılmamış');
                if (!customer?.phone) {
                    toast.error('Profilinizde telefon numarası yok. Lütfen telefon numaranızı ekleyin.');
                    return;
                }

                // Invisible reCAPTCHA
                if (!window.__firebaseRecaptchaVerifier) {
                    const containerId = 'firebase-recaptcha-container';
                    if (!document.getElementById(containerId)) {
                        const div = document.createElement('div');
                        div.id = containerId;
                        div.style.display = 'none';
                        document.body.appendChild(div);
                    }
                    window.__firebaseRecaptchaVerifier = new RecaptchaVerifier(auth, 'firebase-recaptcha-container', {
                        size: 'invisible',
                    });
                }

                const phone = customer.phone.startsWith('+') ? customer.phone : `+90${customer.phone.replace(/\D/g, '')}`;
                const confirmation = await signInWithPhoneNumber(auth, phone, window.__firebaseRecaptchaVerifier);
                setFirebaseConfirmation(confirmation);
                setOtpSent(true);
                toast.success('Doğrulama kodu gönderildi (Firebase)');
                return;
            }

            // Fallback: NetGSM / backend OTP
            await authAPI.sendOTP();
            setOtpSent(true);
            toast.success('Doğrulama kodu gönderildi!');
        } catch { toast.error('Kod gönderilemedi'); }
    };

    const handleVerifyOTP = async () => {
        if (otpCode.length !== 6) return toast.error('6 haneli kodu girin');
        setVerifying(true);
        try {
            if (firebaseConfirmation) {
                const cred = await firebaseConfirmation.confirm(otpCode);
                const idToken = await cred.user.getIdToken();
                const { data } = await authAPI.verifyPhoneFirebase(idToken);
                if (data.success) {
                    toast.success('Telefonunuz doğrulandı (Firebase)!');
                    setOtpSent(false);
                    setFirebaseConfirmation(null);
                    window.location.reload();
                }
                return;
            }

            const { data } = await authAPI.verifyOTP(otpCode);
            if (data.success) {
                toast.success('Telefonunuz doğrulandı!');
                setOtpSent(false);
                window.location.reload();
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Doğrulama başarısız');
        } finally { setVerifying(false); }
    };

    const getStatusLabel = (order) => {
        if (order.paymentMethod === 'bank_transfer' && order.paymentStatus === 'pending') {
            return { label: 'Ödeme Bekleniyor', color: 'bg-orange-100 text-orange-600' };
        }
        const labels = {
            new: { label: 'Sipariş Alındı', color: 'bg-blue-100 text-blue-600' },
            processing: { label: 'Hazırlanıyor', color: 'bg-orange-100 text-orange-600' },
            shipped: { label: 'Kargoya Verildi', color: 'bg-purple-100 text-purple-600' },
            delivered: { label: 'Teslim Edildi', color: 'bg-green-100 text-green-600' },
            cancelled: { label: 'İptal Edildi', color: 'bg-red-100 text-red-600' }
        };
        return labels[order.orderStatus] || { label: order.orderStatus, color: 'bg-gray-100 text-gray-600' };
    };

    const getReturnStatusLabel = (status) => {
        const labels = {
            pending: { label: 'Bekliyor', color: 'bg-orange-100 text-orange-600' },
            processing: { label: 'İnceleniyor', color: 'bg-blue-100 text-blue-600' },
            approved: { label: 'Onaylandı', color: 'bg-green-100 text-green-600' },
            rejected: { label: 'Reddedildi', color: 'bg-red-100 text-red-600' },
            completed: { label: 'Tamamlandı', color: 'bg-purple-100 text-purple-600' }
        };
        return labels[status] || { label: status, color: 'bg-gray-100 text-gray-600' };
    };

    return (
        <div className="min-h-screen bg-surface pb-20">
            {/* Header / Info Section */}
            <div className="bg-white border-b border-border">
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center border-4 border-surface shadow-sm overflow-hidden">
                                {customer?.profilePicture ? (
                                    <img src={customer.profilePicture} alt="Profil" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                    <User className="text-accent" size={32} />
                                )}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-primary">{customer?.firstName} {customer?.lastName}</h1>
                                <p className="text-sm text-muted">{customer?.email}</p>
                                <div className="mt-2 flex items-center gap-2 flex-wrap">
                                    {customer?.isEmailVerified ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] text-success font-bold bg-success/5 px-2 py-0.5 rounded-full border border-success/20">
                                            <ShieldCheck /> E-POSTA ONAYLI
                                        </span>
                                    ) : (
                                        <button onClick={async () => {
                                            try {
                                                const { data } = await authAPI.resendVerification();
                                                if (data.success) toast.success(data.message);
                                            } catch { toast.error('Mail gönderilemedi'); }
                                        }} className="text-[10px] text-orange-500 font-bold hover:underline transition-all">
                                            📧 E-POSTA DOĞRULA
                                        </button>
                                    )}

                                </div>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-danger/20 text-danger text-sm font-semibold hover:bg-danger hover:text-white transition-all">
                            <LogOut size={18} /> Çıkış Yap
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 pt-8">
                {/* OTP Doğrulama Bandı */}
                {otpSent && (
                    <div className="mb-6 bg-white rounded-2xl border border-accent/30 p-5 animate-fadeIn">
                        <p className="text-sm font-bold text-primary mb-3">📱 Doğrulama Kodu Gönderildi</p>
                        <p className="text-xs text-muted mb-4">Telefonunuza gelen 6 haneli kodu aşağıya girin.</p>
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                maxLength={6}
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                placeholder="000000"
                                className="flex-1 max-w-[200px] px-4 py-3 text-center text-lg font-mono font-bold border border-border rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 bg-surface-alt tracking-[0.3em]"
                            />
                            <button
                                onClick={handleVerifyOTP}
                                disabled={verifying || otpCode.length !== 6}
                                className="px-6 py-3 bg-accent text-white font-bold rounded-xl text-sm disabled:opacity-50 hover:shadow-lg transition-all"
                            >
                                {verifying ? 'Doğrulanıyor...' : 'Doğrula'}
                            </button>
                            <button
                                onClick={() => { setOtpSent(false); setOtpCode(''); setFirebaseConfirmation(null); }}
                                className="px-4 py-3 border border-border text-muted font-bold rounded-xl text-sm hover:bg-surface-alt transition-all"
                            >
                                İptal
                            </button>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-1 bg-white p-1 rounded-2xl border border-border/50 mb-8 sticky top-4 z-10 shadow-sm overflow-x-auto no-scrollbar">
                    {[
                        { id: 'orders', label: 'Siparişlerim', icon: <ShoppingBag /> },
                        { id: 'returns', label: 'İade & Değişim', icon: <RefreshCw /> },
                        { id: 'addresses', label: 'Adreslerim', icon: <MapPin /> }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-primary text-white shadow-md' : 'text-muted hover:bg-surface-alt'}`}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="space-y-6">
                    {activeTab === 'orders' && (
                        <div className="space-y-4 animate-fadeIn">
                            {loading ? (
                                <div className="animate-pulse space-y-4">
                                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-2xl border border-border" />)}
                                </div>
                            ) : orders.length > 0 ? (
                                orders.map(order => {
                                    const status = getStatusLabel(order);
                                    return (
                                        <div key={order._id} className="bg-white rounded-2xl border border-border/50 overflow-hidden hover:border-accent/30 transition-all">
                                            <div className="p-5 flex flex-wrap items-center justify-between gap-4 border-b border-border/50 bg-surface-alt/30">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold text-muted uppercase">Sipariş No</p>
                                                    <p className="text-sm font-bold text-primary font-mono">{order.orderNumber}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold text-muted uppercase">Tarih</p>
                                                    <p className="text-sm font-semibold text-primary">{new Date(order.createdAt).toLocaleDateString('tr-TR')}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold text-muted uppercase">Toplam</p>
                                                    <p className="text-sm font-bold text-accent">{order.totalAmount?.toLocaleString('tr-TR')} TL</p>
                                                </div>
                                                <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${status.color}`}>
                                                    {status.label}
                                                </div>
                                            </div>
                                            <div className="p-5 flex items-center justify-between flex-wrap gap-4">
                                                <div className="flex -space-x-3 overflow-hidden">
                                                    {order.items?.map((item, idx) => {
                                                        const pId = item.product?._id || item.product;
                                                        return pId ? (
                                                            <Link key={idx} to={`/product/${pId}`}>
                                                                <img src={item.productImage || '/placeholder.jpg'} alt={item.productName}
                                                                    className="w-12 h-12 rounded-lg border-2 border-white object-cover hover:scale-110 transition-transform cursor-pointer"
                                                                    title={`${item.productName} - Yorum Yapmak İçin Tıklayın`} />
                                                            </Link>
                                                        ) : (
                                                            <div key={idx} className="relative group cursor-not-allowed">
                                                                <img src={item.productImage || '/placeholder.jpg'} alt={item.productName}
                                                                    className="w-12 h-12 rounded-lg border-2 border-white object-cover opacity-60 grayscale"
                                                                    title={`${item.productName} - Ürün Yayından Kaldırıldı`} />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div className="flex gap-2 w-full sm:w-auto">
                                                    {order.paymentMethod === 'bank_transfer' && order.paymentStatus === 'pending' && (
                                                        <button onClick={() => setShowIbanModal(order)}
                                                            className="flex-1 sm:flex-none px-4 py-2 bg-accent text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2">
                                                            <CreditCard /> ÖDE & BİLGİ
                                                        </button>
                                                    )}
                                                    {order.orderStatus === 'delivered' && (
                                                        <Link to={`/return?orderNumber=${order.orderNumber}`}
                                                            className="flex-1 sm:flex-none px-4 py-2 border border-border text-primary rounded-xl text-xs font-bold hover:bg-surface-alt transition-all flex items-center justify-center gap-2">
                                                            <RefreshCw /> İADE / DEĞİŞİM
                                                        </Link>
                                                    )}
                                                    {order.trackingNumber ? (
                                                        <Link to={`/tracking?q=${order.trackingNumber}`} className="flex-1 sm:flex-none px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-secondary transition-all text-center flex items-center justify-center gap-2">
                                                            <Truck /> KARGO NO: {order.trackingNumber}
                                                        </Link>
                                                    ) : (
                                                        <Link to="/tracking" className="flex-1 sm:flex-none px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-secondary transition-all text-center flex items-center justify-center">
                                                            TAKİP ET
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-border">
                                    <ShoppingBag size={48} className="mx-auto text-muted/30 mb-4" />
                                    <p className="text-muted font-medium mb-6">Henüz bir siparişiniz bulunmuyor.</p>
                                    <Link to="/category" className="px-8 py-3 bg-primary text-white rounded-xl text-sm font-bold">Alışverişe Başla</Link>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'returns' && (
                        <div className="space-y-4 animate-fadeIn">
                            {/* User guide section */}
                            <div className="bg-white rounded-2xl border border-border/50 p-6 text-center max-w-2xl mx-auto mb-8">
                                <h3 className="text-lg font-bold text-primary mb-2">İade & Değişim İşlemleri</h3>
                                <p className="text-xs text-muted leading-relaxed mb-6">
                                    Siparişinizdeki teslim alınmış ürünler için İade/Değişim talebini Siparişlerim ekranından ilgili siparişi seçerek başlatabilirsiniz.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                                    <div className="space-y-2 p-3 bg-surface-alt rounded-2xl border border-border/50">
                                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mx-auto text-primary font-bold shadow-sm">1</div>
                                        <p className="text-[10px] font-bold text-primary uppercase">Talep Oluştur</p>
                                    </div>
                                    <div className="space-y-2 p-3 bg-surface-alt rounded-2xl border border-border/50">
                                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mx-auto text-primary font-bold shadow-sm">2</div>
                                        <p className="text-[10px] font-bold text-primary uppercase">Kargola</p>
                                    </div>
                                    <div className="space-y-2 p-3 bg-surface-alt rounded-2xl border border-border/50">
                                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mx-auto text-primary font-bold shadow-sm">3</div>
                                        <p className="text-[10px] font-bold text-primary uppercase">Süreci Takip Et</p>
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-primary px-2">Geçmiş Talepleriniz</h3>
                            {loading ? (
                                <div className="animate-pulse space-y-4">
                                    {[1, 2].map(i => <div key={i} className="h-32 bg-white rounded-2xl border border-border" />)}
                                </div>
                            ) : returns.length > 0 ? (
                                returns.map(ret => {
                                    const statusLabel = getReturnStatusLabel(ret.status);
                                    return (
                                        <div key={ret._id} className="bg-white rounded-2xl border border-border/50 overflow-hidden hover:border-accent/30 transition-all">
                                            <div className="p-5 flex flex-wrap items-center justify-between gap-4 border-b border-border/50 bg-surface-alt/30">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold text-muted uppercase">Sipariş No</p>
                                                    <p className="text-sm font-bold text-primary font-mono">{ret.orderNumber}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold text-muted uppercase">Tür</p>
                                                    <p className="text-xs font-semibold text-primary">{ret.type.toUpperCase()}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold text-muted uppercase">Tarih</p>
                                                    <p className="text-xs font-semibold text-primary">{new Date(ret.createdAt).toLocaleDateString('tr-TR')}</p>
                                                </div>
                                                <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${statusLabel.color}`}>
                                                    {statusLabel.label}
                                                </div>
                                            </div>
                                            <div className="p-5 flex flex-col gap-3">
                                                {ret.adminNote && (
                                                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                                                        <p className="text-xs font-bold text-blue-800 mb-1">Müşteri Temsilcisi Notu:</p>
                                                        <p className="text-xs text-blue-700">{ret.adminNote}</p>
                                                    </div>
                                                )}
                                                {ret.cargoTrackingNumber && (
                                                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                                                        <div>
                                                            <p className="text-[10px] font-bold text-muted uppercase">İade Kargo Takip Kodu</p>
                                                            <p className="text-sm font-bold text-primary font-mono">{ret.cargoTrackingNumber}</p>
                                                        </div>
                                                        <Truck size={24} className="text-muted opacity-50" />
                                                    </div>
                                                )}

                                                {ret.products?.length > 0 && (
                                                    <div className="mt-2">
                                                        <p className="text-xs font-bold text-primary mb-2">Talep Edilen Ürünler</p>
                                                        <div className="flex -space-x-3 overflow-hidden">
                                                            {ret.products.map((p, idx) => {
                                                                const pId = p.productId?._id || p.productId;
                                                                return pId ? (
                                                                    <Link key={idx} to={`/product/${pId}`}>
                                                                        <img src={p.productImage || '/placeholder.jpg'} alt={p.productName}
                                                                            className="w-10 h-10 rounded-lg border-2 border-white object-cover hover:scale-110 transition-transform"
                                                                            title={`${p.productName} - Görüntüle`} />
                                                                    </Link>
                                                                ) : (
                                                                    <div key={idx} className="relative group cursor-not-allowed">
                                                                        <img src={p.productImage || '/placeholder.jpg'} alt={p.productName}
                                                                            className="w-10 h-10 rounded-lg border-2 border-white object-cover opacity-60 grayscale"
                                                                            title={`${p.productName} - Ürün Yayından Kaldırıldı`} />
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-border">
                                    <RefreshCw size={48} className="mx-auto text-muted/30 mb-4" />
                                    <p className="text-muted font-medium">İade veya değişim talebiniz bulunmamaktadır.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'addresses' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                            <button onClick={() => setShowAddressModal(true)}
                                className="h-40 border-2 border-dashed border-accent/30 rounded-2xl flex flex-col items-center justify-center gap-2 text-accent hover:bg-accent/5 transition-all group">
                                <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Plus size={20} />
                                </div>
                                <span className="text-xs font-bold font-display uppercase tracking-wider">Yeni Adres Ekle</span>
                            </button>
                            {customer?.addresses?.map((addr, i) => (
                                <div key={i} className="h-40 bg-white border border-border/50 rounded-2xl p-5 hover:shadow-lg transition-all relative group">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 bg-surface-alt rounded-lg flex items-center justify-center text-primary">
                                            <MapPin size={18} />
                                        </div>
                                        <h4 className="text-sm font-bold text-primary">{addr.title}</h4>
                                    </div>
                                    <p className="text-xs text-muted leading-relaxed line-clamp-3 font-medium">{addr.address}</p>
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleDeleteAddress(i)} className="text-muted hover:text-danger">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Address Modal */}
            {showAddressModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" onClick={() => setShowAddressModal(false)} />
                    <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden relative animate-slideUp shadow-2xl">
                        <div className="bg-primary p-6 text-white text-center">
                            <h3 className="text-xl font-bold">Yeni Adres Ekle</h3>
                        </div>
                        <form onSubmit={handleSaveAddress} className="p-6 space-y-4">
                            <div className="form-group">
                                <label className="text-[10px] font-bold text-muted uppercase ml-1">Adres Başlığı</label>
                                <input type="text" value={newAddress.title} onChange={(e) => setNewAddress({ ...newAddress, title: e.target.value })}
                                    className="w-full px-4 py-3 bg-surface-alt border border-border rounded-xl text-sm focus:outline-none focus:border-accent" placeholder="Örn: Ev, İş" required />
                            </div>
                            <div className="form-group">
                                <label className="text-[10px] font-bold text-muted uppercase ml-1">Tam Adres</label>
                                <textarea value={newAddress.address} onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                                    className="w-full px-4 py-3 bg-surface-alt border border-border rounded-xl text-sm focus:outline-none focus:border-accent" rows={3} placeholder="Mahalle, Sokak, No..." required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="text-[10px] font-bold text-muted uppercase ml-1">İl</label>
                                    <input type="text" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                        className="w-full px-4 py-3 bg-surface-alt border border-border rounded-xl text-sm focus:outline-none focus:border-accent" required />
                                </div>
                                <div className="form-group">
                                    <label className="text-[10px] font-bold text-muted uppercase ml-1">İlçe</label>
                                    <input type="text" value={newAddress.district} onChange={(e) => setNewAddress({ ...newAddress, district: e.target.value })}
                                        className="w-full px-4 py-3 bg-surface-alt border border-border rounded-xl text-sm focus:outline-none focus:border-accent" required />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowAddressModal(false)} className="flex-1 py-3 border border-border text-primary font-bold rounded-xl text-sm">İptal</button>
                                <button type="submit" className="flex-1 py-3 bg-primary text-white font-bold rounded-xl text-sm">Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* IBAN Modal */}
            {showIbanModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" onClick={() => setShowIbanModal(null)} />
                    <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden relative animate-slideUp shadow-2xl">
                        <div className="bg-primary p-6 text-white">
                            <h3 className="text-lg font-bold">Havale Bilgileri</h3>
                            <p className="text-xs opacity-70 mt-1">Sipariş No: {showIbanModal.orderNumber}</p>
                        </div>
                        <div className="p-6 space-y-4">
                            {settings.payment?.bankAccounts?.length > 0 ? (
                                settings.payment.bankAccounts.map((bank, i) => (
                                    <div key={i} className="p-4 bg-surface-alt rounded-2xl border border-border/50 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-muted uppercase">{bank.bankName}</span>
                                            <button onClick={() => { navigator.clipboard.writeText(bank.iban); toast.success('IBAN Kopyalandı'); }}
                                                className="text-[10px] font-bold text-accent">KOPYALA</button>
                                        </div>
                                        <p className="text-xs font-bold text-primary truncate">{bank.iban}</p>
                                        <p className="text-[10px] text-muted">{bank.accountHolder}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-center py-4 text-muted">Banka bilgisi bulunamadı.</p>
                            )}
                            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                                <p className="text-[10px] text-orange-700 font-medium leading-relaxed">
                                    Ödeme yaparken lütfen açıklama kısmına <b>{showIbanModal.orderNumber}</b> numarasını yazmayı unutmayınız.
                                </p>
                            </div>
                            <button onClick={() => setShowIbanModal(null)} className="w-full py-3 bg-primary text-white font-bold rounded-xl text-sm transition-transform active:scale-95">Kapat</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper icons specifically for this page
const Trash2 = ({ size }) => (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height={size} width={size} xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
    </svg>
);

const Plus = ({ size }) => (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height={size} width={size} xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path>
    </svg>
);
