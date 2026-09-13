
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
                    <svg viewBox="0 0 640 640" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
                        <path d="M385,172L361,172L360,173L354,173L353,174L349,174L348,175L345,175L344,176L342,176L341,177L339,177L338,178L336,178L335,179L333,179L332,180L331,180L330,181L329,181L328,182L327,182L326,183L325,183L324,184L323,184L322,185L321,185L320,186L319,186L318,187L317,187L315,189L314,189L311,192L310,192L306,196L305,196L296,205L296,206L293,209L293,210L290,213L290,214L288,216L288,217L286,220L285,220L284,219L284,177L203,177L203,465L290,465L290,316L291,315L291,309L292,308L292,304L293,303L293,301L294,300L294,297L295,296L295,294L296,293L296,292L297,291L297,290L298,289L298,288L299,287L299,286L300,285L300,284L301,283L301,282L303,280L303,279L306,276L306,275L314,267L315,267L318,264L319,264L320,263L321,263L323,261L324,261L325,260L326,260L327,259L328,259L331,257L333,257L334,256L336,256L337,255L339,255L340,254L344,254L345,253L351,253L352,252L376,252L377,253L383,253L384,254L385,254Z" fill="white" />
                        <circle cx="392.65" cy="423.54" r="44.65" fill="white" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
