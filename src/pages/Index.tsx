
import React, { useState, useEffect, useCallback } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import InspectionForm from '@/components/InspectionForm';
import { toast } from "sonner";
import { useIsMobile } from '@/hooks/use-mobile';
import Header from '@/components/Header';
import WelcomeScreen from '@/components/WelcomeScreen';

const Index = () => {
  const [serialNumber, setSerialNumber] = useLocalStorage<string>('photoApp_serialNumber', '');
  const [cabinetType, setCabinetType] = useLocalStorage<'cabinet' | 'cabinet-with-cm'>('photoApp_cabinetType', 'cabinet-with-cm');
  const [showInspectionForm, setShowInspectionForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
          },
          err => {
            console.log('ServiceWorker registration failed: ', err);
          }
        );
      });
    }
  }, []);

  const openInNewWindow = () => {
    const currentUrl = window.location.href;
    window.open(currentUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSerialSubmit = async (serial: string, type: 'cabinet' | 'cabinet-with-cm') => {
    console.log("Index: handleSerialSubmit called with serial:", serial, "type:", type);

    try {
      setSerialNumber(serial);
      setCabinetType(type);
      setShowInspectionForm(true);

      console.log("Index: Serial and type stored, inspection form shown");
    } catch (error) {
      console.error("Index: Error in serial submission:", error);
      toast.error("Ocorreu um erro ao processar o número de série.");
    }
  };

  const resetSession = () => {
    if (confirm("Tem certeza que deseja resetar a sessão?")) {
      console.log("Index: Resetting session");
      setSerialNumber('');
      setCabinetType('cabinet-with-cm');
      setShowInspectionForm(false);
    }
  };

  const handleFormReset = useCallback(() => {
    console.log("Index: Resetting form state");

    setSerialNumber('');
    setCabinetType('cabinet-with-cm');
    setShowInspectionForm(false);

    toast.success("Inspeção finalizada", {
      description: "Formulário reseteado. Pronto para nova inspeção."
    });
  }, [setSerialNumber, setCabinetType]);

  console.log("Index: Current state:", {
    serialNumber,
    cabinetType,
    showInspectionForm,
    isLoading
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F9F9] antialiased">
      <Header serialNumber={serialNumber} resetSession={resetSession} />

      <main className="flex-1 flex flex-col items-center justify-start py-8 px-4 sm:px-6 animate-fade-in overflow-auto">
        {!showInspectionForm ? (
          <WelcomeScreen
            isInIframe={false}
            isLoading={isLoading}
            onSerialSubmit={handleSerialSubmit}
            openInNewWindow={openInNewWindow}
          />
        ) : (
          <InspectionForm
            serialNumber={serialNumber}
            cabinetType={cabinetType}
            onReset={handleFormReset}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
