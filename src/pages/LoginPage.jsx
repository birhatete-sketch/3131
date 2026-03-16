import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSite } from '../context/SiteContext';
import toast from 'react-hot-toast';
import { Mail, Lock, User } from 'lucide-react';

export default function LoginPage() {
    const { login, register, googleLogin } = useAuth();
    const { settings } = useSite();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isRegister, setIsRegister] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '' });
    const googleBtnRef = useRef(null);

    const googleClientId = settings?.seo?.googleClientId;

    // E-posta doğrulama sonucu kontrolü
    useEffect(() => {
        const emailVerified = searchParams.get('emailVerified');
        if (emailVerified === 'success') {
            toast.success('E-posta adresiniz başarıyla doğrulandı! Şimdi giriş yapabilirsiniz.', { duration: 5000 });
        } else if (emailVerified === 'error') {
            const reason = searchParams.get('reason');
            if (reason === 'invalid-or-expired') {
                toast.error('Doğrulama linki geçersiz veya süresi dolmuş. Lütfen yeni bir doğrulama e-postası isteyin.', { duration: 5000 });
            } else {
                toast.error('E-posta doğrulama başarısız. Lütfen tekrar deneyin.', { duration: 5000 });
            }
        }
    }, [searchParams]);

    useEffect(() => {
        if (!googleClientId) return;

        // Load Google SDK
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            if (window.google) {
                window.google.accounts.id.initialize({
                    client_id: googleClientId,
                    callback: handleGoogleResponse,
                });
                window.google.accounts.id.renderButton(googleBtnRef.current, {
                    theme: 'outline',
                    size: 'large',
                    width: '100%',
                    text: 'signin_with',
                    shape: 'rectangular'
                });
            }
        };
        document.body.appendChild(script);
        return () => {
            if (document.body.contains(script)) document.body.removeChild(script);
        };
    }, [googleClientId]);

    const handleGoogleResponse = async (response) => {
        try {
            setLoading(true);
            await googleLogin(response.credential, googleClientId);
            toast.success('Google ile giriş başarılı!');
            navigate('/');
        } catch (err) {
            const errorMsg = err.response?.data?.details || err.response?.data?.error || 'Google girişi başarısız';
            toast.error(errorMsg);
        } finally { setLoading(false); }
    };

    const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isRegister) {
                if (!form.firstName || !form.lastName || !form.email || !form.password) {
                    return toast.error('Lütfen tüm alanları doldurun');
                }
                await register(form);
                toast.success('Hesabınız oluşturuldu! Doğrulama maili gönderildi.', { duration: 5000 });
            } else {
                if (!form.email || !form.password) return toast.error('E-posta ve şifre girin');
                await login(form.email, form.password);
                toast.success('Giriş başarılı!');
            }
            navigate('/');
        } catch (e) {
            toast.error(e.response?.data?.error || e.response?.data?.message || 'İşlem başarısız');
        } finally { setLoading(false); }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-surface px-4 py-12">
            <div className="w-full max-w-md animate-fadeIn">
                <div className="text-center mb-8">
                    <h1 className="font-display text-3xl font-bold text-primary">{isRegister ? 'Hesap Oluştur' : 'Giriş Yap'}</h1>
                    <p className="text-sm text-muted mt-2">{isRegister ? 'Yeni bir hesap oluşturarak alışverişe başlayın' : 'Hesabınıza giriş yapın'}</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border/50 p-8 space-y-5">
                    {isRegister && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-muted mb-1.5">Ad</label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
                                    <input type="text" name="firstName" value={form.firstName} onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 text-sm border border-border rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 bg-surface-alt" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted mb-1.5">Soyad</label>
                                <input type="text" name="lastName" value={form.lastName} onChange={handleChange}
                                    className="w-full px-4 py-3 text-sm border border-border rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 bg-surface-alt" />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-muted mb-1.5">E-posta</label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
                            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="ornek@email.com"
                                className="w-full pl-10 pr-4 py-3 text-sm border border-border rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 bg-surface-alt" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-muted mb-1.5">Şifre</label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
                            <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••"
                                className="w-full pl-10 pr-4 py-3 text-sm border border-border rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 bg-surface-alt" />
                        </div>
                        {!isRegister && (
                            <div className="flex justify-end mt-1.5">
                                <Link to="/forgot-password" size="sm" className="text-[11px] text-muted hover:text-accent font-medium transition-colors">
                                    Şifremi Unuttum
                                </Link>
                            </div>
                        )}
                    </div>

                    {isRegister && (
                        <div>
                            <label className="block text-xs font-medium text-muted mb-1.5">Telefon</label>
                            <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="05XX XXX XX XX"
                                className="w-full px-4 py-3 text-sm border border-border rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 bg-surface-alt" />
                        </div>
                    )}

                    <button type="submit" disabled={loading}
                        className="w-full py-3.5 bg-primary hover:bg-secondary text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 text-sm">
                        {loading ? 'Lütfen bekleyin...' : (isRegister ? 'Hesap Oluştur' : 'Giriş Yap')}
                    </button>

                    {googleClientId && (
                        <>
                            <div className="relative flex items-center py-2">
                                <div className="flex-grow border-t border-border"></div>
                                <span className="flex-shrink mx-4 text-xs text-muted uppercase tracking-wider">Veya</span>
                                <div className="flex-grow border-t border-border"></div>
                            </div>

                            <div ref={googleBtnRef} className="flex justify-center"></div>
                        </>
                    )}
                </form>

                <p className="text-center text-sm text-muted mt-6">
                    {isRegister ? 'Zaten hesabınız var mı?' : 'Henüz hesabınız yok mu?'}{' '}
                    <button onClick={() => setIsRegister(!isRegister)} className="text-accent font-medium hover:underline">
                        {isRegister ? 'Giriş Yap' : 'Hesap Oluştur'}
                    </button>
                </p>

                <div className="mt-4 text-center">
                    <button
                        onClick={() => navigate('/')}
                        className="text-sm text-muted hover:text-primary transition-colors underline"
                    >
                        Alışveriş yapmadan devam et
                    </button>
                </div>
            </div>
        </div>
    );
}
