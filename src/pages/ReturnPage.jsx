import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { returnAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { RefreshCw, Camera, X, CheckCircle, Search } from 'lucide-react';

export default function ReturnPage() {
    const [searchParams] = useSearchParams();
    const { customer } = useAuth();
    const [activeTab, setActiveTab] = useState('form'); // form | status
    const [type, setType] = useState('return'); // return | exchange
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [selectedImages, setSelectedImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [statusQuery, setStatusQuery] = useState('');
    const [statusResults, setStatusResults] = useState(null);

    const [form, setForm] = useState({
        orderNumber: '',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        reason: '',
        iban: '',
        bankName: '',
        accountHolder: '',
    });

    // Auto-fill from URL params and customer session
    useEffect(() => {
        const orderNum = searchParams.get('orderNumber');
        setForm(prev => ({
            ...prev,
            orderNumber: orderNum || prev.orderNumber,
            customerName: customer ? `${customer.firstName} ${customer.lastName}`.trim() : prev.customerName,
            customerEmail: customer?.email || prev.customerEmail,
            customerPhone: customer?.phone || prev.customerPhone,
        }));
    }, [searchParams, customer]);

    const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + selectedImages.length > 5) return toast.error('En fazla 5 resim yükleyebilirsiniz');
        setSelectedImages(prev => [...prev, ...files]);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => setImagePreviews(prev => [...prev, ev.target.result]);
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (i) => {
        setSelectedImages(prev => prev.filter((_, idx) => idx !== i));
        setImagePreviews(prev => prev.filter((_, idx) => idx !== i));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.orderNumber || !form.customerName || !form.customerEmail || !form.customerPhone || !form.reason) {
            return toast.error('Lütfen tüm zorunlu alanları doldurun');
        }
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('orderNumber', form.orderNumber);
            formData.append('customerName', form.customerName);
            formData.append('customerEmail', form.customerEmail);
            formData.append('customerPhone', form.customerPhone);
            formData.append('type', type);
            formData.append('reason', form.reason);
            if (type === 'return') {
                formData.append('iban', form.iban);
                formData.append('bankName', form.bankName);
                formData.append('accountHolder', form.accountHolder);
            }
            selectedImages.forEach(img => formData.append('images', img));

            const { data } = await returnAPI.create(formData);
            if (data.success) {
                setSuccess(true);
                toast.success('Başvurunuz başarıyla alındı!');
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Başvuru oluşturulurken hata oluştu');
        } finally { setLoading(false); }
    };

    const handleStatusCheck = async () => {
        if (!statusQuery.trim()) return toast.error('Sipariş numarasını girin');
        try {
            const { data } = await returnAPI.checkStatus(statusQuery);
            setStatusResults(data.requests || []);
        } catch {
            toast.error('Sorgulama başarısız');
        }
    };

    const statusLabels = {
        pending: { label: 'Beklemede', color: 'text-yellow-600 bg-yellow-50' },
        approved: { label: 'Onaylandı', color: 'text-green-600 bg-green-50' },
        rejected: { label: 'Reddedildi', color: 'text-red-600 bg-red-50' },
        processing: { label: 'İşleniyor', color: 'text-blue-600 bg-blue-50' },
        completed: { label: 'Tamamlandı', color: 'text-green-700 bg-green-100' },
        cancelled: { label: 'İptal Edildi', color: 'text-gray-600 bg-gray-50' },
    };

    if (success) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center animate-fadeIn">
                <div className="text-center max-w-md mx-auto px-4">
                    <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="text-success" size={40} />
                    </div>
                    <h2 className="font-display text-2xl font-bold text-primary mb-3">Başvurunuz Alındı!</h2>
                    <p className="text-sm text-muted mb-6">İade/değişim talebiniz en kısa sürede değerlendirilecektir. Durumunuzu sipariş numaranızla sorgulayabilirsiniz.</p>
                    <button onClick={() => { setSuccess(false); setForm({ orderNumber: '', customerName: '', customerEmail: '', customerPhone: '', reason: '', iban: '', bankName: '', accountHolder: '' }); setSelectedImages([]); setImagePreviews([]); }}
                        className="px-6 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-secondary transition-colors">
                        Yeni Başvuru
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <RefreshCw className="text-accent" size={24} />
                    </div>
                    <h1 className="font-display text-2xl lg:text-3xl font-bold text-primary">İade & Değişim</h1>
                    <p className="text-sm text-muted mt-2">Ürünlerinizi 14 gün içinde kolayca iade edebilir veya değiştirebilirsiniz.</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 bg-surface-alt p-1 rounded-xl">
                    <button onClick={() => setActiveTab('form')}
                        className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all ${activeTab === 'form' ? 'bg-white text-primary shadow-sm' : 'text-muted hover:text-primary'}`}>
                        📝 Başvuru Yap
                    </button>
                    <button onClick={() => setActiveTab('status')}
                        className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all ${activeTab === 'status' ? 'bg-white text-primary shadow-sm' : 'text-muted hover:text-primary'}`}>
                        🔍 Durum Sorgula
                    </button>
                </div>

                {activeTab === 'form' ? (
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border/50 p-6 sm:p-8 space-y-6 animate-fadeIn">
                        {/* Type select */}
                        <div>
                            <label className="block text-sm font-medium text-primary mb-3">İşlem Türü *</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button type="button" onClick={() => setType('return')}
                                    className={`p-4 border-2 rounded-xl text-left transition-all ${type === 'return' ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'}`}>
                                    <span className="text-lg mb-1 block">💰</span>
                                    <span className="text-sm font-semibold text-primary">İade</span>
                                    <p className="text-[11px] text-muted mt-0.5">Ürünü iade edip paranızı geri alın</p>
                                </button>
                                <button type="button" onClick={() => setType('exchange')}
                                    className={`p-4 border-2 rounded-xl text-left transition-all ${type === 'exchange' ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'}`}>
                                    <span className="text-lg mb-1 block">🔄</span>
                                    <span className="text-sm font-semibold text-primary">Değişim</span>
                                    <p className="text-[11px] text-muted mt-0.5">Ürünü farklı beden/renk ile değiştirin</p>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-medium text-muted mb-1.5">Sipariş Numarası {customer ? '(Otomatik)' : '*'}</label>
                                <input type="text" name="orderNumber" value={form.orderNumber} onChange={handleChange} required placeholder="ORD-..."
                                    readOnly={!!searchParams.get('orderNumber')}
                                    className={`w-full px-4 py-3 text-sm border border-border rounded-xl focus:outline-none focus:border-accent bg-surface-alt transition-all ${searchParams.get('orderNumber') ? 'cursor-not-allowed opacity-70' : ''}`} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted mb-1.5">Ad Soyad {customer ? '(Sistem)' : '*'}</label>
                                <input type="text" name="customerName" value={form.customerName} onChange={customer ? undefined : handleChange} required
                                    readOnly={!!customer}
                                    className={`w-full px-4 py-3 text-sm border border-border rounded-xl focus:outline-none focus:border-accent bg-surface-alt transition-all ${customer ? 'cursor-not-allowed opacity-70' : ''}`} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted mb-1.5">E-posta {customer ? '(Sistem)' : '*'}</label>
                                <input type="email" name="customerEmail" value={form.customerEmail} onChange={customer ? undefined : handleChange} required
                                    readOnly={!!customer}
                                    className={`w-full px-4 py-3 text-sm border border-border rounded-xl focus:outline-none focus:border-accent bg-surface-alt transition-all ${customer ? 'cursor-not-allowed opacity-70' : ''}`} />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-medium text-muted mb-1.5">Telefon {customer ? '(Sistem)' : '*'}</label>
                                <input type="tel" name="customerPhone" value={form.customerPhone} onChange={customer ? undefined : handleChange} required placeholder="05XX XXX XX XX"
                                    readOnly={!!customer}
                                    className={`w-full px-4 py-3 text-sm border border-border rounded-xl focus:outline-none focus:border-accent bg-surface-alt transition-all ${customer ? 'cursor-not-allowed opacity-70' : ''}`} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-muted mb-1.5">İade/Değişim Sebebi *</label>
                            <textarea name="reason" value={form.reason} onChange={handleChange} required rows={3} placeholder="Lütfen sebebinizi detaylı açıklayın..."
                                className="w-full px-4 py-3 text-sm border border-border rounded-xl focus:outline-none focus:border-accent bg-surface-alt transition-all resize-none" />
                        </div>

                        {/* Ürün görselleri */}
                        <div>
                            <label className="block text-xs font-medium text-muted mb-2">Ürün Fotoğrafları (maks. 5)</label>
                            <div className="flex flex-wrap gap-3">
                                {imagePreviews.map((src, i) => (
                                    <div key={i} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-border">
                                        <img src={src} alt="" className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => removeImage(i)}
                                            className="absolute top-1 right-1 w-5 h-5 bg-danger text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                                {selectedImages.length < 5 && (
                                    <label className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-accent">
                                        <Camera size={18} className="text-muted" />
                                        <span className="text-[10px] text-muted mt-0.5">Ekle</span>
                                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* İade ise banka bilgileri */}
                        {type === 'return' && (
                            <div className="border-t border-border pt-6">
                                <h3 className="text-sm font-semibold text-primary mb-4">💳 İade Banka Bilgileri</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-medium text-muted mb-1.5">IBAN</label>
                                        <input type="text" name="iban" value={form.iban} onChange={handleChange} placeholder="TR..."
                                            className="w-full px-4 py-3 text-sm border border-border rounded-xl focus:outline-none focus:border-accent bg-surface-alt" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-muted mb-1.5">Banka Adı</label>
                                        <input type="text" name="bankName" value={form.bankName} onChange={handleChange}
                                            className="w-full px-4 py-3 text-sm border border-border rounded-xl focus:outline-none focus:border-accent bg-surface-alt" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-muted mb-1.5">Hesap Sahibi</label>
                                        <input type="text" name="accountHolder" value={form.accountHolder} onChange={handleChange}
                                            className="w-full px-4 py-3 text-sm border border-border rounded-xl focus:outline-none focus:border-accent bg-surface-alt" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <button type="submit" disabled={loading}
                            className="w-full py-4 bg-primary hover:bg-secondary text-white font-semibold rounded-xl transition-colors text-sm disabled:opacity-50">
                            {loading ? 'Gönderiliyor...' : 'Başvuruyu Gönder'}
                        </button>
                    </form>
                ) : (
                    <div className="bg-white rounded-2xl border border-border/50 p-6 sm:p-8 animate-fadeIn">
                        <h3 className="font-semibold text-primary mb-4">Başvuru Durumu Sorgula</h3>
                        <div className="flex gap-3 mb-6">
                            <input type="text" value={statusQuery} onChange={(e) => setStatusQuery(e.target.value)} placeholder="Sipariş numaranızı girin (ORD-...)"
                                className="flex-1 px-4 py-3 text-sm border border-border rounded-xl focus:outline-none focus:border-accent bg-surface-alt"
                                onKeyDown={(e) => e.key === 'Enter' && handleStatusCheck()} />
                            <button onClick={handleStatusCheck}
                                className="px-6 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-secondary transition-colors flex items-center gap-2">
                                <Search size={16} /> Sorgula
                            </button>
                        </div>

                        {statusResults !== null && (
                            statusResults.length === 0 ? (
                                <p className="text-sm text-muted text-center py-8">Bu sipariş numarasına ait başvuru bulunamadı.</p>
                            ) : (
                                <div className="space-y-4">
                                    {statusResults.map(req => (
                                        <div key={req._id} className="border border-border rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-medium text-primary">{req.type === 'return' ? '💰 İade' : '🔄 Değişim'}</span>
                                                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusLabels[req.status]?.color || 'text-gray-500 bg-gray-50'}`}>
                                                    {statusLabels[req.status]?.label || req.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted">Sebep: {req.reason}</p>
                                            <p className="text-[11px] text-muted mt-1">Başvuru: {new Date(req.createdAt).toLocaleDateString('tr-TR')}</p>
                                            {req.adminNote && <p className="text-xs text-primary mt-2 border-t border-border pt-2">Admin Notu: {req.adminNote}</p>}
                                            {req.cargoTrackingNumber && <p className="text-xs text-accent mt-1">Kargo Takip: {req.cargoTrackingNumber}</p>}
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                )}

                {/* Info */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { icon: '📦', title: '14 Gün İade', desc: 'Ürünü 14 gün içinde iade edebilirsiniz' },
                        { icon: '🚚', title: 'Ücretsiz Kargo', desc: 'İade kargo ücreti bizden' },
                        { icon: '✅', title: 'Hızlı Onay', desc: 'Başvurunuz en geç 48 saat içinde değerlendirilir' },
                    ].map(info => (
                        <div key={info.title} className="bg-white rounded-xl border border-border/50 p-4 text-center">
                            <span className="text-2xl">{info.icon}</span>
                            <h4 className="text-sm font-semibold text-primary mt-2">{info.title}</h4>
                            <p className="text-[11px] text-muted mt-1">{info.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
