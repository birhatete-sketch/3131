import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { productAPI, categoryAPI } from '../services/api';
import ProductCard from '../components/product/ProductCard';
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';

export default function CategoryPage() {
    const { id } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const [allProducts, setAllProducts] = useState([]);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [categoryName, setCategoryName] = useState('');
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [sortBy, setSortBy] = useState(searchParams.get('sort') || '-createdAt');
    const [showFilters, setShowFilters] = useState(false);
    const [expandedFilters, setExpandedFilters] = useState({ price: true, category: true, discount: true, stock: true, color: true, size: true });

    const [filters, setFilters] = useState({
        minPrice: '',
        maxPrice: '',
        selectedCategories: id ? [id] : [],
        onlyDiscounted: false,
        onlyInStock: false,
        search: '',
        color: '',
        size: '',
    });

    const [tempFilters, setTempFilters] = useState({ ...filters });

    // Debounced search
    const [searchTerm, setSearchTerm] = useState('');
    const searchTimeoutRef = useRef(null);

    const page = parseInt(searchParams.get('page')) || 1;

    // Debounced search effect
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            setTempFilters(prev => ({ ...prev, search: searchTerm }));
        }, 500); // 500ms debounce

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchTerm]);

    useEffect(() => {
        setLoading(true);
        const params = {
            page: 1,
            limit: 1000, // Tüm ürünleri yükle
            sortBy: '-createdAt'
        };

        if (id) params.category = id;

        Promise.all([
            productAPI.getAll(params),
            categoryAPI.getAll(),
        ]).then(([prodRes, catRes]) => {
            if (prodRes.data.success) {
                const prods = prodRes.data.products || [];
                setAllProducts(prods);
            }
            if (catRes.data.success) {
                setCategories(catRes.data.allCategories || []);
                const cat = (catRes.data.allCategories || []).find(c => c._id === id);
                setCategoryName(cat?.name || 'Tüm Ürünler');
            }
        }).catch(console.error).finally(() => setLoading(false));
    }, [id]);

    // Filtreleme useEffect'i
    useEffect(() => {
        let filtered = [...allProducts];

        // Kategori filtresi
        if (filters.selectedCategories.length > 0) {
            filtered = filtered.filter(product =>
                filters.selectedCategories.includes(product.category?._id) ||
                filters.selectedCategories.includes(product.category)
            );
        }

        // Fiyat filtresi
        if (filters.minPrice) {
            filtered = filtered.filter(product => {
                const price = product.isDiscountedProduct ? product.productDiscountedPrice : product.productPrice;
                return price >= parseFloat(filters.minPrice);
            });
        }
        if (filters.maxPrice) {
            filtered = filtered.filter(product => {
                const price = product.isDiscountedProduct ? product.productDiscountedPrice : product.productPrice;
                return price <= parseFloat(filters.maxPrice);
            });
        }

        // İndirim filtresi
        if (filters.onlyDiscounted) {
            filtered = filtered.filter(product => product.isDiscountedProduct);
        }

        // Stok filtresi
        if (filters.onlyInStock) {
            filtered = filtered.filter(product => product.productStock > 0);
        }

        // Arama filtresi
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(product =>
                product.productName.toLowerCase().includes(searchTerm) ||
                product.productDescription?.toLowerCase().includes(searchTerm)
            );
        }

        // Renk filtresi
        if (filters.color) {
            filtered = filtered.filter(product =>
                product.productColors?.some(color => color.toLowerCase().includes(filters.color.toLowerCase()))
            );
        }

        // Beden filtresi
        if (filters.size) {
            filtered = filtered.filter(product =>
                product.productSizes?.some(size => size.toLowerCase().includes(filters.size.toLowerCase()))
            );
        }

        // Sıralama
        filtered.sort((a, b) => {
            let aVal, bVal;
            switch (sortBy) {
                case 'productPrice':
                    aVal = a.isDiscountedProduct ? a.productDiscountedPrice : a.productPrice;
                    bVal = b.isDiscountedProduct ? b.productDiscountedPrice : b.productPrice;
                    return aVal - bVal;
                case '-productPrice':
                    aVal = a.isDiscountedProduct ? a.productDiscountedPrice : a.productPrice;
                    bVal = b.isDiscountedProduct ? b.productDiscountedPrice : b.productPrice;
                    return bVal - aVal;
                case 'productName':
                    return a.productName.localeCompare(b.productName);
                case '-productName':
                    return b.productName.localeCompare(a.productName);
                case 'createdAt':
                    return new Date(a.createdAt) - new Date(b.createdAt);
                case '-createdAt':
                default:
                    return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });

        // Sayfalama
        const itemsPerPage = 48;
        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedProducts = filtered.slice(startIndex, endIndex);

        setProducts(paginatedProducts);
        setPagination({
            page,
            totalPages,
            total: totalItems
        });
    }, [allProducts, filters, sortBy, page]);

    const handleApplyFilters = () => {
        setFilters({ ...tempFilters });
        if (window.innerWidth < 1024) setShowFilters(false);
    };

    const handleSortChange = (e) => {
        setSortBy(e.target.value);
        setSearchParams({ sort: e.target.value, page: '1' });
    };

    const toggleFilter = (section) => {
        setExpandedFilters(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const toggleCategory = (catId) => {
        setTempFilters(prev => {
            const cats = prev.selectedCategories.includes(catId)
                ? prev.selectedCategories.filter(c => c !== catId)
                : [...prev.selectedCategories, catId];
            return { ...prev, selectedCategories: cats };
        });
    };

    const clearFilters = () => {
        const initial = {
            minPrice: '',
            maxPrice: '',
            selectedCategories: id ? [id] : [],
            onlyDiscounted: false,
            onlyInStock: false,
            search: '',
            color: '',
            size: ''
        };
        setFilters(initial);
        setTempFilters(initial);
        setSearchTerm('');
    };

    const activeFilterCount = [
        filters.minPrice, filters.maxPrice,
        filters.selectedCategories.length > (id ? 1 : 0),
        filters.onlyDiscounted, filters.onlyInStock,
        filters.search, filters.color, filters.size
    ].filter(Boolean).length;

    // Fiyat aralığı hesapla
    const priceRange = { min: 0, max: 20000 };

    const FilterPanel = () => (
        <div className="space-y-4">
            {/* Uygula Butonu */}
            <button
                onClick={handleApplyFilters}
                className="w-full py-3 bg-accent text-white font-bold rounded-lg hover:bg-accent-dark transition-all shadow-lg hover:shadow-accent/40 flex items-center justify-center gap-2 mb-4"
            >
                🔍 Filtreleri Uygula
            </button>

            {/* Arama */}
            <div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Bu kategoride ara..."
                    className="w-full px-3 py-2.5 text-xs border border-border rounded-lg focus:outline-none focus:border-accent bg-surface-alt"
                />
            </div>

            {/* Fiyat Filtresi */}
            <div className="border-t border-border pt-4">
                <button onClick={() => toggleFilter('price')} className="flex items-center justify-between w-full text-sm font-semibold text-primary mb-3">
                    <span>Fiyat Aralığı</span>
                    {expandedFilters.price ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {expandedFilters.price && (
                    <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="number"
                                value={tempFilters.minPrice}
                                onChange={(e) => setTempFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                                placeholder="Min TL"
                                className="w-full min-w-0 px-2.5 py-2 text-xs border border-border rounded-lg focus:outline-none focus:border-accent bg-surface-alt"
                            />

                            <input
                                type="number"
                                value={tempFilters.maxPrice}
                                onChange={(e) => setTempFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                                placeholder="Max TL"
                                className="w-full min-w-0 px-2.5 py-2 text-xs border border-border rounded-lg focus:outline-none focus:border-accent bg-surface-alt"
                            />
                        </div>
                        {/* Hızlı fiyat aralıkları */}
                        <div className="flex flex-wrap gap-1.5">
                            {[
                                { label: '0 - 100 TL', min: 0, max: 100 },
                                { label: '100 - 500 TL', min: 100, max: 500 },
                                { label: '500 - 1000 TL', min: 500, max: 1000 },
                                { label: '1000+ TL', min: 1000, max: '' },
                            ].map((range) => (
                                <button
                                    key={range.label}
                                    onClick={() => setTempFilters(prev => ({ ...prev, minPrice: String(range.min), maxPrice: String(range.max) }))}
                                    className="px-2 py-1 text-[10px] rounded-md border border-border text-muted hover:border-accent hover:text-accent transition-colors"
                                >
                                    {range.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Kategori Filtresi */}
            {!id && categories.length > 0 && (
                <div className="border-t border-border pt-4">
                    <button onClick={() => toggleFilter('category')} className="flex items-center justify-between w-full text-sm font-semibold text-primary mb-3">
                        <span>Kategori</span>
                        {expandedFilters.category ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {expandedFilters.category && (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {categories.map(cat => (
                                <label key={cat._id} className="flex items-center gap-2.5 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={tempFilters.selectedCategories.includes(cat._id)}
                                        onChange={() => toggleCategory(cat._id)}
                                        className="w-4 h-4 rounded border-border text-accent focus:ring-accent/20"
                                    />
                                    <span className="text-xs text-muted group-hover:text-primary transition-colors">{cat.name}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* İndirimli Ürünler */}
            <div className="border-t border-border pt-4">
                <button onClick={() => toggleFilter('discount')} className="flex items-center justify-between w-full text-sm font-semibold text-primary mb-3">
                    <span>İndirim</span>
                    {expandedFilters.discount ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {expandedFilters.discount && (
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={tempFilters.onlyDiscounted}
                            onChange={(e) => setTempFilters(prev => ({ ...prev, onlyDiscounted: e.target.checked }))}
                            className="w-4 h-4 rounded border-border text-accent focus:ring-accent/20"
                        />
                        <span className="text-xs text-muted group-hover:text-primary transition-colors">Sadece indirimli ürünler</span>
                    </label>
                )}
            </div>

            {/* Stok Durumu */}
            <div className="border-t border-border pt-4">
                <button onClick={() => toggleFilter('stock')} className="flex items-center justify-between w-full text-sm font-semibold text-primary mb-3">
                    <span>Stok Durumu</span>
                    {expandedFilters.stock ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {expandedFilters.stock && (
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={tempFilters.onlyInStock}
                            onChange={(e) => setTempFilters(prev => ({ ...prev, onlyInStock: e.target.checked }))}
                            className="w-4 h-4 rounded border-border text-accent focus:ring-accent/20"
                        />
                        <span className="text-xs text-muted group-hover:text-primary transition-colors">Sadece stokta olan ürünler</span>
                    </label>
                )}
            </div>

            {/* Renk Filtresi */}
            <div className="border-t border-border pt-4">
                <button onClick={() => toggleFilter('color')} className="flex items-center justify-between w-full text-sm font-semibold text-primary mb-3">
                    <span>Renk</span>
                    {expandedFilters.color ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {expandedFilters.color && (
                    <div className="flex flex-wrap gap-2">
                        {['Siyah', 'Beyaz', 'Mavi', 'Kırmızı', 'Yeşil', 'Sarı', 'Gri', 'Lacivert', 'Bej'].map(color => (
                            <button
                                key={color}
                                onClick={() => setTempFilters(prev => ({ ...prev, color: prev.color === color ? '' : color }))}
                                className={`px-2.5 py-1.5 text-[11px] rounded-lg border transition-all ${tempFilters.color === color ? 'bg-accent border-accent text-white' : 'border-border text-muted hover:border-accent hover:text-accent'}`}
                            >
                                {color}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Beden Filtresi */}
            <div className="border-t border-border pt-4">
                <button onClick={() => toggleFilter('size')} className="flex items-center justify-between w-full text-sm font-semibold text-primary mb-3">
                    <span>Beden</span>
                    {expandedFilters.size ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {expandedFilters.size && (
                    <div className="flex flex-wrap gap-2">
                        {['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '36', '38', '40', '42', '44'].map(size => (
                            <button
                                key={size}
                                onClick={() => setTempFilters(prev => ({ ...prev, size: prev.size === size ? '' : size }))}
                                className={`w-10 h-10 flex items-center justify-center text-xs rounded-lg border transition-all ${tempFilters.size === size ? 'bg-accent border-accent text-white' : 'border-border text-muted hover:border-accent hover:text-accent'}`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Temizle */}
            {activeFilterCount > 0 && (
                <button
                    onClick={clearFilters}
                    className="w-full py-2.5 text-xs font-medium text-danger border border-danger/20 rounded-lg hover:bg-danger/5 transition-colors mt-2"
                >
                    Filtreleri Temizle ({activeFilterCount})
                </button>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-surface">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                    <div>
                        <h1 className="font-display text-2xl lg:text-3xl font-bold text-primary">{categoryName}</h1>
                        <p className="text-sm text-muted mt-1">{products.length} ürün bulundu</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Mobile filter button */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="lg:hidden flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-lg text-primary hover:border-accent transition-colors"
                        >
                            <SlidersHorizontal size={16} />
                            Filtreler
                            {activeFilterCount > 0 && (
                                <span className="bg-accent text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">{activeFilterCount}</span>
                            )}
                        </button>
                        <select value={sortBy} onChange={handleSortChange}
                            className="text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-accent text-primary">
                            <option value="-createdAt">En Yeni</option>
                            <option value="productSellPrice">Fiyat: Düşükten Yükseğe</option>
                            <option value="-productSellPrice">Fiyat: Yüksekten Düşüğe</option>
                            <option value="-productDiscountRate">İndirim Oranı</option>
                            <option value="productName">A-Z</option>
                            <option value="-productName">Z-A</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-8">
                    {/* Sidebar Filters - Desktop */}
                    <aside className="hidden lg:block w-64 flex-shrink-0">
                        <div className="bg-white rounded-2xl border border-border/50 p-5 sticky top-24">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Filtreler</h3>
                                {activeFilterCount > 0 && (
                                    <span className="bg-accent/10 text-accent text-[10px] font-bold px-2 py-0.5 rounded-full">{activeFilterCount} aktif</span>
                                )}
                            </div>
                            <FilterPanel />

                            {/* alt kategori bağlantıları */}
                            {id && categories.length > 0 && (
                                <div className="border-t border-border pt-4 mt-4">
                                    <h3 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Kategoriler</h3>
                                    <ul className="space-y-1">
                                        {categories.map(cat => (
                                            <li key={cat._id}>
                                                <a href={`/category/${cat._id}`}
                                                    className={`block px-3 py-2.5 text-sm rounded-lg transition-all ${cat._id === id ? 'bg-accent/10 text-accent font-medium' : 'text-muted hover:bg-surface-alt hover:text-primary'}`}>
                                                    {cat.name}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* Mobile Filter Sidebar */}
                    {showFilters && (
                        <div className="fixed inset-0 z-50 lg:hidden">
                            <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilters(false)} />
                            <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl overflow-y-auto animate-slideUp">
                                <div className="flex items-center justify-between p-4 border-b border-border">
                                    <h3 className="font-semibold text-primary">Filtreler</h3>
                                    <button onClick={() => setShowFilters(false)} className="p-1 text-muted hover:text-primary">
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="p-4">
                                    <FilterPanel />
                                </div>
                                <div className="sticky bottom-0 p-4 bg-white border-t border-border">
                                    <button onClick={() => setShowFilters(false)}
                                        className="w-full py-3 bg-primary text-white font-semibold rounded-xl text-sm">
                                        {products.length} Ürün Göster
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Products Grid */}
                    <div className="flex-1">
                        {/* Active filters bar */}
                        {activeFilterCount > 0 && (
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                {filters.minPrice && (
                                    <span className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-accent/10 text-accent rounded-full">
                                        Min: {filters.minPrice} TL
                                        <button onClick={() => setFilters(prev => ({ ...prev, minPrice: '' }))} className="hover:text-danger"><X size={12} /></button>
                                    </span>
                                )}
                                {filters.maxPrice && (
                                    <span className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-accent/10 text-accent rounded-full">
                                        Max: {filters.maxPrice} TL
                                        <button onClick={() => setFilters(prev => ({ ...prev, maxPrice: '' }))} className="hover:text-danger"><X size={12} /></button>
                                    </span>
                                )}
                                {filters.color && (
                                    <span className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-accent/10 text-accent rounded-full">
                                        Renk: {filters.color}
                                        <button onClick={() => setFilters(prev => ({ ...prev, color: '' }))} className="hover:text-danger"><X size={12} /></button>
                                    </span>
                                )}
                                {filters.size && (
                                    <span className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-accent/10 text-accent rounded-full">
                                        Beden: {filters.size}
                                        <button onClick={() => setFilters(prev => ({ ...prev, size: '' }))} className="hover:text-danger"><X size={12} /></button>
                                    </span>
                                )}
                                {filters.onlyDiscounted && (
                                    <span className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-accent/10 text-accent rounded-full">
                                        İndirimli
                                        <button onClick={() => setFilters(prev => ({ ...prev, onlyDiscounted: false }))} className="hover:text-danger"><X size={12} /></button>
                                    </span>
                                )}
                                {filters.onlyInStock && (
                                    <span className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-accent/10 text-accent rounded-full">
                                        Stokta
                                        <button onClick={() => setFilters(prev => ({ ...prev, onlyInStock: false }))} className="hover:text-danger"><X size={12} /></button>
                                    </span>
                                )}
                                {filters.search && (
                                    <span className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-accent/10 text-accent rounded-full">
                                        "{filters.search}"
                                        <button onClick={() => setFilters(prev => ({ ...prev, search: '' }))} className="hover:text-danger"><X size={12} /></button>
                                    </span>
                                )}
                            </div>
                        )}

                        {loading ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 lg:gap-6">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i}><div className="skeleton rounded-2xl aspect-[3/4] mb-4" /><div className="skeleton h-4 w-3/4 rounded mb-2" /><div className="skeleton h-4 w-1/2 rounded" /></div>
                                ))}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-muted text-lg mb-4">{activeFilterCount > 0 ? 'Filtrelere uygun ürün bulunamadı' : 'Bu kategoride ürün bulunamadı'}</p>
                                {activeFilterCount > 0 && (
                                    <button onClick={clearFilters} className="px-6 py-2.5 text-sm bg-primary text-white rounded-xl hover:bg-secondary transition-colors">
                                        Filtreleri Temizle
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 lg:gap-6">
                                    {products.map((product, i) => <ProductCard key={product._id} product={product} index={i} />)}
                                </div>

                                {/* Pagination */}
                                {pagination.totalPages > 1 && (
                                    <div className="flex justify-center gap-2 mt-12">
                                        {[...Array(pagination.totalPages)].map((_, i) => (
                                            <button key={i} onClick={() => setSearchParams({ sort: sortBy, page: String(i + 1) })}
                                                className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${page === i + 1 ? 'bg-primary text-white' : 'bg-surface-alt text-muted hover:bg-surface-dark'}`}>
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
