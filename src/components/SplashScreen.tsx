
import React, { useEffect, useState } from 'react';

const SplashScreen: React.FC = () => {
    const [isVisible, setIsVisible] = useState(true);
    const [shouldRender, setShouldRender] = useState(true);

    useEffect(() => {
        console.log("🔍 SPLASH DEBUG: Splash Screen Mounted");

        // Start fade out after 2.5 seconds (increased for visibility)
        const fadeTimer = setTimeout(() => {
            console.log("🔍 SPLASH DEBUG: Starting Fade Out");
            setIsVisible(false);
        }, 2500);

        // Completely remove from DOM after 3.1 seconds
        const removeTimer = setTimeout(() => {
            console.log("🔍 SPLASH DEBUG: Removing from DOM");
            setShouldRender(false);
        }, 3100);

        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(removeTimer);
        };
    }, []);

    if (!shouldRender) {
        console.log("🔍 SPLASH DEBUG: Splash not rendering anymore");
        return null;
    }

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#E5292F] transition-opacity duration-500 ${!isVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
            <div className="relative animate-scale-in">
                {/* Large White R Logo */}
                <div className="w-32 h-32 md:w-48 md:h-48 flex items-center justify-center">
                    <svg viewBox="0 0 859.74 859.74" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
                        <path d="M533.17,188.88c-26.56,0-52.87,5.7-78.82,17.15-25.95,11.45-48.54,33.84-67.68,67.22h-1.88l-5.55-70.47h-203.38v465.49h208.93v-290.24c0-18.52,4.33-31.85,12.98-39.84,8.65-8.04,19.18-12.06,31.55-12.06,27.22,0,40.81,17.91,40.81,53.78v14.04h208.93v-35.36c0-30.89-4.02-57.19-12.06-78.82-8.04-21.63-19.18-39.08-33.38-52.41-26.1-24.37-64.88-38.47-100.45-38.47Z" fill="white" />
                        <circle cx="574.79" cy="565.02" r="105.84" fill="white" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
