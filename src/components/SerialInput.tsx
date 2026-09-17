
import React, { useState } from 'react';
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Capacitor } from '@capacitor/core';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';

interface SerialInputProps {
  onSerialSubmit: (serial: string, cabinetType: 'cabinet' | 'cabinet-with-cm', machineType: 'rework' | 'nls') => void;
  isLoading: boolean;
}

const SerialInput: React.FC<SerialInputProps> = ({ onSerialSubmit, isLoading }) => {
  const [serialNumber, setSerialNumber] = useState<string>('');
  const [machineType, setMachineType] = useState<'rework' | 'nls' | null>(null);
  const [cabinetType, setCabinetType] = useState<'cabinet' | 'cabinet-with-cm'>('cabinet-with-cm');
  const [isScanning, setIsScanning] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const { camera } = await BarcodeScanner.checkPermissions();
      if (camera === 'denied') {
        toast.error("Permissão de câmera necessária para fazer scan");
        return;
      }
      if (camera !== 'granted') {
        const { camera: granted } = await BarcodeScanner.requestPermissions();
        if (granted !== 'granted') {
          toast.error("Permissão de câmera necessária para fazer scan");
          return;
        }
      }
      const { barcodes } = await BarcodeScanner.scan({
        formats: [BarcodeFormat.Code128, BarcodeFormat.Code39, BarcodeFormat.Ean13],
      });
      if (barcodes.length > 0 && barcodes[0].rawValue) {
        const raw = barcodes[0].rawValue;
        setSerialNumber(raw.startsWith('SN_') ? raw : `SN_${raw}`);
      }
    } catch {
      toast.error("Não foi possível iniciar o scanner");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!serialNumber.trim()) {
      toast.error("Por favor, insira o número de série");
      return;
    }

    if (!machineType) {
      toast.error("Por favor, selecione o tipo de máquina");
      return;
    }

    console.log("SerialInput: Submitting with serial:", serialNumber, "machine:", machineType, "type:", cabinetType);
    onSerialSubmit(serialNumber.trim(), cabinetType, machineType);

    toast.success("Iniciando inspeção", {
      description: `${machineType === 'rework' ? 'Rework' : 'NLS'} · ${cabinetType === 'cabinet' ? 'Cabinet' : 'Cabinet with CM'}`
    });
  };

  return (
    // No telemóvel o cartão ocupa o ecrã todo (sem cantos/sombra/limite de largura);
    // o formato flutuante é só a partir de sm. Não remover.
    // flex-1 (em vez de min-h-screen) deixa o cartão encolher para dar espaço ao
    // painel de rascunhos, sem nunca ficar menor do que o próprio conteúdo.
    <div className="w-full flex-1 sm:flex-none sm:max-w-[480px] sm:mx-auto overflow-hidden bg-white sm:shadow-xl rounded-none sm:rounded-[40px] flex flex-col relative">
      <form onSubmit={handleSubmit} className="flex flex-col">

        {/* HERO SECTION */}
        <div className="w-full bg-[#E5292F] pt-[28px] px-[24px] pb-[32px] short:pt-4 short:pb-5 relative overflow-hidden animate-fade-up" style={{ animationDelay: '0s' }}>
          {/* Decorative Circles */}
          <div className="absolute top-[-20px] right-[-20px] w-[120px] h-[120px] rounded-full bg-white opacity-[0.07]"></div>
          <div className="absolute bottom-[-40px] right-[-10px] w-[160px] h-[160px] rounded-full bg-white opacity-[0.05]"></div>

          {/* Watermark */}
          <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 opacity-[0.12] pointer-events-none">
            <svg width="140" height="140" viewBox="0 0 640 640" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M385,172L361,172L360,173L354,173L353,174L349,174L348,175L345,175L344,176L342,176L341,177L339,177L338,178L336,178L335,179L333,179L332,180L331,180L330,181L329,181L328,182L327,182L326,183L325,183L324,184L323,184L322,185L321,185L320,186L319,186L318,187L317,187L315,189L314,189L311,192L310,192L306,196L305,196L296,205L296,206L293,209L293,210L290,213L290,214L288,216L288,217L286,220L285,220L284,219L284,177L203,177L203,465L290,465L290,316L291,315L291,309L292,308L292,304L293,303L293,301L294,300L294,297L295,296L295,294L296,293L296,292L297,291L297,290L298,289L298,288L299,287L299,286L300,285L300,284L301,283L301,282L303,280L303,279L306,276L306,275L314,267L315,267L318,264L319,264L320,263L321,263L323,261L324,261L325,260L326,260L327,259L328,259L331,257L333,257L334,256L336,256L337,255L339,255L340,254L344,254L345,253L351,253L352,252L376,252L377,253L383,253L384,254L385,254Z" fill="white" />
              <circle cx="392.65" cy="423.54" r="44.65" fill="white" />
            </svg>
          </div>

          <div className="relative z-10 space-y-2">
            <span className="text-[11px] font-[700] uppercase tracking-[1.4px] text-white/60 font-inter">
              reckon.ai · inspeção
            </span>
            <h2 className="text-[26px] font-[800] text-white tracking-[-0.5px] leading-[1.15] font-inter">
              Nova Inspeção
            </h2>
            <p className="text-[13px] font-[400] text-white/75 max-w-[240px] leading-relaxed font-inter">
              Insira o número de série e selecione o tipo de cabinet para iniciar.
            </p>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6 short:py-4 short:space-y-4 flex flex-col">
          {/* SERIAL NUMBER FIELD */}
          <div className="space-y-2 animate-fade-up" style={{ animationDelay: '0.08s' }}>
            <Label htmlFor="serial" className="text-[11px] font-[700] uppercase tracking-[1px] text-[#9A9A9A] font-inter">
              Número de Série
            </Label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9A9A] transition-colors group-focus-within:text-[#E5292F]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 5h18v14H3z" /><path d="M7 9v6" /><path d="M10 9v6" /><path d="M14 9v6" /><path d="M17 9v6" />
                </svg>
              </div>
              <Input
                id="serial"
                type="text"
                placeholder="Ex: SN_1234567890"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                autoComplete="off"
                className={`h-[52px] w-full border-[1.5px] border-[#E8E8E8] rounded-[14px] pl-12 text-[15px] font-[500] focus-visible:border-[#E5292F] focus-visible:ring-[#E5292F]/10 focus-visible:ring-offset-0 transition-all font-inter ${isNative ? 'pr-12' : 'pr-4'}`}
                disabled={isLoading}
              />
              {isNative && (
                <button
                  type="button"
                  onClick={handleScan}
                  disabled={isLoading || isScanning}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-[10px] bg-[#F4F4F4] text-[#9A9A9A] hover:bg-[#FCEAEA] hover:text-[#E5292F] active:scale-95 transition-all disabled:opacity-40"
                  aria-label="Scan código de barras"
                >
                  {isScanning ? (
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" />
                      <path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                      <line x1="7" y1="12" x2="7" y2="12.01" /><line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="17" y1="12" x2="17" y2="12.01" /><line x1="7" y1="8" x2="7" y2="16" />
                      <line x1="12" y1="12" x2="17" y2="12" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* MACHINE TYPE SECTION */}
          <div className="space-y-4 animate-fade-up" style={{ animationDelay: '0.14s' }}>
            <Label className="text-[11px] font-[700] uppercase tracking-[1px] text-[#9A9A9A] font-inter">
              Tipo de Máquina
            </Label>
            <RadioGroup
              value={machineType ?? undefined}
              onValueChange={(value) => setMachineType(value as 'rework' | 'nls')}
              className="grid grid-cols-1 gap-3"
              disabled={isLoading}
            >
              {[
                {
                  id: 'rework',
                  title: 'Rework',
                  icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 1 0 2.6-6.3" />
                      <path d="M3 5v5h5" />
                    </svg>
                  )
                },
                {
                  id: 'nls',
                  title: 'NLS',
                  icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="16" rx="2" />
                      <path d="M3 10h18" />
                      <path d="M8 4v6" />
                    </svg>
                  )
                }
              ].map((opt) => (
                <div key={opt.id} className="relative active:scale-[0.98] transition-transform">
                  <RadioGroupItem value={opt.id} id={`machine-${opt.id}`} className="peer sr-only" />
                  <Label
                    htmlFor={`machine-${opt.id}`}
                    className="flex items-center gap-4 border-[1.5px] border-[#E8E8E8] rounded-[20px] p-[18px] cursor-pointer transition-all peer-data-[state=checked]:border-[#E5292F] peer-data-[state=checked]:bg-[#FCEAEA] peer-data-[state=checked]:shadow-[0_0_0_3px_rgba(229,41,47,0.12)] group hover:border-[#E5292F]/50"
                  >
                    <div className="w-[52px] h-[52px] rounded-[14px] bg-[#F4F4F4] flex items-center justify-center transition-colors peer-data-[state=checked]:bg-[#E5292F]/14 text-[#9A9A9A] peer-data-[state=checked]:text-[#E5292F]">
                      {opt.icon}
                    </div>
                    <p className="flex-1 text-[15px] font-[700] text-[#1A1A1A] peer-data-[state=checked]:text-[#A3272B] font-inter">
                      {opt.title}
                    </p>
                    <div className="w-5 h-5 rounded-full border-2 border-[#E8E8E8] flex items-center justify-center transition-all peer-data-[state=checked]:border-[#E5292F]">
                      <div className="w-[10px] h-[10px] rounded-full bg-[#E5292F] opacity-0 scale-50 transition-all peer-data-[state=checked]:opacity-100 peer-data-[state=checked]:scale-100"></div>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {!machineType && (
              <p className="flex items-center gap-1.5 text-[12px] text-[#9A9A9A] font-inter">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                Escolha o tipo de máquina para continuar
              </p>
            )}
          </div>

          {/* CABINET TYPE SECTION */}
          {machineType && (
            <div className="space-y-4 animate-fade-up" style={{ animationDelay: '0s' }}>
              <Label className="text-[11px] font-[700] uppercase tracking-[1px] text-[#9A9A9A] font-inter">
                Tipo de Cabinet
              </Label>
              <RadioGroup
                value={cabinetType}
                onValueChange={(value) => setCabinetType(value as 'cabinet' | 'cabinet-with-cm')}
                className="grid grid-cols-1 gap-3"
                disabled={isLoading}
              >
                {[
                  {
                    id: 'cabinet',
                    title: 'Cabinet',
                    desc: 'Sem módulo de controle',
                    icon: (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <line x1="3" y1="9" x2="21" y2="9" />
                        <line x1="9" y1="21" x2="9" y2="9" />
                      </svg>
                    )
                  },
                  {
                    id: 'cabinet-with-cm',
                    title: 'Cabinet with CM',
                    desc: 'Com módulo de controle completo',
                    icon: (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <path d="M3 9h18" />
                        <path d="M9 21V9" />
                        <path d="M14 14l2 2 4-4" />
                      </svg>
                    )
                  }
                ].map((opt) => (
                  <div key={opt.id} className="relative active:scale-[0.98] transition-transform">
                    <RadioGroupItem value={opt.id} id={opt.id} className="peer sr-only" />
                    <Label
                      htmlFor={opt.id}
                      className="flex items-center gap-4 border-[1.5px] border-[#E8E8E8] rounded-[20px] p-[18px] cursor-pointer transition-all peer-data-[state=checked]:border-[#E5292F] peer-data-[state=checked]:bg-[#FCEAEA] peer-data-[state=checked]:shadow-[0_0_0_3px_rgba(229,41,47,0.12)] group hover:border-[#E5292F]/50"
                    >
                      <div className="w-[52px] h-[52px] rounded-[14px] bg-[#F4F4F4] flex items-center justify-center transition-colors peer-data-[state=checked]:bg-[#E5292F]/14 text-[#9A9A9A] peer-data-[state=checked]:text-[#E5292F]">
                        {opt.icon}
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <p className="text-[15px] font-[700] text-[#1A1A1A] peer-data-[state=checked]:text-[#A3272B] font-inter">
                          {opt.title}
                        </p>
                        <p className="text-[12px] font-[400] text-[#9A9A9A] font-inter">
                          {opt.desc}
                        </p>
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 border-[#E8E8E8] flex items-center justify-center transition-all peer-data-[state=checked]:border-[#E5292F]">
                        <div className="w-[10px] h-[10px] rounded-full bg-[#E5292F] opacity-0 scale-50 transition-all peer-data-[state=checked]:opacity-100 peer-data-[state=checked]:scale-100"></div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* CTA BUTTON */}
          <div className="pt-2 animate-fade-up" style={{ animationDelay: '0.28s' }}>
            <Button
              type="submit"
              disabled={isLoading || serialNumber.trim().length <= 3 || !machineType}
              className={`w-full h-auto py-[18px] rounded-[20px] font-inter text-[15px] font-[700] tracking-[0.3px] transition-all flex items-center justify-center gap-3 active:scale-[0.97]
                ${serialNumber.trim().length > 3 && machineType
                  ? 'bg-[#E5292F] text-white shadow-[0_6px_20px_rgba(229,41,47,0.35)] hover:bg-[#A3272B] hover:shadow-[0_8px_24px_rgba(229,41,47,0.45)]'
                  : 'bg-[#E8E8E8] text-[#9A9A9A] cursor-not-allowed shadow-none'
                }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-current" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>A iniciar…</span>
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" />
                    <path d="m9 14 2 2 4-4" />
                  </svg>
                  <span>Iniciar Inspeção</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SerialInput;
