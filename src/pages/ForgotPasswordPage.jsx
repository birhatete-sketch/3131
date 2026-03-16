import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return toast.error('E-posta adresi gereklidir');

        setLoading(true);
        try {
            const { data } = await authAPI.forgotPassword(email);
            if (data.success) {
                toast.success(data.message || 'Sıfırlama bağlantısı gönderildi.');
                navigate('/login');
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-surface px-4 py-12">
            <div className="w-full max-w-md animate-fadeIn">
                <div className="text-center mb-8">
                    <h1 className="font-display text-3xl font-bold text-primary">Şifremi Unuttum</h1>
                    <p className="text-sm text-muted mt-2">Kayıtlı e-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.</p>
                </div>

                <div className="bg-white rounded-2xl border border-border/50 p-8 space-y-6 shadow-xl shadow-primary/5">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-muted mb-1.5">E-posta Adresiniz</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="ornek@email.com"
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
                            {loading ? 'Gönderiliyor...' : 'Bağlantı Gönder'}
                        </button>
                    </form>

                    <div className="text-center border-t border-border/50 pt-6">
                        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-accent hover:underline font-medium">
                            <ArrowLeft size={14} />
                            Giriş Sayfasına Dön
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
