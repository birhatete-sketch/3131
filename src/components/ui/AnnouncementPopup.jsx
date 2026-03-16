import { useState, useEffect } from 'react';
import { useSite } from '../../context/SiteContext';
import { X } from 'lucide-react';

export default function AnnouncementPopup() {
    const { settings } = useSite();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!settings?.announcementPopup?.isActive) return;

        const popupData = settings.announcementPopup;
        // Default to true if undefined
        const showOnce = popupData.showOncePerSession !== false;

        // Key includes showButton state so toggling it resets dismissal
        const keyBase = `${popupData.text || ''}${popupData.image || ''}${popupData.showButton}`.substring(0, 30);
        const storageKey = `announcement_popup_dismissed_${keyBase}`;

        if (showOnce) {
            const hasDismissed = sessionStorage.getItem(storageKey);
            if (hasDismissed) return;
        }

        const timer = setTimeout(() => {
            setIsOpen(true);
        }, 2000);
        return () => clearTimeout(timer);
    }, [settings]);

    const handleClose = () => {
        setIsOpen(false);
        if (settings?.announcementPopup) {
            const popupData = settings.announcementPopup;
            const keyBase = `${popupData.text || ''}${popupData.image || ''}${popupData.showButton}`.substring(0, 30);
            sessionStorage.setItem(`announcement_popup_dismissed_${keyBase}`, 'true');
        }
    };

    if (!isOpen || !settings?.announcementPopup?.isActive) return null;

    const { text, image, link, showButton, width, height, buttonBgColor, buttonTextColor, buttonText } = settings.announcementPopup;

    const popupWidth = width ? `${width}px` : '450px';
    const imageMaxHeight = height ? `${height}px` : '400px';
    const btnBg = buttonBgColor || '#000000';
    const btnText = buttonTextColor || '#ffffff';
    const btnLabel = buttonText || 'Hemen İncele';

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={handleClose}
        >
            <div 
                className="relative bg-white rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] animate-in zoom-in-95 duration-500 ease-out"
                onClick={(e) => e.stopPropagation()}
                style={{ width: '100%', maxWidth: popupWidth }}
            >
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-white/50 hover:bg-white text-gray-800 rounded-full transition-all backdrop-blur-md shadow-sm opacity-80 hover:opacity-100 hover:scale-105"
                >
                    <X size={18} strokeWidth={2} />
                </button>

                {image ? (
                    <div className="relative w-full overflow-hidden bg-gray-50 flex items-center justify-center" style={{ maxHeight: imageMaxHeight }}>
                        {/* Görsele tıklanabilir link — buton yoksa tüm görsel tıklanabilir */}
                        {link && !showButton ? (
                            <a href={link} onClick={() => setIsOpen(false)} className="block w-full h-full">
                                <img src={image} alt="Announcement" className="w-full h-full object-contain" style={{ maxHeight: imageMaxHeight }} />
                            </a>
                        ) : (
                            <img src={image} alt="Announcement" className="w-full h-full object-contain" style={{ maxHeight: imageMaxHeight }} />
                        )}

                        {/* Yazı YOK, buton AÇIK → butonu görselin alt kısmına yerleştir */}
                        {showButton && !text && (
                            <div className="absolute bottom-5 left-0 right-0 flex justify-center px-6">
                                <a
                                    href={link || '#'}
                                    onClick={!link ? handleClose : () => setIsOpen(false)}
                                    style={{ backgroundColor: btnBg, color: btnText }}
                                    className="inline-flex items-center justify-center min-w-[200px] py-3.5 px-8 font-medium text-sm rounded-full shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95 text-center"
                                >
                                    {btnLabel}
                                </a>
                            </div>
                        )}
                    </div>
                ) : null}

                {/* Yazı VARSA → aşağıda beyaz alanda göster, butonu da orada göster */}
                {text && (
                    <div className="p-8 text-center bg-white flex flex-col items-center justify-center">
                        <div className="text-[17px] leading-relaxed font-medium text-gray-900 whitespace-pre-line tracking-tight" style={{ marginBottom: showButton ? '24px' : 0 }}>
                            {text}
                        </div>

                        {showButton && (
                            <a
                                href={link || '#'}
                                onClick={!link ? handleClose : () => setIsOpen(false)}
                                style={{ backgroundColor: btnBg, color: btnText }}
                                className="inline-flex items-center justify-center w-full sm:w-auto min-w-[200px] py-3.5 px-6 font-medium text-sm rounded-full shadow-sm transition-transform duration-200 hover:scale-105 active:scale-95 text-center"
                            >
                                {btnLabel}
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
