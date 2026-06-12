
import React from 'react';
import { Camera } from 'lucide-react';

interface CameraButtonProps {
  id: string;
  label: string;
  onClick: () => void;
  disabled: boolean;
}

const CameraButton: React.FC<CameraButtonProps> = ({ id, label, onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative flex flex-col items-center justify-center p-4 rounded-2xl
        bg-secondary/80 hover:bg-secondary transition-all duration-300
        border border-border/50
        w-full h-32 btn-press
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="w-full h-full bg-primary/5 rounded-2xl" />
      </div>
      
      <div className="mb-3 p-3 rounded-full bg-accent text-accent-foreground">
        <Camera className="w-6 h-6" />
      </div>
      
      <span className="font-medium text-foreground/90">{label}</span>
    </button>
  );
};

export default CameraButton;
