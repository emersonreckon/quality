
import { useState, useEffect, useCallback } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import InspectionForm from '@/components/InspectionForm';
import { toast } from "sonner";
import Header from '@/components/Header';
import WelcomeScreen from '@/components/WelcomeScreen';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { checkDraftExists, deleteDraftFolder, isNativePlatform, listAllDrafts } from '@/utils/nativeFileUtils';
import { loadFullDraft, LoadedDraft } from '@/utils/draftUtils';

const Index = () => {
  const [serialNumber, setSerialNumber] = useLocalStorage<string>('photoApp_serialNumber', '');
  const [cabinetType, setCabinetType] = useLocalStorage<'cabinet' | 'cabinet-with-cm'>('photoApp_cabinetType', 'cabinet-with-cm');
  const [machineType, setMachineType] = useLocalStorage<'rework' | 'nls'>('photoApp_machineType', 'rework');
  const [showInspectionForm, setShowInspectionForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Estados de rascunho
  const [pendingSerial, setPendingSerial] = useState('');
  const [pendingCabinetType, setPendingCabinetType] = useState<'cabinet' | 'cabinet-with-cm'>('cabinet-with-cm');
  const [pendingMachineType, setPendingMachineType] = useState<'rework' | 'nls'>('rework');
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [loadedDraft, setLoadedDraft] = useState<LoadedDraft | null>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [pendingDrafts, setPendingDrafts] = useState<string[]>([]);
  const [isDraftListLoading, setIsDraftListLoading] = useState(false);

  useEffect(() => {
    if (showInspectionForm) return;
    setIsDraftListLoading(true);
    listAllDrafts()
      .then(drafts => setPendingDrafts(drafts))
      .catch(() => setPendingDrafts([]))
      .finally(() => setIsDraftListLoading(false));
  }, [showInspectionForm]);

  // Remove qualquer Service Worker/cache de versões antigas da app: a app corre
  // 100% offline com os ficheiros já embutidos pelo Capacitor, e um SW cache-first
  // sem invalidação fazia com que atualizações do APK continuassem a mostrar a UI antiga.
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      });
    }
    if ('caches' in window) {
      caches.keys().then(names => names.forEach(name => caches.delete(name)));
    }
  }, []);

  const openInNewWindow = () => {
    const currentUrl = window.location.href;
    window.open(currentUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSerialSubmit = async (serial: string, type: 'cabinet' | 'cabinet-with-cm', machine: 'rework' | 'nls') => {
    console.log("Index: handleSerialSubmit called with serial:", serial, "machine:", machine, "type:", type);
    setIsLoading(true);

    try {
      // Verifica rascunho apenas na plataforma nativa (Android)
      if (isNativePlatform()) {
        const draftExists = await checkDraftExists(serial);
        if (draftExists) {
          setPendingSerial(serial);
          setPendingCabinetType(type);
          setPendingMachineType(machine);
          setShowDraftDialog(true);
          return;
        }
      }

      setSerialNumber(serial);
      setCabinetType(type);
      setMachineType(machine);
      setLoadedDraft(null);
      setShowInspectionForm(true);
      console.log("Index: Serial and type stored, inspection form shown");
    } catch (error) {
      console.error("Index: Error in serial submission:", error);
      toast.error("Ocorreu um erro ao processar o número de série.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueDraft = async (directSerial?: string) => {
    const targetSerial = directSerial ?? pendingSerial;
    setIsLoadingDraft(true);
    try {
      const draft = await loadFullDraft(targetSerial);
      if (!draft) {
        toast.warning("Rascunho incompleto", {
          description: "Não foi possível carregar os dados guardados. A iniciar inspeção em branco.",
        });
      }
      setSerialNumber(targetSerial);
      setCabinetType(draft?.json.cabinetType ?? pendingCabinetType);
      setMachineType(draft?.json.machineType ?? pendingMachineType);
      setLoadedDraft(draft);
      setShowDraftDialog(false);
      setShowInspectionForm(true);
    } catch (error) {
      console.error("Index: Erro ao carregar rascunho:", error);
      toast.error("Erro ao carregar rascunho. Tente novamente.");
    } finally {
      setIsLoadingDraft(false);
    }
  };

  const handleNewInspection = async () => {
    await deleteDraftFolder(pendingSerial);
    setSerialNumber(pendingSerial);
    setCabinetType(pendingCabinetType);
    setMachineType(pendingMachineType);
    setLoadedDraft(null);
    setShowDraftDialog(false);
    setShowInspectionForm(true);
  };

  const resetSession = () => {
    if (confirm("Tem certeza que deseja resetar a sessão?")) {
      console.log("Index: Resetting session");
      setSerialNumber('');
      setCabinetType('cabinet-with-cm');
      setMachineType('rework');
      setShowInspectionForm(false);
      setLoadedDraft(null);
    }
  };

  const handleFormReset = useCallback(() => {
    console.log("Index: Resetting form state");

    setSerialNumber('');
    setCabinetType('cabinet-with-cm');
    setMachineType('rework');
    setShowInspectionForm(false);
    setLoadedDraft(null);

    toast.success("Inspeção finalizada", {
      description: "Formulário reseteado. Pronto para nova inspeção."
    });
  }, [setSerialNumber, setCabinetType, setMachineType]);

  console.log("Index: Current state:", {
    serialNumber,
    cabinetType,
    machineType,
    showInspectionForm,
    isLoading
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F9F9] antialiased">
      <Header
        serialNumber={serialNumber}
        resetSession={resetSession}
        onLogoClick={showInspectionForm ? () => {
          if (window.confirm('Tens a certeza que queres sair? O progresso não guardado será perdido.')) {
            handleFormReset();
          }
        } : undefined}
      />

      <main className="flex-1 flex flex-col items-center justify-start py-8 px-4 sm:px-6 animate-fade-in overflow-auto">
        {!showInspectionForm ? (
          <>
            <WelcomeScreen
              isInIframe={false}
              isLoading={isLoading}
              onSerialSubmit={handleSerialSubmit}
              openInNewWindow={openInNewWindow}
            />
            {(isDraftListLoading || pendingDrafts.length > 0) && (
              <div className="w-full max-w-[480px] mx-auto mt-4 bg-white shadow-xl rounded-[32px] overflow-hidden">
                <div className="px-6 py-5">
                  <h3 className="text-[11px] font-[700] uppercase tracking-[1.4px] text-[#9A9A9A] font-inter mb-3">
                    Inspeções Pendentes
                  </h3>
                  {isDraftListLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <svg className="animate-spin h-5 w-5 text-[#E5292F]" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                  ) : (
                    <Select
                      onValueChange={(sn) => handleContinueDraft(sn)}
                      disabled={isLoadingDraft}
                    >
                      <SelectTrigger className="h-[52px] w-full border-[1.5px] border-[#E8E8E8] rounded-[14px] px-4 text-[15px] font-[500] font-inter focus:border-[#E5292F] focus:ring-[#E5292F]/10">
                        <SelectValue placeholder="Selecionar inspeção pendente..." />
                      </SelectTrigger>
                      <SelectContent side="top">
                        {pendingDrafts.map(sn => (
                          <SelectItem key={sn} value={sn} className="font-inter text-[15px]">
                            {sn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <InspectionForm
            serialNumber={serialNumber}
            cabinetType={cabinetType}
            machineType={machineType}
            onReset={handleFormReset}
            initialDraft={loadedDraft ?? undefined}
          />
        )}
      </main>

      {/* Diálogo de rascunho existente */}
      {showDraftDialog && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 relative">
            <button
              className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => setShowDraftDialog(false)}
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">Inspeção em curso</h2>
            <p className="text-sm text-gray-600">
              Existe uma inspeção guardada para o S/N{' '}
              <span className="font-bold text-gray-900">{pendingSerial}</span>.
              Deseja continuar ou iniciar uma nova inspeção?
            </p>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleNewInspection}
                disabled={isLoadingDraft}
              >
                Nova inspeção
              </Button>
              <Button
                className="flex-1"
                onClick={() => handleContinueDraft()}
                disabled={isLoadingDraft}
              >
                {isLoadingDraft ? 'A carregar...' : 'Continuar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
