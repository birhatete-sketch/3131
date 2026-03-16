import { useState, useEffect } from 'react';
import { favoritesAPI } from '../services/api';
import ProductCard from '../components/product/ProductCard';
import { Heart } from 'lucide-react';

export default function FavoritesPage() {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        favoritesAPI.getAll().then(({ data }) => {
            setFavorites(data.favorites || []);
        }).catch(() => { }).finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-surface">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="font-display text-2xl lg:text-3xl font-bold text-primary mb-8">Favorilerim</h1>
                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i}><div className="skeleton rounded-2xl aspect-[3/4] mb-4" /><div className="skeleton h-4 w-3/4 rounded" /></div>
                        ))}
                    </div>
                ) : favorites.length === 0 ? (
                    <div className="text-center py-20 animate-fadeIn">
                        <div className="w-20 h-20 bg-surface-alt rounded-full flex items-center justify-center mx-auto mb-4">
                            <Heart className="text-muted" size={32} />
                        </div>
                        <h2 className="text-xl font-semibold text-primary mb-2">Henüz Favori Yok</h2>
                        <p className="text-sm text-muted">Beğendiğiniz ürünleri favorilere ekleyin</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                        {favorites.map((fav, i) => (
                            <ProductCard key={fav.productId} product={{ _id: fav.productId, productName: fav.name, mainImage: fav.image, productSellPrice: fav.price, formattedPrice: `${(fav.price || 0).toLocaleString('tr-TR')} TL`, inStock: true }} index={i} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
