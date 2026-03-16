import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoriteContext';
import toast from 'react-hot-toast';
import { Heart, ShoppingBag, Check } from 'lucide-react';
import gsap from 'gsap';

const BURST_COLORS = [
  'oklch(62.32% 0.20671135203311433 255.1916692835456)',
  'oklch(73.87% 0.1070786497070297 201.59493356613996)',
  'oklch(84.85% 0.17406745322149955 86.29886848579457)',
  'oklch(66.83% 0.20633437948063887 20.156816263959513)',
  'oklch(74.67% 0.09006824938632453 344.36705431384325)',
];


export default function ProductCard({ product, index = 1 }) {
    const { addToCart } = useCart();
    const { customer } = useAuth();
    const { toggleFavorite, isFavorite } = useFavorites();
    const [hoveredColor, setHoveredColor] = useState(null);
    const [cardHovered, setCardHovered] = useState(false);
    const [btnHovered, setBtnHovered] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [statusText, setStatusText] = useState('');


    const [localFavCount, setLocalFavCount] = useState(Number(product.favoriteCount) || 0);
    const fav = isFavorite(product._id);
    const isOutOfStock = product.stock <= 0 || product.inStock === false;

    // Keep local count in sync with product object if it updates from props
    useEffect(() => {
        setLocalFavCount(Number(product.favoriteCount) || 0);
    }, [product.favoriteCount]);

    const handleAddToCart = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!customer) {
            toast.error('Lütfen alışverişe devam etmek için giriş yapın.');
            return;
        }

        if (isAdding) return;

        setIsAdding(true);
        setStatusText('Ekleniyor...');

        try {
            let variantInfo = null;
            if (product.variants?.length > 0) {
                const defaultVariant = product.variants[hoveredColor || 0];
                if (defaultVariant) {
                    variantInfo = {
                        color: defaultVariant.color,
                        size: defaultVariant.sizes?.[0]?.size || null
                    };
                }
            }
            
            await addToCart(product._id, 1, variantInfo);
            setStatusText('Eklendi');
            
            // Show result for 1.5 seconds to see the animation
            setTimeout(() => {
                setIsAdding(false);
                setStatusText('');
            }, 1500);
        } catch (error) {
            setIsAdding(false);
            setStatusText('Hata oluştu');
            toast.error('Ürün eklenirken bir hata oluştu');
        }
    };

    const handleFavorite = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!customer) {
            toast.error('Lütfen favoriye eklemek için giriş yapın.');
            return;
        }

        const willBeFav = !fav;
        setLocalFavCount(prev => willBeFav ? prev + 1 : Math.max(0, prev - 1));
        toggleFavorite(product._id);
    };

    const displayedImage = hoveredColor !== null && product.variants?.[hoveredColor]?.images?.[0]?.thumbImagePath
        ? product.variants[hoveredColor].images[0].thumbImagePath
        : product.mainImage || product.images?.[0]?.thumbImagePath || '/placeholder.jpg';

    return (
        <div
            className="group block relative"
            style={{
                /* Animation fixed to only opacity to avoid transform interference */
                animation: `fadeIn 0.4s ease-out ${index * 50}ms both`,
            }}
            onMouseEnter={() => setCardHovered(true)}
            onMouseLeave={() => { setCardHovered(false); setBtnHovered(false); }}
        >
            <div className="relative mb-2">
                <Link to={`/product/${product._id}`}>
                    <div className="relative overflow-hidden bg-[#f4f4f4] aspect-[2/3]">
                        <img
                            src={displayedImage}
                            alt={product.productName}
                            className={`w-full h-full object-cover transition-transform duration-700 ${cardHovered ? 'scale-105' : 'scale-100'}`}
                            loading="lazy"
                            onError={(e) => { e.target.src = 'https://placehold.co/400x600/f8fafc/94a3b8?text=Ürün'; }}
                        />

                        {product.isDiscountedProduct && product.productDiscountRate > 0 && (
                            <div 
                                className="absolute top-3 left-3 text-white text-[10px] font-medium px-3.5 py-1 rounded-full z-10"
                                style={{ backgroundColor: '#9d0100' }}
                            >
                                %{product.productDiscountRate}
                            </div>
                        )}

                        {isOutOfStock && (
                            <div 
                                className="absolute top-1/2 -translate-y-1/2 left-0 w-full py-1.5 flex items-center justify-center z-20 pointer-events-none"
                                style={{ backgroundColor: '#000000a6' }}
                            >
                                <span 
                                    className="text-white font-normal uppercase"
                                    style={{ 
                                        fontFamily: "'Gilroy', sans-serif", 
                                        fontSize: '17px', 
                                        fontWeight: '300',
                                        letterSpacing: '1px' 
                                    }}
                                >
                                    TÜKENDİ
                                </span>
                            </div>
                        )}
                    </div>
                </Link>

                {/* Favorite Button Removed from here */}

                {/* Add to Cart Overlay */}
                {!isOutOfStock && (
                    <div
                        className="absolute bottom-0 inset-x-0 p-3 z-10 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"
                        style={{
                            /* STRICT opactiy and transform control */
                            opacity: cardHovered ? 1 : 0,
                            transform: cardHovered ? 'translateY(0)' : 'translateY(8px)',
                            transition: 'opacity 0.25s ease, transform 0.25s ease',
                        }}
                    >
                        <button
                            onClick={handleAddToCart}
                            data-adding={isAdding}
                            disabled={isAdding}
                            aria-label="Sepete Ekle"
                            className="pointer-events-auto w-full add-to-cart"
                        >
                            <span className="flex add-to-cart-text">     
                                <span className="svg-wrapper add-to-cart-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16.608 9.421V6.906H3.392v8.016c0 .567.224 1.112.624 1.513.4.402.941.627 1.506.627H8.63M8.818 3h2.333c.618 0 1.212.247 1.649.686a2.35 2.35 0 0 1 .683 1.658v1.562H6.486V5.344c0-.622.246-1.218.683-1.658A2.33 2.33 0 0 1 8.82 3"></path>
                                        <path stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" d="M14.608 12.563v5m2.5-2.5h-5"></path>
                                    </svg>
                                </span>
                                <span className="add-to-cart-text__content">Sepete Ekle</span>
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
                )}
            </div>

            <div className="px-1 relative z-20 pt-1 pb-1">
                <div className="flex justify-between items-start gap-2">
                    <Link to={`/product/${product._id}`} className="block flex-1">
                        <h3
                            className="text-[14.5px] font-medium text-primary line-clamp-2 mb-1 uppercase tracking-wide transition-colors duration-200"
                            style={{ color: cardHovered ? 'var(--accent-color, #c2956b)' : '' }}
                        >
                            {product.productName}
                        </h3>
                    </Link>
                    
                    {/* NARROWED: Slim Heart with Badge shifted Left */}
                    <div className="flex-shrink-0">
                        <button
                            onClick={handleFavorite}
                            className="relative group/fav flex items-center justify-center overflow-visible"
                        >
                            <Heart 
                                size={25} 
                                stroke="#ff0000" 
                                strokeWidth={1.5}
                                fill={fav ? "#ff0000" : "none"}
                                className="transition-transform group-hover/fav:scale-110 overflow-visible scale-x-[1.05] translate-y-[3px]"
                            />
                            <span 
                                className="absolute bottom-[-4px] right-[-6px] bg-[#ff0000] text-white text-[10.5px] font-bold min-w-[17px] h-[17px] rounded-full flex items-center justify-center px-1 z-30 shadow-[0_2px_4px_rgba(0,0,0,0.3)] border-[1.5px] border-white"
                            >
                                {fav ? Math.max(localFavCount, 1) : localFavCount}
                            </span>
                        </button>
                    </div>
                </div>

                <div className="flex items-baseline gap-2">
                    {product.isDiscountedProduct && product.formattedRegularPrice && (
                        <span className="text-[13px] text-muted/60 line-through decoration-1">{product.formattedRegularPrice}</span>
                    )}
                    <span className="text-[15.5px] font-bold text-primary">
                        {product.formattedPrice || `${(product.discountedPrice || product.productSellPrice || 0).toLocaleString('tr-TR')} TL`}
                    </span>
                </div>

                <div className="flex items-center gap-1 mt-1">
                    <div className="flex text-[12px] tracking-tighter">
                        {[...Array(5)].map((_, i) => (
                            <span key={i} style={{ color: i < Math.round(product.rating || 0) ? '#f59e0b' : '#e2e8f0' }}>★</span>
                        ))}
                    </div>
                    <span className="text-[11px] text-muted ml-0.5">({product.reviewCount || 0})</span>
                    {product.hasPhotoReview && (
                        <img src="/kamera.png" className="h-[14px] ml-1" alt="Fotoğraflı" title="Fotoğraflı Değerlendirmeler Var" />
                    )}
                    
                    {/* Add color badges to the right of the stars container */}
                    {product.variants?.length > 1 && (
                        <div className="flex items-center gap-1.5 ml-auto bg-surface-alt/80 border border-border/80 px-2.5 py-[3px] rounded-full transition-colors hover:bg-surface-alt -translate-y-[2px]">
                            <div 
                                className="w-[10px] h-[10px] rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)] border border-black/5 flex-shrink-0"
                                style={{ backgroundColor: product.variants[0]?.colorCode || '#ccc' }}
                            />
                            <span className="text-[10px] font-semibold text-slate-600 tracking-tight whitespace-nowrap">
                                +{product.variants.length - 1} Renk
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
