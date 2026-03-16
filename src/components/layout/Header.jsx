import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSite } from '../../context/SiteContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { categoryAPI, productAPI } from '../../services/api';
import { Search, Heart, User, Menu, X, ChevronDown } from 'lucide-react';

// ── Geri Sayım Bileşeni ──────────────────────────────────────
function AnnouncementCountdown({ endDate, label, textColor }) {
    const calc = () => {
        const diff = new Date(endDate) - new Date();
        if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 };
        return {
            d: Math.floor(diff / 86400000),
            h: Math.floor((diff % 86400000) / 3600000),
            m: Math.floor((diff % 3600000) / 60000),
            s: Math.floor((diff % 60000) / 1000),
        };
    };
    const [t, setT] = useState(calc);
    useEffect(() => {
        const id = setInterval(() => setT(calc()), 1000);
        return () => clearInterval(id);
    }, [endDate]);

    const pad = (n) => String(n).padStart(2, '0');

    return (
        <div className="flex flex-col items-center gap-0.5">
            {label && (
                <span className="text-[8px] sm:text-[9px] font-medium tracking-widest uppercase opacity-70" style={{ color: textColor }}>
                    {label}
                </span>
            )}
            <div className="flex items-center gap-0.5 sm:gap-1 font-bold text-[11px] sm:text-[13px] leading-none" style={{ color: textColor }}>
                {t.d > 0 && <><span>{t.d} GÜN</span><span className="opacity-40 mx-0.5">|</span></>}
                <span>{pad(t.h)}</span>
                <span className="opacity-40">:</span>
                <span>{pad(t.m)}</span>
                <span className="opacity-40">:</span>
                <span>{pad(t.s)}</span>
            </div>
        </div>
    );
}

