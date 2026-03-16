import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Lock } from 'lucide-react';

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            toast.error('Geçersiz sıfırlama bağlantısı');
            navigate('/login');
        }
    }, [token, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password.length < 6) return toast.error('Şifre en az 6 karakter olmalıdır');
        if (password !== confirmPassword) return toast.error('Şifreler uyuşmuyor');

        setLoading(true);
        try {
            const { data } = await authAPI.resetPassword(token, password);
            if (data.success) {
                toast.success('Şifreniz başarıyla güncellendi! Giriş yapabilirsiniz.');
                navigate('/login');
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Şifre güncellenemedi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-surface px-4 py-12">
            <div className="w-full max-w-md animate-fadeIn">
                <div className="text-center mb-8">
                    <h1 className="font-display text-3xl font-bold text-primary">Yeni Şifre Belirle</h1>
                    <p className="text-sm text-muted mt-2">Lütfen yeni ve güvenli bir şifre girin.</p>
                </div>

                <div className="bg-white rounded-2xl border border-border/50 p-8 space-y-6 shadow-xl shadow-primary/5">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-muted mb-1.5">Yeni Şifre</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-4 py-3 text-sm border border-border rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 bg-surface-alt"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-muted mb-1.5">Şifre Tekrar</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-4 py-3 text-sm border border-border rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 bg-surface-alt"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-primary hover:bg-secondary text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 text-sm shadow-lg shadow-primary/20"
                        >
                            {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
