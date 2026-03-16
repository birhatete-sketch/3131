import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSite } from '../../context/SiteContext';
import { newsletterAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Mail, Phone, MapPin, Instagram, Facebook, Twitter, Youtube } from 'lucide-react';

export default function Footer() {
    const { settings } = useSite();
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);

    const handleNewsletter = async (e) => {
        e.preventDefault();
        if (!email.includes('@')) return toast.error('Geçerli bir e-posta girin');
        setSending(true);
        try {
            const { data } = await newsletterAPI.subscribe(email);
            toast.success(data.message || 'Başarıyla abone oldunuz!');
            setEmail('');
        } catch { toast.error('Bir hata oluştu'); }
        finally { setSending(false); }
    };

    const socialIcons = {
        instagram: Instagram, facebook: Facebook, twitter: Twitter, youtube: Youtube,
    };

    const whatsappNumber = settings.contact?.whatsapp?.replace(/\D/g, '') || '';

    return (
        <footer className="bg-primary text-white/80 relative">

            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                    {/* Brand */}
                    <div>
                        <h3 className="font-display text-xl font-bold text-white mb-4">{settings.siteName}</h3>
                        <p className="text-white/40 text-sm leading-relaxed mb-6">{settings.footer?.aboutText || settings.siteSlogan}</p>
                        <div className="flex gap-3">
                            {Object.entries(settings.social || {}).map(([key, url]) => {
                                const Icon = socialIcons[key];
                                if (!Icon || !url || url === '#') return null;
                                return (
                                    <a key={key} href={url} target="_blank" rel="noreferrer"
                                        className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-accent text-white/50 hover:text-white transition-all duration-200">
                                        <Icon size={14} />
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">Hızlı Erişim</h4>
                        <ul className="space-y-3">
                            {[['/', 'Ana Sayfa'], ['/search', 'Tüm Ürünler'], ['/cart', 'Sepetim'], ['/account', 'Hesabım'], ['/favorites', 'Favorilerim']].map(([path, label]) => (
                                <li key={path}><Link to={path} className="text-sm text-white/40 hover:text-accent transition-colors">{label}</Link></li>
                            ))}
                        </ul>
                    </div>

                    {/* Customer Service */}
                    <div>
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">Müşteri Hizmetleri</h4>
                        <ul className="space-y-3 text-sm text-white/40">
                            <li>Sipariş Takibi</li>
                            <li><Link to="/return-exchange" className="hover:text-accent transition-colors">İade & Değişim</Link></li>
                            <li>Teslimat Bilgileri</li>
                            <li>Gizlilik Politikası</li>
                            <li>Kullanım Koşulları</li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">İletişim</h4>
                        <ul className="space-y-4">
                            {settings.contact?.phone && (
                                <li className="flex items-start gap-3 text-sm text-white/40">
                                    <Phone className="text-accent mt-0.5 flex-shrink-0" size={16} />
                                    <span>{settings.contact.phone}</span>
                                </li>
                            )}
                            {settings.contact?.email && (
                                <li className="flex items-start gap-3 text-sm text-white/40">
                                    <Mail className="text-accent mt-0.5 flex-shrink-0" size={16} />
                                    <span>{settings.contact.email}</span>
                                </li>
                            )}
                            {settings.contact?.address && (
                                <li className="flex items-start gap-3 text-sm text-white/40">
                                    <MapPin className="text-accent mt-0.5 flex-shrink-0" size={16} />
                                    <span>{settings.contact.address}</span>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom */}
            <div className="border-t border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* Payment Logos */}
                    <div className="flex items-center justify-center gap-4 mb-4">
                        {/* Visa */}
                        <div className="bg-white/10 rounded-lg px-3 py-1.5 flex items-center justify-center" title="Visa">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-10 h-6">
                                <path fill="#1565C0" d="M15.186 19l-2.626 7.832c0 0-0.667-3.313-0.733-3.729-1.495-3.411-3.7-3.221-3.7-3.221L10.846 29h3.102L18.894 19H15.186z" />
                                <path fill="#1565C0" d="M17.689 29L20.56 19h3.063L20.74 29H17.689z" />
                                <path fill="#1565C0" d="M38.008 19h-3.021l-4.71 10h2.852l0.588-1.571h3.596L37.619 29h2.613L38.008 19zM34.513 25.429l1.543-4.143 0.872 4.143H34.513z" />
                                <path fill="#1565C0" d="M23.709 19c0 0 3.234 0 4.153 0 2.028 0 3.394 1.258 3.261 3.188-0.171 2.494-2.072 3.786-4.482 3.812H25.24L24.721 29H21.847L23.709 19zM25.953 24.14h0.922c0.965 0 1.845-0.566 1.928-1.567 0.063-0.759-0.506-1.273-1.358-1.273h-0.997L25.953 24.14z" />
                            </svg>
                        </div>
                        {/* MasterCard */}
                        <div className="bg-white/10 rounded-lg px-3 py-1.5 flex items-center justify-center" title="MasterCard">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-10 h-6">
                                <circle fill="#FF5252" cx="18" cy="24" r="9" />
                                <circle fill="#FF9800" cx="30" cy="24" r="9" />
                                <path fill="#FF7043" d="M24 17.65c2.08 1.59 3.42 4.07 3.42 6.85s-1.34 5.26-3.42 6.85c-2.08-1.59-3.42-4.07-3.42-6.85S21.92 19.24 24 17.65z" />
                            </svg>
                        </div>
                        {/* Troy */}
                        <div className="bg-white/10 rounded-lg px-3 py-1.5 flex items-center justify-center" title="Troy">
                            <span className="text-white/70 text-xs font-bold tracking-wider">TROY</span>
                        </div>
                        {/* SSL */}
                        <div className="bg-white/10 rounded-lg px-3 py-1.5 flex items-center justify-center" title="256-bit SSL">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-green-400 mr-1"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                            <span className="text-green-400 text-[10px] font-semibold">SSL</span>
                        </div>
                    </div>
                    <p className="text-center text-xs text-white/30">{settings.footer?.copyrightText || `© ${new Date().getFullYear()} ${settings.siteName}`}</p>
                </div>
            </div>
        </footer>
    );
}