export default function Header() {
    const { settings } = useSite();
    const { cartCount } = useCart();
    const { isLoggedIn, customer } = useAuth();
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [mobileMenu, setMobileMenu] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [expandedMobileCat, setExpandedMobileCat] = useState(null);
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    useEffect(() => {
        categoryAPI.getAll().then(({ data }) => {
            if (data.success) {
                // API doğrudan kök kategorileri döndürüyor, her birinin children[] alt kategorileridir
                setCategories(data.categories || []);
            }
        }).catch(err => {
            console.warn('Header categories fetch failed:', err);
        });
    }, []);

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handler);
        return () => window.removeEventListener('scroll', handler);
    }, []);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        const debounceId = setTimeout(async () => {
            setIsSearching(true);
            try {
                const response = await productAPI.search(searchTerm.trim(), { limit: 5 });
                if (response.data.success) {
                    setSearchResults(response.data.products || []);
                    setShowResults(true);
                }
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(debounceId);
    }, [searchTerm]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
            setSearchOpen(false);
            setSearchTerm('');
            setShowResults(false);
        }
    };

    // Logo settings
    const mobWidth = settings.logoSettings?.mobile?.width || 120;
    const deskWidth = settings.logoSettings?.desktop?.width || 150;
    const mobX = settings.logoSettings?.mobile?.offsetX || 0;
    const mobY = settings.logoSettings?.mobile?.offsetY || 0;
    const deskX = settings.logoSettings?.desktop?.offsetX || 0;
    const deskY = settings.logoSettings?.desktop?.offsetY || 0;
    const logoClasses = "flex-shrink-0 z-10 transition-all duration-300 relative";
    // Removed overflow-x-auto because it clips absolute dropdowns on desktop
    const navClasses = "hidden lg:flex items-center gap-1 xl:gap-2 text-sm font-medium text-primary/80 mx-auto flex-wrap justify-center";
    const actionsClasses = "flex items-center gap-1 sm:gap-1 z-10 ml-auto";

    // API zaten kök kategorileri döndürüyor; children[] alt kategorilerdir
    const rootCategories = categories;
    const getSubCategories = (cat) => cat.children || [];

    return (
        <>
            {/* Announcement Bar */}
            {settings.announcementBar?.isActive && (() => {
                const bar = settings.announcementBar;
                const barHeight = bar.barHeight || 48;
                return (
                    <div
                        className="w-full z-50 overflow-hidden"
                        style={{
                            backgroundColor: bar.bgColor || '#000000',
                            color: bar.textColor || '#ffffff',
                            minHeight: `${barHeight}px`,
                        }}
                    >
                        <div className="w-full mx-auto px-1 sm:px-4 h-full flex flex-wrap sm:flex-nowrap items-center justify-center gap-1.5 sm:gap-3 md:gap-6 py-1" style={{ minHeight: `${barHeight}px` }}>

                            {/* SOL — Duyuru metni */}
                            <div className="flex items-center text-center translate-y-[2px]">
                                {bar.link ? (
                                    <a href={bar.link} className="font-semibold text-[10px] sm:text-[13px] leading-snug hover:opacity-80 transition-opacity whitespace-normal sm:whitespace-nowrap">
                                        {bar.text}
                                    </a>
                                ) : (
                                    <span className="font-semibold text-[10px] sm:text-[13px] leading-snug whitespace-normal sm:whitespace-nowrap">{bar.text}</span>
                                )}
                            </div>

                            {/* ORTA — Geri sayım */}
                            {bar.showCountdown && bar.countdownEndDate && (
                                <div className="flex flex-col items-center justify-center border-l border-r border-white/20 px-2 sm:px-4 md:px-8">
                                    <AnnouncementCountdown
                                        endDate={bar.countdownEndDate}
                                        label={bar.countdownLabel || 'Kampanya Bitimine'}
                                        textColor={bar.textColor || '#ffffff'}
                                    />
                                </div>
                            )}

                            {/* SAĞ — CTA Butonu */}
                            {bar.showCta && (
                                <div className="flex items-center ml-1 sm:ml-0">
                                    <a
                                        href={bar.ctaLink || '/urunler'}
                                        className="inline-flex items-center justify-center px-3 py-1.5 text-[11px] md:text-xs font-bold border transition-all hover:scale-105 active:scale-95 whitespace-nowrap rounded-none"
                                        style={{
                                            backgroundColor: bar.ctaBgColor || '#ffffff',
                                            color: bar.ctaTextColor || '#000000',
                                            borderColor: bar.ctaBgColor || '#ffffff',
                                        }}
                                    >
                                        {bar.ctaText || 'Ürünlere Göz At'}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}

            {/* Main Header */}
            <header className={`sticky top-0 z-50 transition-all duration-300 w-full ${scrolled ? 'shadow-lg backdrop-blur-xl bg-white/95' : 'bg-white'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center h-16 lg:h-20 relative w-full">
                        {/* Mobile menu button */}
                        <button onClick={() => setMobileMenu(!mobileMenu)} className="lg:hidden p-2 -ml-2 text-primary hover:text-accent transition-colors order-1 z-10">
                            {mobileMenu ? <X size={24} /> : <Menu size={24} />}
                        </button>

                        {/* Logo */}
                        <Link
                            to="/"
                            className={`${logoClasses} dynamic-logo-wrapper`}
                            style={{
                                '--mob-x': `${mobX}px`,
                                '--mob-y': `${mobY}px`,
                                '--lg-x': `${deskX}px`,
                                '--lg-y': `${deskY}px`,
                                '--mob-w': `${mobWidth}px`,
                                '--lg-w': `${deskWidth}px`
                            }}
                        >
                            <style>{`
                                .dynamic-logo-wrapper { transform: translate(var(--mob-x), var(--mob-y)); transition: transform 0.3s ease; }
                                .dynamic-logo { width: var(--mob-w); object-fit: contain; }
                                @media (min-width: 1024px) {
                                    .dynamic-logo-wrapper { transform: translate(var(--lg-x), var(--lg-y)) !important; }
                                    .dynamic-logo { width: var(--lg-w); }
                                }
                            `}</style>
                            {settings.logo ? (
                                <img src={settings.logo} alt={settings.siteName} className="dynamic-logo h-auto max-h-12 lg:max-h-16 transition-all duration-300" />
                            ) : (
                                <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-primary">
                                    <span className="font-display">{settings.siteName || 'NOVA'}</span>
                                </h1>
                            )}
                        </Link>

                        {/* Desktop Nav */}
                        <nav className={navClasses} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            onMouseLeave={() => setOpenDropdown(null)}>
                            <style>{`
                                nav::-webkit-scrollbar { display: none; }
                                .nav-dropdown {
                                    position: absolute;
                                    top: 100%;
                                    left: 0;
                                    background: white;
                                    border: 1px solid #f0f0f0;
                                    border-radius: 12px;
                                    box-shadow: 0 8px 30px rgba(0,0,0,0.12);
                                    min-width: 180px;
                                    padding: 6px;
                                    z-index: 50;
                                    animation: fadeDown 0.15s ease;
                                }
                                .nav-sub-dropdown {
                                    display: none;
                                    position: absolute;
                                    top: -7px;
                                    left: 100%;
                                    background: white;
                                    border: 1px solid #f0f0f0;
                                    border-radius: 12px;
                                    box-shadow: 0 8px 30px rgba(0,0,0,0.12);
                                    min-width: 180px;
                                    padding: 6px;
                                    z-index: 51;
                                    margin-left: -5px;
                                    animation: fadeRight 0.15s ease;
                                }
                                .nav-sub-item:hover > .nav-sub-dropdown {
                                    display: block;
                                }
                                @keyframes fadeDown {
                                    from { opacity: 0; transform: translateY(-6px); }
                                    to   { opacity: 1; transform: translateY(0); }
                                }
                                @keyframes fadeRight {
                                    from { opacity: 0; transform: translateX(-6px); }
                                    to   { opacity: 1; transform: translateX(0); }
                                }
                                .nav-item { position: relative; }
                                .nav-sub-item { position: relative; }
                                .nav-link {
                                    display: flex;
                                    align-items: center;
                                    gap: 3px;
                                    padding: 6px 10px;
                                    border-radius: 8px;
                                    white-space: nowrap;
                                    transition: color 0.2s, background 0.2s;
                                    text-decoration: none;
                                    font-size: 13.5px;
                                    font-weight: 500;
                                    color: inherit;
                                }
                                .nav-link:hover { color: var(--color-accent, #000); background: #f5f5f5; }
                            `}</style>

                            {/* Ana Sayfa */}
                            <div className="nav-item">
                                <Link to="/" className="nav-link">ANA SAYFA</Link>
                            </div>

                            {/* Yeni Gelenler */}
                            {settings.navbarLinks?.newArrivalsActive !== false && (
                                <div className="nav-item">
                                    <Link to="/search?sortBy=-createdAt" className="nav-link">YENİ GELENLER</Link>
                                </div>
                            )}

                            {/* Çok Satanlar */}
                            {settings.navbarLinks?.bestSellersActive !== false && (
                                <div className="nav-item">
                                    <Link to="/search?bestSellers=true" className="nav-link !font-bold text-accent">ÇOK SATANLAR</Link>
                                </div>
                            )}

                            {/* Dinamik Kategoriler — Alt kategoriler varsa dropdown */}
                            {rootCategories.map(category => {
                                const subs = getSubCategories(category);
                                const hasDropdown = subs.length > 0;
                                return (
                                    <div
                                        key={category._id}
                                        className="nav-item"
                                        onMouseEnter={() => hasDropdown && setOpenDropdown(category._id)}
                                        onMouseLeave={() => setOpenDropdown(null)}
                                    >
                                        <Link
                                            to={`/search?categoryName=${encodeURIComponent(category.name)}`}
                                            className="nav-link"
                                        >
                                            {category.name}
                                            {hasDropdown && <ChevronDown size={13} strokeWidth={2.5} />}
                                        </Link>
                                        {hasDropdown && openDropdown === category._id && (
                                            <div className="nav-dropdown">
                                                {subs.map(sub => {
                                                    const deepSubs = sub.children || [];
                                                    const hasDeepSubs = deepSubs.length > 0;
                                                    return (
                                                        <div key={sub._id} className="nav-sub-item">
                                                            <Link
                                                                to={`/search?categoryName=${encodeURIComponent(sub.name)}`}
                                                                onClick={() => !hasDeepSubs && setOpenDropdown(null)}
                                                                className="px-4 py-2.5 text-[13px] font-medium text-gray-800 hover:text-accent hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-between"
                                                            >
                                                                <span>{sub.name}</span>
                                                                {hasDeepSubs && <ChevronDown size={12} className="-rotate-90 text-gray-400" />}
                                                            </Link>
                                                            {hasDeepSubs && (
                                                                <div className="nav-sub-dropdown">
                                                                    {deepSubs.map(deepSub => (
                                                                        <Link
                                                                            key={deepSub._id}
                                                                            to={`/search?categoryName=${encodeURIComponent(deepSub.name)}`}
                                                                            onClick={() => setOpenDropdown(null)}
                                                                            className="block px-4 py-2 text-[13px] font-medium text-gray-800 hover:text-accent hover:bg-gray-50 rounded-lg transition-colors whitespace-nowrap"
                                                                        >
                                                                            {deepSub.name}
                                                                        </Link>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* İndirimdekiler */}
                            {settings.navbarLinks?.discountedActive !== false && (
                                <div className="nav-item">
                                    <Link to="/search?isDiscounted=true" className="nav-link !font-extrabold !text-[#dc2626] hover:!text-[#991b1b] transition-colors">İNDİRİMDEKİLER</Link>
                                </div>
                            )}
                        </nav>

                        {/* Actions */}
                        <div className={actionsClasses}>
                            <button onClick={() => setSearchOpen(!searchOpen)} className="w-9 h-9 flex items-center justify-center text-primary/70 hover:text-accent transition-colors">
                                <Search size={21} strokeWidth={1.8} />
                            </button>
                            <Link to="/favorites" className="w-9 h-9 flex items-center justify-center text-primary/70 hover:text-accent transition-colors">
                                <Heart size={21} strokeWidth={1.8} />
                            </Link>
                            <Link to={isLoggedIn ? '/account' : '/login'} className="w-9 h-9 flex items-center justify-center text-primary/70 hover:text-accent transition-colors">
                                {isLoggedIn && customer?.profilePicture ? (
                                    <div className="w-[22px] h-[22px] rounded-full overflow-hidden border-[2px] border-black flex items-center justify-center">
                                        <img src={customer.profilePicture} alt={customer.firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    </div>
                                ) : (
                                    <User size={21} strokeWidth={1.8} />
                                )}
                            </Link>
                            <Link to="/cart" className="w-9 h-9 flex items-center justify-center text-primary/70 hover:text-accent transition-colors">
                                <div className="relative flex items-center justify-center">
                                    {/* Zarif Alışveriş Çantası İkonu */}
                                    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="hover:scale-105 transition-transform duration-200">
                                        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                                        <path d="M3 6h18" />
                                        <path d="M16 10a4 4 0 0 1-8 0" />
                                    </svg>
                                    {cartCount > 0 && (
                                        <span className="absolute -top-1.5 -right-2 bg-accent text-white text-[9px] font-bold min-w-[15px] h-[15px] flex items-center justify-center rounded-full px-1 shadow-sm border border-white">
                                            {cartCount}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Search Overlay */}
                {searchOpen && (
                    <div className="absolute inset-x-0 top-full bg-white border-t border-border shadow-xl animate-fadeIn z-50">
                        <form onSubmit={handleSearch} className="max-w-2xl mx-auto px-4 py-6 relative">
                            <div className="relative">
                                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Ürün, kategori veya marka ara..." autoFocus
                                    className="w-full px-4 py-3.5 pl-12 text-sm border border-border rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 bg-surface-alt transition-all" />
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                                {searchTerm && (
                                    <button type="button" onClick={() => { setSearchTerm(''); setSearchResults([]); setShowResults(false); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-primary">
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            {/* Autocomplete Dropdown */}
                            {showResults && searchTerm.trim() && (
                                <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-border overflow-hidden z-[60]">
                                    {isSearching ? (
                                        <div className="p-4 text-center text-sm text-gray-500">Aranıyor...</div>
                                    ) : searchResults.length > 0 ? (
                                        <div>
                                            {searchResults.map((product) => (
                                                <Link
                                                    key={product._id}
                                                    to={`/product/${product._id}`}
                                                    onClick={() => {
                                                        setSearchOpen(false);
                                                        setSearchTerm('');
                                                    }}
                                                    className="flex items-center gap-4 p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                                                >
                                                    <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                                                        <img
                                                            src={product.mainImage || product.images?.[0]?.thumbImagePath || product.images?.[0]?.url || 'https://placehold.co/400x600/f8fafc/94a3b8?text=Ürün'}
                                                            alt={product.productName || product.name || 'Ürün'}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => { e.target.src = 'https://placehold.co/400x600/f8fafc/94a3b8?text=Ürün'; }}
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-medium text-gray-900 truncate">{product.productName || product.name}</h4>
                                                        <p className="text-xs text-brand font-semibold mt-0.5">
                                                            {(product.discountedPrice || product.productSellPrice || product.price || 0).toLocaleString('tr-TR')} ₺
                                                        </p>
                                                    </div>
                                                </Link>
                                            ))}
                                            <button
                                                type="submit"
                                                className="w-full p-3 text-center text-sm text-accent hover:bg-accent/5 font-medium transition-colors border-t border-gray-100"
                                            >
                                                Tüm "{searchTerm}" sonuçlarını gör
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="p-4 text-center text-sm text-gray-500">
                                            "{searchTerm}" için sonuç bulunamadı.
                                        </div>
                                    )}
                                </div>
                            )}
                        </form>
                    </div>
                )}

                {/* Mobile Menu */}
                {mobileMenu && (
                    <>
                        {/* Boşluğa basınca kapatan arka plan katmanı */}
                        <div 
                            className="fixed inset-0 bg-black/10 backdrop-blur-[1px] lg:hidden z-[40]" 
                            style={{ top: '0', height: '100vh', width: '100vw' }}
                            onClick={() => setMobileMenu(false)}
                        />
                        <div className="lg:hidden absolute inset-x-0 top-full bg-white border-t border-border shadow-xl animate-fadeIn z-50">
                            <nav className="px-4 py-4 space-y-1">
                            <Link to="/" onClick={() => setMobileMenu(false)} className="block px-4 py-3 text-sm font-medium text-primary hover:bg-surface-alt rounded-lg transition-colors">ANA SAYFA</Link>
                            {settings.navbarLinks?.newArrivalsActive !== false && (
                                <Link to="/search?sortBy=-createdAt" onClick={() => setMobileMenu(false)} className="block px-4 py-3 text-sm font-medium text-primary hover:bg-surface-alt rounded-lg transition-colors">YENİ GELENLER</Link>
                            )}
                            {settings.navbarLinks?.bestSellersActive !== false && (
                                <Link to="/search?bestSellers=true" onClick={() => setMobileMenu(false)} className="block px-4 py-3 text-sm font-bold text-accent hover:bg-surface-alt rounded-lg transition-colors">ÇOK SATANLAR</Link>
                            )}
                            {/* Mobil: ana kategoriler + alt kategoriler girintili */}
                            {rootCategories.map(category => {
                                const subs = getSubCategories(category);
                                const hasSubs = subs.length > 0;
                                return (
                                    <div key={category._id}>
                                        <div className="flex items-center justify-between px-4 py-1">
                                            <Link
                                                to={`/search?categoryName=${encodeURIComponent(category.name)}`}
                                                onClick={() => setMobileMenu(false)}
                                                className="block py-2 text-sm font-medium text-primary/80 hover:bg-surface-alt hover:text-accent rounded-lg transition-colors flex-1"
                                            >
                                                {category.name}
                                            </Link>
                                            {hasSubs && (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setExpandedMobileCat(prev => prev === category._id ? null : category._id);
                                                    }}
                                                    className="p-2 text-primary/60 hover:text-accent"
                                                >
                                                    <ChevronDown size={18} className={`transition-transform duration-200 ${expandedMobileCat === category._id ? 'rotate-180' : ''}`} />
                                                </button>
                                            )}
                                        </div>

                                        {hasSubs && expandedMobileCat === category._id && (
                                            <div className="bg-gray-50/50 rounded-lg py-1 mb-1">
                                                {subs.map(sub => {
                                                    const deepSubs = sub.children || [];
                                                    return (
                                                        <div key={sub._id}>
                                                            <Link
                                                                to={`/search?categoryName=${encodeURIComponent(sub.name)}`}
                                                                onClick={() => setMobileMenu(false)}
                                                                className="block pl-8 pr-4 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-100/80 hover:text-accent transition-colors"
                                                            >
                                                                ↳ {sub.name}
                                                            </Link>
                                                            {deepSubs.map(deepSub => (
                                                                <Link
                                                                    key={deepSub._id}
                                                                    to={`/search?categoryName=${encodeURIComponent(deepSub.name)}`}
                                                                    onClick={() => setMobileMenu(false)}
                                                                    className="block pl-12 pr-4 py-2 text-[12px] font-medium text-gray-500 hover:text-accent transition-colors"
                                                                >
                                                                    - {deepSub.name}
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {settings.navbarLinks?.discountedActive !== false && (
                                <Link to="/search?isDiscounted=true" onClick={() => setMobileMenu(false)} className="block px-4 py-3 text-sm font-bold text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors">İNDİRİMDEKİLER</Link>
                            )}
                        </nav>
                    </div>
                    </>
                )}
            </header>
        </>
    );
}
