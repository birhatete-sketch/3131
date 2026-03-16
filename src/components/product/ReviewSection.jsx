import { useState, useEffect } from 'react';
import { reviewAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Star, Camera, X } from 'lucide-react';

export default function ReviewSection({ productId, onStatsUpdate }) {
    const { customer } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState({ avgRating: 0, totalReviews: 0, ratingDistribution: {} });
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ customerName: '', rating: 5, title: '', comment: '' });
    const [selectedImages, setSelectedImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);

    const fetchReviews = async () => {
        try {
            const { data } = await reviewAPI.getByProduct(productId);
            if (data.success) {
                setReviews(data.reviews || []);
                const fetchedStats = data.stats || { avgRating: 0, totalReviews: 0, ratingDistribution: {} };
                setStats(fetchedStats);
                if (onStatsUpdate) {
                    onStatsUpdate(fetchedStats);
                }
            }
        } catch { } finally { setLoading(false); }
    };

    useEffect(() => { fetchReviews(); }, [productId]);

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + selectedImages.length > 5) {
            return toast.error('En fazla 5 resim yükleyebilirsiniz');
        }
        setSelectedImages(prev => [...prev, ...files]);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => setImagePreviews(prev => [...prev, ev.target.result]);
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!customer) {
            toast.error('Yorum yazmak için giriş yapmalı ve bu ürünü satın almış olmalısınız.');
            return;
        }
        if (!form.customerName || !form.comment) return toast.error('Ad ve yorum zorunludur');
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('customerName', form.customerName);
            formData.append('rating', form.rating);
            formData.append('title', form.title);
            formData.append('comment', form.comment);
            selectedImages.forEach(img => formData.append('images', img));

            const { data } = await reviewAPI.create(productId, formData);
            if (data.success) {
                toast.success('Yorumunuz eklendi!');
                setForm({ customerName: '', rating: 5, title: '', comment: '' });
                setSelectedImages([]);
                setImagePreviews([]);
                setShowForm(false);
                fetchReviews();
            }
        } catch (e) {
            toast.error(e.response?.data?.error || 'Yorum eklenirken hata oluştu');
        } finally { setSubmitting(false); }
    };

    const StarRating = ({ rating, onChange, size = 20 }) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(star => (
                <button key={star} type="button" onClick={() => onChange?.(star)} className="transition-colors">
                    {star <= rating
                        ? <Star fill="currentColor" size={size} className="text-yellow-400"  />
                        : <Star size={size} className="text-gray-300 hover:text-yellow-300" />
                    }
                </button>
            ))}
        </div>
    );

    const StaticStars = ({ rating, size = 14 }) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(star => (
                <span key={star}>
                    {star <= Math.round(rating)
                        ? <Star fill="currentColor" size={size} className="text-yellow-400"  />
                        : <Star size={size} className="text-gray-300" />
                    }
                </span>
            ))}
        </div>
    );

    const timeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Bugün';
        if (days === 1) return 'Dün';
        if (days < 30) return `${days} gün önce`;
        if (days < 365) return `${Math.floor(days / 30)} ay önce`;
        return `${Math.floor(days / 365)} yıl önce`;
    };

    const [selectedLightboxImages, setSelectedLightboxImages] = useState(null);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const openLightbox = (images, index) => {
        setSelectedLightboxImages(images);
        setLightboxIndex(index);
    };

    const nextImage = (e) => {
        e.stopPropagation();
        setLightboxIndex((prev) => (prev + 1) % selectedLightboxImages.length);
    };

    const prevImage = (e) => {
        e.stopPropagation();
        setLightboxIndex((prev) => (prev - 1 + selectedLightboxImages.length) % selectedLightboxImages.length);
    };

    return (
        <section className="mt-16 pt-16 border-t border-border" id="reviews">
            <div className="flex items-center justify-between mb-8">
                <h2 className="font-display text-2xl font-bold text-primary">
                    Değerlendirmeler
                    {stats.totalReviews > 0 && <span className="text-muted font-normal text-lg ml-2">({stats.totalReviews})</span>}
                </h2>
                <button onClick={() => {
                    if (!customer) {
                        toast.error('Yorum yazmak için giriş yapmalı ve bu ürünü satın almış olmalısınız.');
                    } else {
                        setShowForm(!showForm);
                        if (!form.customerName) {
                            setForm(f => ({ ...f, customerName: `${customer.firstName} ${customer.lastName}`.trim() }));
                        }
                    }
                }}
                    className="px-5 py-2.5 bg-primary hover:bg-secondary text-white text-sm font-semibold rounded-xl transition-colors">
                    Yorum Yaz
                </button>
            </div>

            {/* Stats */}
            {stats.totalReviews > 0 && (
                <div className="flex flex-col sm:flex-row gap-6 bg-surface-alt rounded-2xl p-6 mb-8">
                    <div className="text-center sm:text-left sm:pr-8 sm:border-r border-border">
                        <div className="text-4xl font-bold text-primary">{stats.avgRating}</div>
                        <StaticStars rating={stats.avgRating} size={18} />
                        <p className="text-xs text-muted mt-1">{stats.totalReviews} değerlendirme</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                        {[5, 4, 3, 2, 1].map(star => {
                            const count = stats.ratingDistribution?.[star] || 0;
                            const pct = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                            return (
                                <div key={star} className="flex items-center gap-2">
                                    <span className="text-xs text-muted w-4">{star}</span>
                                    <Star fill="currentColor" size={12} className="text-yellow-400"  />
                                    <div className="flex-1 bg-border/30 rounded-full h-2 overflow-hidden">
                                        <div className="bg-yellow-400 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="text-xs text-muted w-8 text-right">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Review Form */}
            {showForm && customer && (
                <form onSubmit={handleSubmit} className="bg-white border border-border/50 rounded-2xl p-6 mb-8 animate-fadeIn">
                    <h3 className="font-semibold text-primary mb-4">Yorum Yaz</h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-muted">Puanınız:</span>
                            <StarRating rating={form.rating} onChange={(r) => setForm(prev => ({ ...prev, rating: r }))} size={24} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-muted mb-1.5">Adınız (Sistem)</label>
                                <input type="text" value={form.customerName} readOnly
                                    className="w-full px-4 py-2.5 text-sm border border-border rounded-xl bg-surface-alt/50 cursor-not-allowed text-muted" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted mb-1.5">Başlık</label>
                                <input type="text" value={form.title} onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-4 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:border-accent bg-surface-alt" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-muted mb-1.5">Yorumunuz *</label>
                            <textarea value={form.comment} onChange={(e) => setForm(prev => ({ ...prev, comment: e.target.value }))} rows={4}
                                className="w-full px-4 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:border-accent bg-surface-alt resize-none" />
                        </div>

                        {/* Resim yükleme */}
                        <div>
                            <label className="block text-xs font-medium text-muted mb-2">Fotoğraf Ekle (maks. 5)</label>
                            <div className="flex flex-wrap gap-3">
                                {imagePreviews.map((src, i) => (
                                    <div key={i} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-border">
                                        <img src={src} alt="" className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => removeImage(i)}
                                            className="absolute top-1 right-1 w-5 h-5 bg-danger text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                                {selectedImages.length < 5 && (
                                    <label className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-colors">
                                        <Camera size={20} className="text-muted" />
                                        <span className="text-[10px] text-muted mt-0.5">Ekle</span>
                                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button type="submit" disabled={submitting}
                                className="px-6 py-2.5 bg-accent hover:bg-accent-dark text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
                                {submitting ? 'Gönderiliyor...' : 'Yorum Gönder'}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)}
                                className="px-6 py-2.5 border border-border text-muted text-sm font-medium rounded-xl hover:bg-surface-alt transition-colors">
                                İptal
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* Reviews List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="p-4 rounded-2xl border border-border/50">
                            <div className="skeleton h-4 w-1/4 rounded mb-3" />
                            <div className="skeleton h-4 w-full rounded mb-2" />
                            <div className="skeleton h-4 w-3/4 rounded" />
                        </div>
                    ))}
                </div>
            ) : reviews.length === 0 ? (
                <div className="text-center py-12 bg-surface-alt rounded-2xl">
                    <p className="text-muted text-sm">Henüz yorum yapılmamış. İlk yorumu siz yapın!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <div key={review._id} className="p-5 bg-white rounded-2xl border border-border/50">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-sm text-primary">{review.customerName}</span>
                                        {review.isVerifiedPurchase && (
                                            <span className="text-[10px] bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded-full font-medium">✓ Onaylı Alıcı</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <StaticStars rating={review.rating} />
                                        <span className="text-[11px] text-muted">{timeAgo(review.createdAt)}</span>
                                    </div>
                                </div>
                            </div>
                            {review.title && <h4 className="font-medium text-sm text-primary mt-3">{review.title}</h4>}
                            <p className="text-sm text-muted mt-2 leading-relaxed">{review.comment}</p>

                            {/* Yorum görselleri */}
                            {review.images?.length > 0 && (
                                <div className="flex gap-2 mt-4">
                                    {review.images.map((img, i) => (
                                        <button key={i} onClick={() => openLightbox(review.images, i)}
                                            className="w-16 h-16 rounded-xl overflow-hidden border border-border hover:border-accent transition-all hover:scale-105">
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Admin Yanıtı (Müşteri ekranında görünmesi için) */}
                            {review.adminReply && (
                                <div className="mt-4 p-4 bg-surface-alt rounded-xl border-l-4 border-accent">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-[10px] font-bold">A</div>
                                        <span className="text-xs font-bold text-primary">Satıcı Yanıtı</span>
                                    </div>
                                    <p className="text-xs text-muted leading-relaxed italic">"{review.adminReply}"</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox Modal */}
            {selectedLightboxImages && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setSelectedLightboxImages(null)}>
                    <button className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors p-2" onClick={() => setSelectedLightboxImages(null)}>
                        <X size={32} />
                    </button>

                    {selectedLightboxImages.length > 1 && (
                        <>
                            <button className="absolute left-4 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white transition-colors" onClick={prevImage}>
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button className="absolute right-4 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white transition-colors" onClick={nextImage}>
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </>
                    )}

                    <div className="max-w-4xl w-full h-full flex flex-col items-center justify-center gap-4" onClick={e => e.stopPropagation()}>
                        <img
                            src={selectedLightboxImages[lightboxIndex]}
                            className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl"
                            alt="Büyük Görsel"
                        />
                        <div className="text-white/60 text-sm font-medium">
                            {lightboxIndex + 1} / {selectedLightboxImages.length}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
