import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useSite } from '../context/SiteContext';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoriteContext';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/product/ProductCard';
import ReviewSection from '../components/product/ReviewSection';
import toast from 'react-hot-toast';
import { Minus, Plus, Heart, Truck, ShieldCheck, RefreshCw, ShoppingBag, Check } from 'lucide-react';
import gsap from 'gsap';

const BURST_COLORS = [
  'oklch(62.32% 0.20671135203311433 255.1916692835456)',
  'oklch(73.87% 0.1070786497070297 201.59493356613996)',
  'oklch(84.85% 0.17406745322149955 86.29886848579457)',
  'oklch(66.83% 0.20633437948063887 20.156816263959513)',
  'oklch(74.67% 0.09006824938632453 344.36705431384325)',
];


export default function ProductPage() {
    const { id } = useParams();
    const { addToCart } = useCart();
    const { settings } = useSite();
    const { customer } = useAuth();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [statusText, setStatusText] = useState('');


    useEffect(() => {
        setLoading(true);
        setSelectedImage(0);
        setQuantity(1);
        setSelectedColor(null);
        setSelectedSize(null);
        window.scrollTo(0, 0);
        productAPI.getById(id).then(({ data }) => {
            if (data.success) {
                setProduct(data.product);
                if (data.product.variants?.length > 0) {
                    setSelectedColor(0);
                }
                if (data.product.category?._id) {
                    productAPI.getAll({ category: data.product.category._id, limit: 4 }).then(({ data: relData }) => {
                        setRelated((relData.products || []).filter(p => p._id !== id));
                    }).catch(() => { });
                }
            }
        }).catch(() => toast.error('Ürün bulunamadı')).finally(() => setLoading(false));
    }, [id]);

    const displayImages = useMemo(() => {
        if (!product) return [];
        const variant = product.variants?.[selectedColor];
        if (variant?.images?.length > 0) {
            return variant.images;
        }
        return product.images?.length > 0 ? product.images : [{ thumbImagePath: 'https://placehold.co/600x800/f8fafc/94a3b8?text=Ürün', bigImagePath: '' }];
    }, [product, selectedColor]);

    const currentVariant = product?.variants?.[selectedColor];

    const handleColorSelect = (index) => {
        setSelectedColor(index);
        setSelectedSize(null);
        setSelectedImage(0);
    };

    const handleAddToCart = async () => {
        if (!customer) {
            toast.error('Bu işlem için giriş yapmalısınız.');
            return;
        }

        if (isAdding) return;

        let variantInfo = null;
        if (product.variants?.length > 0) {
            if (selectedColor === null) return toast.error('Lütfen bir renk seçin');
            const variant = product.variants[selectedColor];
            if (variant.sizes?.length > 0) {
                if (selectedSize === null) return toast.error('Lütfen bir beden seçin');
                const selectedSizeObj = variant.sizes[selectedSize];
                if (selectedSizeObj.stock <= 0) return toast.error('Bu beden tükendi');
                if (quantity > selectedSizeObj.stock) return toast.error(`Maksimum ${selectedSizeObj.stock} adet ekleyebilirsiniz`);
            }
            variantInfo = {
                color: variant.color,
                size: variant.sizes?.[selectedSize]?.size || null
            };
        } else {
            if (product.stock <= 0) return toast.error('Ürün tükendi');
            if (quantity > product.stock) return toast.error(`Maksimum ${product.stock} adet ekleyebilirsiniz`);
        }

        setIsAdding(true);
        setStatusText('Ekleniyor...');

        try {
            await addToCart(product._id, quantity, variantInfo);
            setStatusText('Eklendi');
            
            setTimeout(() => {
                setIsAdding(false);
                setStatusText('');
            }, 1500);
        } catch (error) {
            setIsAdding(false);
            setStatusText('Hata');
            toast.error('Ürün eklenirken hata oluştu');
        }
    };

    const { toggleFavorite, isFavorite } = useFavorites();
    const fav = isFavorite(product?._id);

    const handleFavorite = () => {
        if (!customer) {
            toast.error('Favorilere eklemek için giriş yapmalısınız.');
            return;
        }
        toggleFavorite(product._id);
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="skeleton rounded-2xl aspect-[3/4]" />
                    <div className="space-y-6">
                        <div className="skeleton h-8 w-3/4 rounded" />
                        <div className="skeleton h-6 w-1/3 rounded" />
                        <div className="skeleton h-24 w-full rounded" />
                        <div className="skeleton h-14 w-full rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (!product) return <div className="text-center py-20 text-muted">Ürün bulunamadı</div>;

    return (
        <div className="min-h-screen bg-surface">
            {/* Breadcrumb */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <nav className="flex items-center gap-2 text-xs text-muted">
                    <Link to="/" className="hover:text-accent transition-colors">Ana Sayfa</Link>
                    <span>/</span>
                    {product.category && <Link to={`/category/${product.category._id}`} className="hover:text-accent transition-colors">{product.category.name}</Link>}
                    {product.category && <span>/</span>}
                    <span className="text-primary font-medium line-clamp-1">{product.productName}</span>
                </nav>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
                    {/* Images */}
                    <div className="space-y-4 animate-fadeIn">
                        <div className="relative overflow-hidden rounded-2xl bg-surface-alt aspect-[3/4]">
                            <img
                                src={displayImages[selectedImage]?.bigImagePath || displayImages[selectedImage]?.thumbImagePath}
                                alt={product.productName}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = 'https://placehold.co/600x800/f8fafc/94a3b8?text=Ürün'; }}
                            />
                            {product.isDiscountedProduct && product.productDiscountRate > 0 && (
                                <div className="absolute top-4 left-4 bg-danger text-white text-sm font-bold px-3 py-1.5 rounded-full">
                                    %{product.productDiscountRate} İndirim
                                </div>
                            )}
                        </div>
                        {displayImages.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {displayImages.map((img, i) => (
                                    <button key={i} onClick={() => setSelectedImage(i)}
                                        className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${i === selectedImage ? 'border-accent ring-2 ring-accent/20' : 'border-border hover:border-accent/50'}`}>
                                        <img src={img.thumbImagePath} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-6 animate-slideUp">
                        {/* Başlık, Renk Adedi ve Favori vb */}
                        <div className="relative">
                            {product.category && (
                                <Link to={`/category/${product.category._id}`} className="text-xs font-medium text-accent uppercase tracking-wider">{product.category.name}</Link>
                            )}
                            <div className="flex justify-between items-start mt-2">
                                <h1 className="font-display text-2xl lg:text-3xl font-bold text-primary leading-tight pr-12">{product.productName}</h1>
                                
                                <button onClick={handleFavorite} className="absolute right-0 top-0 text-danger hover:scale-110 transition-transform p-2 z-10" title="Favorilere Ekle">
                                    <Heart size={28} fill={fav ? 'currentColor' : 'none'} strokeWidth={1.5} />
                                </button>
                            </div>

                            {/* Seçili Renk ve İlave Renk Özeti */}
                            {product.variants?.length > 0 && (
                                <div className="flex items-center gap-2 mt-3 mb-1">
                                    <div 
                                        className="w-5 h-5 rounded-full border border-border shadow-sm"
                                        style={{ backgroundColor: product.variants[selectedColor || 0]?.colorCode || '#ccc' }}
                                    ></div>
                                    <span className="text-sm text-muted">
                                        {product.variants.length > 1 ? `+ ${product.variants.length - 1} Renk` : product.variants[0]?.color}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Price Area */}
                        <div className="flex items-baseline gap-4 mt-6">
                            {product.isDiscountedProduct && product.formattedRegularPrice && (
                                <span className="text-2xl text-muted font-medium line-through">{product.formattedRegularPrice}</span>
                            )}
                            <span className="text-3xl lg:text-4xl font-bold text-primary">
                                {product.formattedPrice || `${(product.discountedPrice || product.productSellPrice || 0).toLocaleString('tr-TR')} TL`}
                            </span>
                        </div>

                        {/* Rating & Reviews */}
                        <div className="flex items-center gap-2 mt-2">
                            <div className="flex text-amber-400 text-xl">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <span key={i} className={i < Math.round(product.rating || 0) ? "text-amber-400" : "text-border"}>★</span>
                                ))}
                            </div>
                            <span className="text-sm text-muted font-medium ml-1">({product.reviewCount || 0})</span>
                            {/* Yorumlarda görsel varsa icon*/}
                            {product.hasPhotoReview && (
                                <img src="/kamera.png" className="h-4 ml-2" alt="Fotoğraflı" title="Fotoğraflı Değerlendirmeler Var" />
                            )}
                        </div>

                        {/* Black Discount Banner (Mockup styling) */}
                        {product.isDiscountedProduct && product.productDiscountRate > 0 && (
                            <div className="w-full bg-black text-white text-center py-3.5 px-4 rounded-lg flex items-center justify-center gap-3 mt-4 mb-2 shadow-lg tracking-wide hover:bg-black/90 transition-colors">
                                <span className="text-sm lg:text-base">SİZE ÖZEL %{product.productDiscountRate} İNDİRİM</span>
                                <span className="text-lg lg:text-xl font-bold">
                                    {product.formattedPrice || `${(product.discountedPrice || product.productSellPrice || 0).toLocaleString('tr-TR')} TL`}
                                </span>
                            </div>
                        )}

                        {/* Renk Seçimi */}
                        {product.variants?.length > 0 && (
                            <div className="border-t border-border pt-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-sm font-medium text-primary">Renk:</span>
                                    {selectedColor !== null && (
                                        <span className="text-sm text-muted">{product.variants[selectedColor]?.color}</span>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {product.variants.map((variant, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleColorSelect(i)}
                                            className={`relative w-10 h-10 rounded-full border-2 transition-all duration-200 ${selectedColor === i
                                                ? 'border-accent ring-2 ring-accent/30 scale-110'
                                                : 'border-border hover:border-accent/50'
                                                }`}
                                            style={{ backgroundColor: variant.colorCode || '#ccc' }}
                                            title={variant.color}
                                        >
                                            {selectedColor === i && (
                                                <span className="absolute inset-0 flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Beden Seçimi */}
                        {currentVariant?.sizes?.length > 0 && (
                            <div className="border-t border-border pt-6">
                                <span className="text-sm font-medium text-primary mb-3 block">Beden:</span>
                                <div className="flex flex-wrap gap-2">
                                    {currentVariant.sizes.map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => s.stock > 0 ? setSelectedSize(i) : null}
                                            disabled={s.stock === 0}
                                            className={`min-w-[48px] px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 ${selectedSize === i
                                                ? 'border-accent bg-accent text-white'
                                                : s.stock === 0
                                                    ? 'border-border/30 text-muted/40 cursor-not-allowed line-through bg-surface-alt'
                                                    : 'border-border text-primary hover:border-accent/50'
                                                }`}
                                        >
                                            {s.size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity & Add to Cart */}
                        <div className="space-y-4 border-t border-border pt-6">
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-medium text-primary">Adet:</span>
                                <div className="flex items-center border border-border rounded-xl overflow-hidden">
                                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-3.5 py-2.5 text-primary hover:bg-surface-alt transition-colors">
                                        <Minus size={14} />
                                    </button>
                                    <span className="px-5 py-2.5 text-sm font-semibold text-primary min-w-[50px] text-center">{quantity}</span>
                                    <button
                                        onClick={() => {
                                            const maxStock = product.variants?.[selectedColor]?.sizes?.[selectedSize]?.stock || product.stock || 0;
                                            if (quantity < maxStock) {
                                                setQuantity(q => q + 1);
                                            } else {
                                                toast.error(`Bu üründen stokta sadece ${maxStock} adet mevcut.`);
                                            }
                                        }}
                                        className="px-3.5 py-2.5 text-primary hover:bg-surface-alt transition-colors">
                                        <Plus size={14} />
                                    </button>
                                </div>
                                <span className="text-xs text-muted">{product.stock > 0 ? `${product.stock} adet stokta` : ''}</span>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleAddToCart}
                                    data-adding={isAdding}
                                    disabled={!product.inStock || isAdding}
                                    className="flex-1 min-h-[56px] add-to-cart"
                                    style={{
                                        opacity: product.inStock ? 1 : 0.5,
                                        cursor: product.inStock ? 'pointer' : 'not-allowed'
                                    }}
                                >
                                    <span className="flex add-to-cart-text">     
                                        <span className="svg-wrapper add-to-cart-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none">
                                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16.608 9.421V6.906H3.392v8.016c0 .567.224 1.112.624 1.513.4.402.941.627 1.506.627H8.63M8.818 3h2.333c.618 0 1.212.247 1.649.686a2.35 2.35 0 0 1 .683 1.658v1.562H6.486V5.344c0-.622.246-1.218.683-1.658A2.33 2.33 0 0 1 8.82 3"></path>
                                                <path stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" d="M14.608 12.563v5m2.5-2.5h-5"></path>
                                            </svg>
                                        </span>
                                        <span className="add-to-cart-text__content">{product.inStock ? 'Sepete Ekle' : 'Tükendi'}</span>
                                    </span>
                                    <span className="flex added">
                                        <span className="svg-wrapper add-to-cart-icon--added">
                                            <svg className="checkmark-burst" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <g className="check">
                                                    <path className="ring" d="M21 12C21 13.1819 20.7672 14.3522 20.3149 15.4442C19.8626 16.5361 19.1997 17.5282 18.364 18.364C17.5282 19.1997 16.5361 19.8626 15.4442 20.3149C14.3522 20.7672 13.1819 21 12 21C10.8181 21 9.64778 20.7672 8.55585 20.3149C7.46392 19.8626 6.47177 19.1997 5.63604 18.364C4.80031 17.5282 4.13738 16.5361 3.68508 15.4442C3.23279 14.3522 3 13.1819 3 12C3 9.61305 3.94821 7.32387 5.63604 5.63604C7.32387 3.94821 9.61305 3 12 3C14.3869 3 16.6761 3.94821 18.364 5.63604C20.0518 7.32387 21 9.61305 21 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path className="tick" d="M9 12.75L11.25 15L15 9.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                </g>
                                                <g className="burst">
                                                    {[...Array(8)].map((_, i) => (
                                                        <g key={i} style={{ '--index': i }}>
                                                            <path className="wiggle" pathLength="1" d="M12 8.5 Q13 9.5 12 10.5 Q11 11.5 12 12.5 Q13 13.5 12 15.5" stroke="currentColor" strokeLinecap="round" fill="none"/>
                                                            <line className="line" stroke-linecap="round" pathLength="1" x1="12" y1="8.5" x2="12" y2="15.5" stroke="currentColor"/>
                                                        </g>
                                                    ))}
                                                </g>
                                            </svg>
                                        </span>
                                    </span>
                                    <span className="sr-only" aria-live="polite">
                                        {statusText}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Trust Badges */}
                        <div className="grid grid-cols-3 gap-4 border-t border-border pt-6">
                            {[
                                { icon: Truck, text: `${settings.shipping?.freeShippingLimit || 500} TL üzeri ücretsiz kargo` },
                                { icon: ShieldCheck, text: 'Güvenli ödeme' },
                                { icon: RefreshCw, text: '14 gün iade hakkı' },
                            ].map(({ icon: Icon, text }) => (
                                <div key={text} className="text-center">
                                    <Icon className="mx-auto text-accent mb-1" size={20} />
                                    <p className="text-[10px] text-muted leading-tight">{text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Detailed Info Section (Madde 8) */}
                <div className="mt-16 border-t border-border pt-16 animate-fadeIn">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
                        <div className="lg:col-span-2">
                            <h3 className="font-display text-2xl font-bold text-primary mb-6 flex items-center gap-3">
                                <span className="w-1.5 h-8 bg-accent rounded-full"></span>
                                Ürün Açıklaması
                            </h3>
                            <div className="prose prose-sm max-w-none text-muted leading-relaxed space-y-4">
                                {product.description ? (
                                    <div dangerouslySetInnerHTML={{ __html: product.description.replace(/\n/g, '<br/>') }} />
                                ) : (
                                    <p>Bu ürün için henüz bir açıklama girilmemiş.</p>
                                )}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-display text-2xl font-bold text-primary mb-6 flex items-center gap-3">
                                <span className="w-1.5 h-8 bg-primary rounded-full"></span>
                                Teknik Özellikler
                            </h3>
                            <div className="bg-white rounded-2xl border border-border/50 overflow-hidden shadow-sm">
                                <table className="w-full text-sm">
                                    <tbody className="divide-y divide-border/50">
                                        {[
                                            { label: 'Marka', value: product.brand || 'biryas dev.' },
                                            { label: 'Stok Kodu', value: product.stockCode },
                                            { label: 'Kategori', value: product.category?.name },
                                            { label: 'Materyal', value: 'Pamuk Karışımlı' },
                                            { label: 'Sezon', value: 'Yaz 2024' },
                                            { label: 'Garanti', value: '24 Ay' },
                                            { label: 'Kargo', value: 'Hızlı Teslimat' },
                                        ].map((row, i) => row.value && (
                                            <tr key={i} className="group hover:bg-surface-alt transition-colors">
                                                <td className="px-5 py-4 font-semibold text-muted bg-surface-alt/20 w-1/3 group-hover:text-primary">{row.label}</td>
                                                <td className="px-5 py-4 text-primary font-medium">{row.value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviews */}
                <ReviewSection 
                    productId={product._id} 
                    onStatsUpdate={(newStats) => {
                        if (newStats) {
                            setProduct(prev => ({
                                ...prev,
                                rating: newStats.avgRating,
                                reviewCount: newStats.totalReviews
                            }));
                        }
                    }}
                />

                {/* Related Products */}
                {related.length > 0 && (
                    <section className="mt-16 pt-16 border-t border-border">
                        <h2 className="font-display text-2xl font-bold text-primary mb-8">Benzer Ürünler</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                            {related.slice(0, 4).map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
