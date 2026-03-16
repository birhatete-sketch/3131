import { useState } from 'react';
import { orderAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Truck, Search, CheckCircle, Package, Clock } from 'lucide-react';

export default function OrderTrackingPage() {
    const [query, setQuery] = useState({ orderNumber: '', email: '' });
    const [loading, setLoading] = useState(false);
    const [order, setOrder] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!query.orderNumber || !query.email) return toast.error('Lütfen tüm alanları doldurun');

        setLoading(true);
        try {
            // Using a specific endpoint for public tracking
            const { data } = await orderAPI.trackOrder(query.orderNumber, query.email);
            if (data.success) {
                setOrder(data.order);
            } else {
                toast.error(data.error || 'Sipariş bulunamadı');
            }
        } catch (err) {
            toast.error('Sorgulama sırasında bir hata oluştu');
        } finally { setLoading(false); }
    };

    const statusSteps = [
        { id: 'new', label: 'Sipariş Alındı', icon: <Clock /> },
        { id: 'processing', label: 'Hazırlanıyor', icon: <Package /> },
        { id: 'shipped', label: 'Kargoya Verildi', icon: <Truck /> },
        { id: 'delivered', label: 'Teslim Edildi', icon: <CheckCircle /> }
    ];

    const currentStepIndex = statusSteps.findIndex(s => s.id === order?.orderStatus);

    return (
        <div className="min-h-screen bg-surface">
            <div className="max-w-3xl mx-auto px-4 py-12">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Truck className="text-primary" size={32} />
                    </div>
                    <h1 className="font-display text-3xl font-bold text-primary">Sipariş Takibi</h1>
                    <p className="text-sm text-muted mt-2">Siparişinizin durumunu öğrenmek için bilgileri giriniz.</p>
                </div>

                <div className="bg-white rounded-3xl border border-border/50 shadow-sm overflow-hidden mb-12">
                    <form onSubmit={handleSubmit} className="p-6 sm:p-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="text-[10px] font-bold text-muted uppercase ml-1">Sipariş Numarası</label>
                            <input type="text" value={query.orderNumber} onChange={(e) => setQuery({ ...query, orderNumber: e.target.value })}
                                placeholder="ORD-XXXXXX" required
                                className="w-full px-4 py-3 bg-surface-alt border border-border rounded-xl text-sm focus:outline-none focus:border-primary" />
                        </div>
                        <div className="form-group">
                            <label className="text-[10px] font-bold text-muted uppercase ml-1">E-Posta Adresi</label>
                            <input type="email" value={query.email} onChange={(e) => setQuery({ ...query, email: e.target.value })}
                                placeholder="ornek@mail.com" required
                                className="w-full px-4 py-3 bg-surface-alt border border-border rounded-xl text-sm focus:outline-none focus:border-primary" />
                        </div>
                        <button type="submit" disabled={loading}
                            className="sm:col-span-2 py-4 bg-primary text-white font-bold rounded-xl text-sm hover:bg-secondary transition-all flex items-center justify-center gap-2">
                            {loading ? 'Sorgulanıyor...' : <><Search /> SİPARİŞİ SORGULA</>}
                        </button>
                    </form>
                </div>

                {order && (
                    <div className="animate-fadeIn space-y-8">
                        {/* Status Tracker */}
                        <div className="bg-white rounded-3xl border border-border/50 p-6 sm:p-10">
                            <h2 className="text-lg font-bold text-primary mb-10 text-center">Sipariş Durumu</h2>
                            <div className="relative flex justify-between items-center max-w-xl mx-auto">
                                <div className="absolute top-1/2 left-0 w-full h-1 bg-surface-alt -translate-y-1/2 -z-0">
                                    <div className="h-full bg-accent transition-all duration-500" style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}></div>
                                </div>
                                {statusSteps.map((step, idx) => (
                                    <div key={step.id} className="relative z-10 flex flex-col items-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all ${idx <= currentStepIndex ? 'bg-accent border-white text-white shadow-lg' : 'bg-white border-surface-alt text-muted'}`}>
                                            {step.icon}
                                        </div>
                                        <span className={`text-[10px] sm:text-xs font-bold mt-3 whitespace-nowrap ${idx <= currentStepIndex ? 'text-primary' : 'text-muted'}`}>{step.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Order Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-white p-5 rounded-2xl border border-border/50">
                                <p className="text-[10px] font-bold text-muted uppercase mb-1">Kargo Takip No</p>
                                <p className="text-sm font-bold text-primary">{order.cargoTrackingNumber || 'Henüz atanmadı'}</p>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-border/50">
                                <p className="text-[10px] font-bold text-muted uppercase mb-1">Tahmini Teslimat</p>
                                <p className="text-sm font-bold text-primary">2-4 İş Günü</p>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-border/50">
                                <p className="text-[10px] font-bold text-muted uppercase mb-1">Ödeme Durumu</p>
                                <p className={`text-sm font-bold ${order.paymentStatus === 'completed' ? 'text-success' : 'text-orange-500'}`}>
                                    {order.paymentStatus === 'completed' ? 'Ödendi' : 'Ödeme Bekleniyor'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
