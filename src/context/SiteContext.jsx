import { createContext, useContext, useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';

export const SiteContext = createContext(null);

const defaultSettings = {
    siteName: '',
    siteSlogan: '',
    logo: null,
    colors: { primary: '#0f172a', accent: '#c2956b', headerBg: '#ffffff', footerBg: '#0f172a' },
    contact: { phone: '', email: '', address: '' },
    social: {},
    banners: [],
    sideBanners: [],
    bannerLayout: 'slider',
    bannerMobileHeight: 450,
    bannerDesktopHeight: 900,
    announcementBar: { isActive: false, text: '', bgColor: '#000', textColor: '#fff' },
    shipping: { freeShippingLimit: 500, defaultShippingCost: 39.90, estimatedDeliveryDays: '2-4 iş günü' },
    payment: { creditCard: true },
    footer: { aboutText: '', copyrightText: '' },
};

export function SiteProvider({ children }) {
    const [settings, setSettings] = useState(defaultSettings);
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            const { data } = await settingsAPI.get();
            if (data.success) setSettings({ ...defaultSettings, ...data.settings });
        } catch (e) {
            console.warn('Settings fetch failed, using defaults');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();

        // Admin panelinden eklenen/değiştirilen veriler hemen yasınsın:
        // sekme odak değişiminde yenile (admin paneliinden geri dönünce)
        const handleFocus = () => fetchSettings();
        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') fetchSettings();
        });

        // Her 30 saniyede bir de otomatik yenile
        const interval = setInterval(fetchSettings, 30000);

        return () => {
            window.removeEventListener('focus', handleFocus);
            clearInterval(interval);
        };
    }, []);

    return (
        <SiteContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
            {children}
        </SiteContext.Provider>
    );
}

export const useSite = () => useContext(SiteContext);
