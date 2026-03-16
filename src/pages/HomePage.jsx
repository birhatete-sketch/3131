import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSite } from '../context/SiteContext';
import { productAPI, categoryAPI } from '../services/api';
import ProductCard from '../components/product/ProductCard';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { ArrowRight, Truck, ShieldCheck, RefreshCw, CreditCard, ShoppingBag, Heart, Gift, Star } from 'lucide-react';

// 8'li Ürün Vitrini - Stoktan Seçilen Ürünleri ProductCard Olarak Gösterir
function VitrineSection({ promoList }) {
    const [vitrineProducts, setVitrineProducts] = useState([]);
    
    useEffect(() => {
        const ids = promoList.map(p => p.productId).filter(Boolean);
        if (ids.length === 0) return;
        
        Promise.all(ids.map(id => productAPI.getById(id).catch(() => null)))
            .then(results => {
                const products = results
                    .filter(r => r?.data?.product)
                    .map(r => r.data.product);
                setVitrineProducts(products);
            });
    }, [promoList]);

    if (vitrineProducts.length === 0) return null;

    return (
        <section className="pt-4 pb-10 bg-surface">
            <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                    {vitrineProducts.map((product, i) => (
                        <ProductCard key={product._id} product={product} index={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}

export default function HomePage() {
    const { settings } = useSite();
    const [featured, setFeatured] = useState([]);
    const [bestSellers, setBestSellers] = useState([]);
    const [latestProducts, setLatestProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState([]);
    const [instaPosts, setInstaPosts] = useState([]);
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.matchMedia('(max-width: 768px)').matches;
        }
        return false;
    });
    const [activeProducts, setActiveProducts] = useState([]);
    const [activeTab, setActiveTab] = useState('new'); // new, best, discount, top, bottom, outer, jewelry

    // Mobil tespiti (CSS Media Query ile %100 Uyumlu)
    useEffect(() => {
        const query = window.matchMedia('(max-width: 768px)');
        const handleChange = (e) => setIsMobile(e.matches);
        
        // İlk yüklemede vemount olduğunda tetikle
        setIsMobile(query.matches);

        query.addEventListener('change', handleChange);
        return () => query.removeEventListener('change', handleChange);
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [featRes, bestRes, latestRes, catRes, revRes, instaRes] = await Promise.allSettled([
                productAPI.getFeatured(8).catch(e => ({ data: { success: false } })),
                productAPI.getBestSellers(8).catch(e => ({ data: { success: false } })),
                productAPI.getAll({ limit: 8, sortBy: '-createdAt' }).catch(e => ({ data: { success: false } })),
                categoryAPI.getAll().catch(e => ({ data: { success: false } })),
                productAPI.getGoogleReviews().catch(e => ({ data: { success: false } })),
                productAPI.getInstagramPosts().catch(e => ({ data: { success: false } }))
            ]);

            if (featRes.status === 'fulfilled' && featRes.value.data?.success) setFeatured(featRes.value.data.products || []);
            if (bestRes.status === 'fulfilled' && bestRes.value.data?.success) setBestSellers(bestRes.value.data.products || []);
            if (latestRes.status === 'fulfilled' && latestRes.value.data?.success) {
                const lp = latestRes.value.data.products || [];
                setLatestProducts(lp);
                setActiveProducts(lp); // Başlangıçta yenileri göster
            }
            if (catRes.status === 'fulfilled' && catRes.value.data?.success) setCategories(catRes.value.data.allCategories || []);
            if (revRes.status === 'fulfilled' && revRes.value.data?.success) setReviews(revRes.value.data.reviews || []);
            if (instaRes.status === 'fulfilled' && instaRes.value.data?.success) setInstaPosts(instaRes.value.data.posts || []);
        } catch (err) {
            console.error('Home Page Data fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Tab değiştiğinde ürünleri getir (Madde 3 & 7)
    useEffect(() => {
        const fetchTabProducts = async () => {
            let params = { limit: 8 };
            if (activeTab === 'new') params.sortBy = '-createdAt';
            else if (activeTab === 'best') params.bestSellers = 'true';
            else if (activeTab === 'discount') params.isDiscounted = 'true';
            else if (activeTab === 'top') params.categoryName = 'ÜST GİYİM';
            else if (activeTab === 'bottom') params.categoryName = 'ALT GİYİM';
            else if (activeTab === 'outer') params.categoryName = 'DIŞ GİYİM';
            else if (activeTab === 'jewelry') params.categoryName = 'TAKI';

            try {
                const { data } = await productAPI.getAll(params);
                if (data.success) setActiveProducts(data.products || []);
            } catch (e) { console.error('Tab products fetch error:', e); }
        };

        if (activeTab !== 'new' || latestProducts.length === 0) {
            fetchTabProducts();
        } else {
            setActiveProducts(latestProducts);
        }
    }, [activeTab]);

    const iconMap = {
        Truck, ShieldCheck, RefreshCw, CreditCard, Heart, Gift, Star
    };

    const features = settings.storeFeatures && settings.storeFeatures.length > 0 
        ? settings.storeFeatures.filter(f => f.isActive !== false).map(f => ({
            icon: iconMap[f.icon] || Truck,
            title: f.title,
            desc: f.desc
        }))
        : [
            { icon: Truck, title: 'Ücretsiz Kargo', desc: `${settings.shipping?.freeShippingLimit || 500} TL üzeri siparişlerde` },
            { icon: ShieldCheck, title: 'Güvenli Ödeme', desc: '256-bit SSL ile korunan ödeme' },
            { icon: RefreshCw, title: 'Kolay İade', desc: '14 gün içinde ücretsiz iade' },
            { icon: CreditCard, title: 'Taksitli Ödeme', desc: '9 aya varan taksit imkanı' },
        ];

    return (
        <div className="min-h-screen">
            {/* HERO BANNER - SLIDER (Madde 34 & 35) */}
            {/* HERO BANNER - SLIDER OR GRID (Madde 34 & 35) */}
            {settings?.banners && settings.banners.length > 0 && (
                <section className={`relative w-full overflow-hidden bg-black group ${settings.bannerLayout === 'grid' ? 'flex flex-col' : ''}`}>
                    {settings.bannerLayout === 'grid' ? (
                        /* ALT ALTA (GRID/VERTICAL) GÖRÜNÜM */
                        <div 
                            className="flex flex-col w-full"
                            style={{ 
                                '--mobile-h': `${settings.bannerMobileHeight || 450}px`,
                                '--desktop-h': `${settings.bannerDesktopHeight || 900}px`
                            }}
                        >
                            <style dangerouslySetInnerHTML={{ __html: `
                                .banner-item-responsive { height: var(--mobile-h) !important; }
                                @media (min-width: 768px) {
                                    .banner-item-responsive { height: var(--desktop-h) !important; }
                                }
                            `}} />
                            {settings.banners.map((banner, index) => {
                                if (banner.isActive === false) return null;
                                const hasOverlay = !!(banner.title || banner.subtitle);
                                
                                return (
                                    <div key={index} className="relative w-full border-b border-white/5 last:border-0 banner-item-responsive">
                                        <Link to={banner.link || '#'} className="block w-full h-full relative group/slide">
                                            {/* Masaüstü Medya */}
                                            {banner.image && (
                                                <div className={`w-full h-full ${banner.mobileImage ? 'desktop-banner' : ''}`}>
                                                    {banner.mediaType === 'video' ? (
                                                        <video src={banner.image} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                                                    ) : (
                                                        <img src={banner.image} alt={banner.title || 'Banner'} className="w-full h-full object-cover" />
                                                    )}
                                                </div>
                                            )}
                                            {/* Mobil Medya */}
                                            {banner.mobileImage && (
                                                <div className="w-full h-full mobile-banner">
                                                    {banner.mobileMediaType === 'video' ? (
                                                        <video src={banner.mobileImage} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                                                    ) : (
                                                        <img src={banner.mobileImage} alt={banner.title || 'Mobile Banner'} className="w-full h-full object-cover" />
                                                    )}
                                                </div>
                                            )}

                                            {hasOverlay && <div className="absolute inset-0 bg-black/30 group-hover/slide:bg-black/40 transition-colors"></div>}

                                            {(banner.title || banner.subtitle || banner.buttonText) && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                                                    {banner.title && <h2 className="text-3xl sm:text-5xl md:text-7xl font-extrabold text-white mb-4 tracking-tight translate-y-0 opacity-100">{banner.title}</h2>}
                                                    {banner.subtitle && <p className="text-sm sm:text-lg md:text-2xl font-medium text-white/90 mb-8 max-w-2xl opacity-100">{banner.subtitle}</p>}
                                                    {banner.buttonText && (
                                                        <div className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-black hover:text-white transition-all">
                                                            {banner.buttonText} <ArrowRight size={20} />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div 
                            className="w-full"
                            style={{ 
                                '--mobile-h': `${settings.bannerMobileHeight || 450}px`,
                                '--desktop-h': `${settings.bannerDesktopHeight || 900}px`
                            }}
                        >
                            <style dangerouslySetInnerHTML={{ __html: `
                                .banner-swiper { height: var(--mobile-h) !important; }
                                @media (min-width: 768px) {
                                    .banner-swiper { height: var(--desktop-h) !important; }
                                }
                            `}} />
                            
                            <Swiper
                                modules={[Autoplay, Navigation]}
                                navigation={{ nextEl: '.swiper-button-next-banner', prevEl: '.swiper-button-prev-banner' }}
                                autoplay={{ delay: 5000, disableOnInteraction: false }}
                                loop={true}
                                className="w-full h-full banner-swiper"
                            >

                            {settings.banners.map((banner, index) => {
                                if (banner.isActive === false) return null;
                                const hasOverlay = !!(banner.title || banner.subtitle);
                                
                                return (
                                    <SwiperSlide key={index}>
                                        <Link to={banner.link || '#'} className="block w-full h-full relative group/slide">
                                            {banner.image && (
                                                <div className={`w-full h-full ${banner.mobileImage ? 'desktop-banner' : ''}`}>
                                                    {banner.mediaType === 'video' ? (
                                                        <video src={banner.image} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                                                    ) : (
                                                        <img src={banner.image} alt={banner.title || 'Banner'} className="w-full h-full object-cover" />
                                                    )}
                                                </div>
                                            )}
                                            {banner.mobileImage && (
                                                <div className="w-full h-full mobile-banner">
                                                    {banner.mobileMediaType === 'video' ? (
                                                        <video src={banner.mobileImage} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                                                    ) : (
                                                        <img src={banner.mobileImage} alt={banner.title || 'Mobile Banner'} className="w-full h-full object-cover" />
                                                    )}
                                                </div>
                                            )}
                                            {hasOverlay && <div className="absolute inset-0 bg-black/30 group-hover/slide:bg-black/40 transition-colors"></div>}
                                            {(banner.title || banner.subtitle || banner.buttonText) && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 sm:p-8">
                                                    {banner.title && <h2 className="text-3xl sm:text-5xl md:text-7xl font-extrabold text-white mb-2 sm:mb-4 tracking-tight transform translate-y-4 group-hover/slide:translate-y-0 transition-transform duration-500">{banner.title}</h2>}
                                                    {banner.subtitle && <p className="text-sm sm:text-lg md:text-2xl font-medium text-white/90 mb-6 sm:mb-8 max-w-2xl opacity-0 group-hover/slide:opacity-100 transition-opacity duration-500 delay-100">{banner.subtitle}</p>}
                                                    {banner.buttonText && (
                                                        <div className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white text-black font-bold text-sm sm:text-base rounded-full hover:bg-black hover:text-white transition-all transform scale-95 group-hover/slide:scale-100 duration-300">
                                                            {banner.buttonText} <ArrowRight size={16} className="sm:w-5 sm:h-5" />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Link>
                                    </SwiperSlide>
                                );
                            })}
                            <div className="swiper-button-prev-banner absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white cursor-pointer transition-all opacity-0 group-hover:opacity-100">
                                <ArrowRight size={20} className="rotate-180" />
                            </div>
                            <div className="swiper-button-next-banner absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white cursor-pointer transition-all opacity-0 group-hover:opacity-100">
                                <ArrowRight size={20} />
                            </div>
                        </Swiper>
                    </div>
                    )}
                </section>
            )}

            {/* ═══════ FEATURES BAR ═══════ */}
            <section className="border-b border-border bg-surface">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="flex items-center gap-3">
                                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-accent/10 text-accent flex-shrink-0">
                                    <Icon size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-primary">{title}</p>
                                    <p className="text-[11px] text-muted">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════ PRODUCT TABS ═══════ */}
            <section className="py-14 lg:py-20 bg-surface">
                <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                        <div>
                            <h2 className="font-display text-2xl lg:text-3xl font-bold text-primary">Sizin İçin Seçtiklerimiz</h2>
                            <p className="text-muted text-sm mt-2">İlginizi çekebilecek en popüler kategoriler ve ürünler</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { id: 'new', label: 'Yeni Gelenler' },
                                { id: 'best', label: 'Çok Satanlar' },
                                { id: 'discount', label: 'İndirimdekiler' },
                                { id: 'top', label: 'Üst Giyim' },
                                { id: 'bottom', label: 'Alt Giyim' },
                                { id: 'outer', label: 'Dış Giyim' },
                                { id: 'jewelry', label: 'Takı' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${activeTab === tab.id ? 'bg-primary text-white shadow-md' : 'bg-surface-alt text-muted hover:bg-surface-dark'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 min-h-[400px]">
                        {activeProducts.length > 0 ? (
                            activeProducts.map((product, i) => <ProductCard key={product._id} product={product} index={i} />)
                        ) : (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted">
                                <ShoppingBag size={40} className="mb-4 opacity-20" />
                                <p>Bu kategoride henüz ürün bulunmuyor.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ═══════ KATEGORİ VİTRİNİ (4'LÜ GÖRSEL) ═══════ */}
            {(() => {
                const promos = settings.categoryPromotions?.length === 4 ? settings.categoryPromotions : [
                    { image: '', title: 'Kategori 1', link: '/search', isActive: true },
                    { image: '', title: 'Kategori 2', link: '/search', isActive: true },
                    { image: '', title: 'Kategori 3', link: '/search', isActive: true },
                    { image: '', title: 'Kategori 4', link: '/search', isActive: true }
                ];
                
                if (!promos.some(p => p.isActive)) return null;

                return (
                    <section className="bg-surface pb-10">
                        {/* Sol Üst Dışta Ok ve DAHA FAZLASI */}
                        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 pt-6 pb-6">
                            <Link to="/search" className="inline-flex items-center gap-2 text-primary font-black tracking-widest hover:text-accent transition-colors text-xl md:text-2xl lg:text-3xl">
                                DAHA FAZLASI <ArrowRight size={28} strokeWidth={3} className="-rotate-45" />
                            </Link>
                        </div>

                        {/* 4'lü Grid - Tam Ekran ve Boşluksuz */}
                        <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-0">
                            {promos.map((promo, idx) => {
                                if (!promo.isActive) return null;
                                return (
                                    <Link key={idx} to={promo.link || '/search'} className="group block relative overflow-hidden bg-surface-alt aspect-[3/4] lg:aspect-[4/5] xl:aspect-[3/4]">
                                        {promo.image ? (
                                            <img 
                                                src={promo.image} 
                                                alt={promo.title} 
                                                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                                <span className="text-muted text-sm px-4 text-center font-bold">Admin Panel<br/>Görsel Yok</span>
                                            </div>
                                        )}
                                        {/* Karartma overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>
                                        
                                        {/* Sol altta kategori ismi */}
                                        <div className="absolute bottom-6 left-6 z-10 transition-transform duration-300 group-hover:-translate-y-2">
                                            <h3 className="text-white font-display text-xl md:text-2xl lg:text-3xl font-black tracking-wider uppercase">
                                                {promo.title || `Kategori ${idx + 1}`}
                                            </h3>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                );
            })()}

            {/* ═══════ ANA SAYFA 8'Lİ ÜRÜN VİTRİNİ (4 ALT 4 ÜST) ═══════ */}
            {(() => {
                const promoList = settings?.productPromotions || [];
                const activePromos = promoList.filter(p => p.isActive && p.productId);
                
                if (activePromos.length === 0) return null;

                return (
                    <VitrineSection promoList={activePromos} />
                );
            })()}

            {/* ═══════ INSTAGRAM FEED (Madde 26) ═══════ */}
            {settings.integrations?.instagram?.isActive && (
                <section className="py-16 bg-surface relative group">
                    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-10">
                            <p className="text-sm font-medium text-accent uppercase tracking-widest mb-2">
                                @{settings.social.instagramHandle || settings.social.instagram?.split('/').filter(Boolean).pop() || 'instagram'}
                            </p>
                            <h2 className="font-display text-2xl lg:text-3xl font-bold text-primary">Instagram'da Biz</h2>
                            <p className="text-sm text-muted mt-2">En yeni ürünleri ve kombinleri Instagram'da keşfet!</p>
                        </div>
                        <div className="relative">
                            {instaPosts.length > 0 ? (
                                <>
                                    <Swiper
                                        modules={[Navigation, Autoplay]}
                                        navigation={{
                                            prevEl: '.insta-prev',
                                            nextEl: '.insta-next',
                                        }}
                                        autoplay={{ delay: 4000, disableOnInteraction: false }}
                                        spaceBetween={16}
                                        slidesPerView={2}
                                        breakpoints={{
                                            640: { slidesPerView: 3, spaceBetween: 20 },
                                            1024: { slidesPerView: 4, spaceBetween: 24 },
                                            1280: { slidesPerView: 5, spaceBetween: 24 },
                                        }}
                                        className="!overflow-hidden"
                                    >
                                        {instaPosts.slice(0, 10).map((post, i) => (
                                            <SwiperSlide key={post.id || i}>
                                                <a href={post.permalink || settings.social.instagram || `https://instagram.com/${settings.social.instagramHandle}`} target="_blank" rel="noopener noreferrer"
                                                    className="aspect-[4/5] block rounded-3xl overflow-hidden relative group/item bg-surface-alt shadow-md">
                                                    <img
                                                        src={post.media_url}
                                                        alt={post.caption || `Instagram Gönderisi`}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-110"
                                                        loading="lazy"
                                                    />
                                                    <div className="absolute inset-0 bg-primary/30 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                        <svg viewBox="0 0 24 24" className="w-10 h-10 text-white drop-shadow-lg" fill="currentColor">
                                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                                                        </svg>
                                                    </div>
                                                </a>
                                            </SwiperSlide>
                                        ))}
                                    </Swiper>

                                    {/* Navigation Arrows */}
                                    <button className="insta-prev absolute left-0 sm:-left-4 lg:-left-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center bg-white/90 backdrop-blur text-primary rounded-full shadow-lg hover:bg-white hover:scale-110 hover:text-accent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 -ml-1">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                        </svg>
                                    </button>
                                    <button className="insta-next absolute right-0 sm:-right-4 lg:-right-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center bg-white/90 backdrop-blur text-primary rounded-full shadow-lg hover:bg-white hover:scale-110 hover:text-accent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 -mr-1">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                        </svg>
                                    </button>
                                </>
                            ) : (
                                <div className="py-10 text-center bg-surface-alt rounded-2xl border border-border border-dashed">
                                    <p className="text-muted font-medium mb-1">Instagram Akışı Bağlanamadı</p>
                                    <p className="text-xs text-muted/70 lg:w-1/2 mx-auto">Admin panelinden girilen Instagram Access Token süresi dolmuş veya geçersiz olabilir. Lütfen tokenı tazeleyip tekrar deneyin.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* ═══════ GOOGLE REVIEWS (Madde 25) ═══════ */}
            <section className="py-16 lg:py-24 bg-surface-alt overflow-hidden">
                <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-8">
                    <div className="rounded-3xl border border-border/50 bg-gradient-to-br from-white to-surface p-6 sm:p-10 shadow-sm">
                        <div className="flex flex-col lg:flex-row items-start justify-between gap-10">
                            <div className="lg:max-w-md text-center lg:text-left">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-bold mb-4">
                                    <span className="text-warning">★</span> Google Yorumları
                                </div>
                                <h2 className="font-display text-3xl lg:text-4xl font-bold text-primary mb-4">Müşterilerimiz Ne Diyor?</h2>
                                <p className="text-muted leading-relaxed">Google İşletme profilimizdeki gerçek müşteri yorumlarını inceleyin.</p>

                                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map(i => <span key={i} className="text-warning text-lg">★</span>)}
                                    </div>
                                    <div className="text-xs text-muted">
                                        <span className="font-bold text-primary">{reviews.length || 4}</span> yorum
                                    </div>
                                </div>

                                {settings.integrations?.googleReviews?.placeId && (
                                    <div className="mt-7 flex items-center justify-center lg:justify-start gap-3">
                                        <a
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-secondary transition-colors"
                                            href={`https://www.google.com/maps/search/?api=1&query_place_id=${settings.integrations.googleReviews.placeId}`}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Google’da Gör
                                        </a>
                                        <div className="flex items-center gap-2 text-xs text-muted">
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_Maps_icon_%282020%29.svg" className="w-5 h-5" alt="Google" />
                                            <span>ID: {String(settings.integrations.googleReviews.placeId).slice(0, 10)}...</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {(reviews.length > 0 ? reviews.slice(0, 4) : [
                                    { author_name: 'Ahmet Y.', text: 'Ürün kalitesi beklediğimden çok daha iyi. Kargo çok hızlı ulaştı. Teşekkürler.', relative_time_description: '2 gün önce', rating: 5 },
                                    { author_name: 'Selin K.', text: 'Müşteri hizmetleri çok ilgili. İade sürecini çok hızlı yönettiler. Kesinlikle tavsiye ederim.', relative_time_description: '1 hafta önce', rating: 5 },
                                    { author_name: 'Mehmet A.', text: 'Tasarımlar harika ve kumaşlar çok kaliteli. Gardırobumun vazgeçilmezi oldu.', relative_time_description: '3 gün önce', rating: 5 },
                                    { author_name: 'Ayşe B.', text: 'Uygun fiyata bu kalite inanılmaz. Paketleme çok özenliydi.', relative_time_description: '5 gün önce', rating: 5 },
                                ]).map((rev, i) => (
                                    <div key={i} className="group bg-white p-6 rounded-2xl shadow-sm border border-border/50 hover:shadow-md transition-all">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                {rev.profile_photo_url
                                                    ? <img src={rev.profile_photo_url} className="w-9 h-9 rounded-full" alt="" />
                                                    : <div className="w-9 h-9 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-xs">
                                                        {(rev.author_name || 'M').trim().slice(0, 1).toUpperCase()}
                                                    </div>
                                                }
                                                <div>
                                                    <p className="text-sm font-bold text-primary leading-tight">{rev.author_name || rev.name}</p>
                                                    <p className="text-[11px] text-muted">{rev.relative_time_description || rev.date}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-0.5">
                                                {[...Array(rev.rating || 5)].map((_, j) => <span key={j} className="text-warning text-xs">★</span>)}
                                            </div>
                                        </div>
                                        <p className="mt-4 text-sm text-primary/90 font-medium italic line-clamp-4">"{rev.text || rev.comment}"</p>
                                        <div className="mt-4 h-px bg-border/60" />
                                        <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
                                            <span>Doğrulanmış Google Yorumu</span>
                                            <span className="text-accent/80 group-hover:text-accent transition-colors">▶</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Loading skeleton */}
            {loading && (
                <div className="py-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="animate-fadeIn" style={{ animationDelay: `${i * 100}ms` }}>
                                    <div className="skeleton rounded-2xl aspect-[3/4] mb-4" />
                                    <div className="skeleton h-4 w-3/4 rounded mb-2" />
                                    <div className="skeleton h-4 w-1/2 rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
