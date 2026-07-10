
import React from 'react';

interface HeaderProps {
  serialNumber: string;
  resetSession: () => void;
  onLogoClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ serialNumber, resetSession, onLogoClick }) => {
  return (
    <header
      className="w-full px-6 pb-4 flex items-center justify-between bg-[#1A1A1A] border-b border-white/5 z-20"
      style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}
    >
      <div className="flex items-center space-x-3">
        {/* Reckon Icon */}
        <div
          className={`w-8 h-8 bg-[#E5292F] rounded-[8px] flex items-center justify-center p-1.5 shadow-sm${onLogoClick ? ' cursor-pointer active:opacity-70 transition-opacity' : ''}`}
          onClick={onLogoClick}
        >
          <svg viewBox="0 0 859.74 859.74" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M533.17,188.88c-26.56,0-52.87,5.7-78.82,17.15-25.95,11.45-48.54,33.84-67.68,67.22h-1.88l-5.55-70.47h-203.38v465.49h208.93v-290.24c0-18.52,4.33-31.85,12.98-39.84,8.65-8.04,19.18-12.06,31.55-12.06,27.22,0,40.81,17.91,40.81,53.78v14.04h208.93v-35.36c0-30.89-4.02-57.19-12.06-78.82-8.04-21.63-19.18-39.08-33.38-52.41-26.1-24.37-64.88-38.47-100.45-38.47Z" fill="white" />
            <circle cx="574.79" cy="565.02" r="105.84" fill="white" />
          </svg>
        </div>
      </div>

      <div className="flex items-center">
        <h1 className="text-[13px] font-[700] text-[#9A9A9A] uppercase tracking-[0.6px] font-inter">
          Quality Control Production
        </h1>
      </div>

      <div className="flex items-center">
        {/* Espaçador para manter o título centralizado */}
        <div className="w-8 h-8"></div>
      </div>
    </header>
  );
};

export default Header;
