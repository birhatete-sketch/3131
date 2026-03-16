import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productAPI, categoryAPI } from '../services/api';
import ProductCard from '../components/product/ProductCard';
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';

export default function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [sortBy, setSortBy] = useState(searchParams.get('sort') || '-createdAt');
    const [showFilters, setShowFilters] = useState(false);
    const [expandedFilters, setExpandedFilters] = useState({ price: true, category: true, discount: true, stock: true, color: true, size: true });

    const [filters, setFilters] = useState({
        minPrice: '',
        maxPrice: '',
        selectedCategories: [],
        onlyDiscounted: false,
        onlyInStock: false,
        color: '',
        size: '',
    });
    const [appliedFilters, setAppliedFilters] = useState({
        minPrice: '',
        maxPrice: '',
        selectedCategories: [],
        onlyDiscounted: false,
        onlyInStock: false,
        color: '',
        size: '',
    });

    const page = parseInt(searchParams.get('page')) || 1;
    const bestSellersParam = searchParams.get('bestSellers');
    const categoryNameParam = searchParams.get('categoryName');
    const isDiscountedParam = searchParams.get('isDiscounted');

    useEffect(() => {
        setLoading(true);
        const params = {
            page,
            limit: 48,
            sortBy,
            minPrice: appliedFilters.minPrice,
            maxPrice: appliedFilters.maxPrice,
            isDiscounted: isDiscountedParam === 'true' || appliedFilters.onlyDiscounted,
            inStock: appliedFilters.onlyInStock,
            search: query,
            color: appliedFilters.color,
            size: appliedFilters.size,
            bestSellers: bestSellersParam,
            categoryName: categoryNameParam
        };

        if (appliedFilters.selectedCategories.length > 0) {
            params.category = appliedFilters.selectedCategories[0]; // Şimdilik tek kategori desteği
        }

        Promise.all([
            productAPI.getAll(params),
            categoryAPI.getAll(),
        ]).then(([prodRes, catRes]) => {
            if (prodRes.data.success) {
                setProducts(prodRes.data.products || []);
                setPagination(prodRes.data.pagination || {});
            }
            if (catRes.data.success) {
                setCategories(catRes.data.allCategories || []);
            }
        }).catch(console.error).finally(() => setLoading(false));
    }, [query, page, sortBy, appliedFilters.minPrice, appliedFilters.maxPrice, appliedFilters.onlyDiscounted, appliedFilters.onlyInStock, appliedFilters.color, appliedFilters.size, appliedFilters.selectedCategories, bestSellersParam, categoryNameParam, isDiscountedParam]);

    const handleSortChange = (e) => {
        setSortBy(e.target.value);
        setSearchParams({ q: query, sort: e.target.value, page: '1' });
    };

    const toggleFilter = (section) => {
        setExpandedFilters(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const toggleCategory = (catId) => {
        setFilters(prev => {
            const cats = prev.selectedCategories.includes(catId)
                ? prev.selectedCategories.filter(c => c !== catId)
                : [catId];
            return { ...prev, selectedCategories: cats };
        });
    };

    const applyFilters = () => {
        setAppliedFilters({ ...filters });
        setShowFilters(false);
    };

    const clearFilters = () => {
        const reset = { minPrice: '', maxPrice: '', selectedCategories: [], onlyDiscounted: false, onlyInStock: false, color: '', size: '' };
        setFilters(reset);
        setAppliedFilters(reset);
    };

    const activeFilterCount = [
        filters.minPrice, filters.maxPrice,
        filters.selectedCategories.length > 0,
        filters.onlyDiscounted, filters.onlyInStock,
        filters.color, filters.size
    ].filter(Boolean).length;

    const FilterPanel = () => (
        <div className="space-y-4">
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
                                value={filters.minPrice}
                                onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                                placeholder="Min TL"
                                className="w-full min-w-0 px-2.5 py-2 text-xs border border-border rounded-lg focus:outline-none focus:border-accent bg-surface-alt"
                            />
                            <input
                                type="number"
                                value={filters.maxPrice}
                                onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                                placeholder="Max TL"
                                className="w-full min-w-0 px-2.5 py-2 text-xs border border-border rounded-lg focus:outline-none focus:border-accent bg-surface-alt"
                            />
                        </div>
                    </div>
                )}
            </div>

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
                                    checked={filters.selectedCategories.includes(cat._id)}
                                    onChange={() => toggleCategory(cat._id)}
                                    className="w-4 h-4 rounded border-border text-accent focus:ring-accent/20"
                                />
                                <span className="text-xs text-muted group-hover:text-primary transition-colors">{cat.name}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

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
                                onClick={() => setFilters(prev => ({ ...prev, color: prev.color === color ? '' : color }))}
                                className={`px-2.5 py-1.5 text-[11px] rounded-lg border transition-all ${filters.color === color ? 'bg-accent border-accent text-white' : 'border-border text-muted hover:border-accent hover:text-accent'}`}
                            >
                                {color}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="border-t border-border pt-4">
                <button onClick={() => toggleFilter('size')} className="flex items-center justify-between w-full text-sm font-semibold text-primary mb-3">
                    <span>Beden</span>
                    {expandedFilters.size ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {expandedFilters.size && (
                    <div className="flex flex-wrap gap-2">
                        {['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'].map(size => (
                            <button
                                key={size}
                                onClick={() => setFilters(prev => ({ ...prev, size: prev.size === size ? '' : size }))}
                                className={`w-8 h-8 flex items-center justify-center text-[10px] rounded-lg border transition-all ${filters.size === size ? 'bg-accent border-accent text-white' : 'border-border text-muted hover:border-accent hover:text-accent'}`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="pt-6 space-y-2">
                <button onClick={applyFilters} className="w-full py-3 bg-primary text-white text-xs font-bold rounded-xl hover:bg-secondary transition-all shadow-md">
                    Filtreleri Uygula
                </button>
                {activeFilterCount > 0 && (
                    <button onClick={clearFilters} className="w-full py-3 text-xs font-bold text-danger hover:bg-danger/5 rounded-xl transition-all">
                        Temizle ({activeFilterCount})
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-surface">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                    <div>
                        <h1 className="font-display text-2xl lg:text-3xl font-bold text-primary">
                            {query ? `"${query}" sonuçları` :
                                categoryNameParam ? categoryNameParam :
                                    bestSellersParam === 'true' ? 'Çok Satan Ürünler' :
                                        isDiscountedParam === 'true' ? 'İndirimli Ürünler' :
                                            'Tüm Ürünler'}
                        </h1>
                        <p className="text-sm text-muted mt-1">{pagination.total || 0} ürün bulundu</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowFilters(!showFilters)} className="lg:hidden flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-lg text-primary hover:border-accent transition-colors">
                            <SlidersHorizontal size={16} /> Filtreler
                        </button>
                        <select value={sortBy} onChange={handleSortChange} className="text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-accent text-primary">
                            <option value="-createdAt">En Yeni</option>
                            <option value="productSellPrice">Fiyat: Düşükten Yükseğe</option>
                            <option value="-productSellPrice">Fiyat: Yüksekten Düşüğe</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-8">
                    <aside className="hidden lg:block w-64 flex-shrink-0">
                        <div className="bg-white rounded-2xl border border-border/50 p-5 sticky top-24">
                            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">Filtreler</h3>
                            <FilterPanel />
                        </div>
                    </aside>

                    <div className="flex-1">
                        {loading ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 lg:gap-6">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i}><div className="skeleton rounded-2xl aspect-[3/4] mb-4" /><div className="skeleton h-4 w-3/4 rounded mb-2" /><div className="skeleton h-4 w-1/2 rounded" /></div>
                                ))}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-muted">Sonuç bulunamadı.</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 lg:gap-6">
                                    {products.map((product, i) => <ProductCard key={product._id} product={product} index={i} />)}
                                </div>
                                {pagination.totalPages > 1 && (
                                    <div className="flex justify-center gap-2 mt-12">
                                        {[...Array(pagination.totalPages)].map((_, i) => (
                                            <button key={i} onClick={() => setSearchParams({ q: query, sort: sortBy, page: String(i + 1) })}
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
