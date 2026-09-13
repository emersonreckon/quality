
import React from 'react';

interface HeaderProps {
  serialNumber: string;
  resetSession: () => void;
  onLogoClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ serialNumber, resetSession, onLogoClick }) => {
  return (
    <header
      className="w-full px-6 pb-4 bg-[#1A1A1A] border-b border-white/5 z-20"
      style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}
    >
      {/* Linha própria (sem padding assimétrico) para a centralização absoluta do título ser exata */}
      <div className="relative flex items-center justify-between">
        <div className="flex items-center space-x-3 z-10">
          {/* Reckon Icon */}
          <div
            className={`w-8 h-8 bg-[#E5292F] rounded-[8px] flex items-center justify-center p-1.5 shadow-sm${onLogoClick ? ' cursor-pointer active:opacity-70 transition-opacity' : ''}`}
            onClick={onLogoClick}
          >
            <svg viewBox="0 0 640 640" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path d="M385,172L361,172L360,173L354,173L353,174L349,174L348,175L345,175L344,176L342,176L341,177L339,177L338,178L336,178L335,179L333,179L332,180L331,180L330,181L329,181L328,182L327,182L326,183L325,183L324,184L323,184L322,185L321,185L320,186L319,186L318,187L317,187L315,189L314,189L311,192L310,192L306,196L305,196L296,205L296,206L293,209L293,210L290,213L290,214L288,216L288,217L286,220L285,220L284,219L284,177L203,177L203,465L290,465L290,316L291,315L291,309L292,308L292,304L293,303L293,301L294,300L294,297L295,296L295,294L296,293L296,292L297,291L297,290L298,289L298,288L299,287L299,286L300,285L300,284L301,283L301,282L303,280L303,279L306,276L306,275L314,267L315,267L318,264L319,264L320,263L321,263L323,261L324,261L325,260L326,260L327,259L328,259L331,257L333,257L334,256L336,256L337,255L339,255L340,254L344,254L345,253L351,253L352,252L376,252L377,253L383,253L384,254L385,254Z" fill="white" />
              <circle cx="392.65" cy="423.54" r="44.65" fill="white" />
            </svg>
          </div>
        </div>

        <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[13px] font-[700] text-[#9A9A9A] uppercase tracking-[0.6px] font-inter whitespace-nowrap">
          Quality Control Production
        </h1>

        <div className="w-8 h-8 z-10"></div>
      </div>
    </header>
  );
};

export default Header;
