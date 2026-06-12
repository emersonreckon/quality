
import React from 'react';
import SerialInput from '@/components/SerialInput';

interface WelcomeScreenProps {
  isInIframe: boolean;
  isLoading: boolean;
  onSerialSubmit: (serial: string, cabinetType: 'cabinet' | 'cabinet-with-cm') => Promise<void>;
  openInNewWindow: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
  isLoading, 
  onSerialSubmit
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <SerialInput 
        onSerialSubmit={onSerialSubmit} 
        isLoading={isLoading}
      />
    </div>
  );
};

export default WelcomeScreen;
