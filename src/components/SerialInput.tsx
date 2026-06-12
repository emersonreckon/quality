
import React, { useState } from 'react';
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PackageIcon, BoxIcon } from "lucide-react";

interface SerialInputProps {
  onSerialSubmit: (serial: string, cabinetType: 'cabinet' | 'cabinet-with-cm') => void;
  isLoading: boolean;
}

const SerialInput: React.FC<SerialInputProps> = ({ onSerialSubmit, isLoading }) => {
  const [serialNumber, setSerialNumber] = useState<string>('');
  const [cabinetType, setCabinetType] = useState<'cabinet' | 'cabinet-with-cm'>('cabinet-with-cm');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!serialNumber.trim()) {
      toast.error("Por favor, insira o número de série");
      return;
    }

    console.log("SerialInput: Submitting with serial:", serialNumber, "type:", cabinetType);
    onSerialSubmit(serialNumber.trim(), cabinetType);

    toast.success("Iniciando inspeção", {
      description: `Tipo: ${cabinetType === 'cabinet' ? 'Cabinet' : 'Cabinet with CM'}`
    });
  };

  return (
    <div className="w-full max-w-[480px] mx-auto overflow-hidden bg-white shadow-xl rounded-[32px] sm:rounded-[40px] flex flex-col relative">
      <form onSubmit={handleSubmit} className="flex flex-col">

        {/* HERO SECTION */}
        <div className="w-full bg-[#E5292F] pt-[28px] px-[24px] pb-[32px] relative overflow-hidden animate-fade-up" style={{ animationDelay: '0s' }}>
          {/* Decorative Circles */}
          <div className="absolute top-[-20px] right-[-20px] w-[120px] h-[120px] rounded-full bg-white opacity-[0.07]"></div>
          <div className="absolute bottom-[-40px] right-[-10px] w-[160px] h-[160px] rounded-full bg-white opacity-[0.05]"></div>

          {/* Watermark */}
          <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 opacity-[0.12] pointer-events-none">
            <svg width="140" height="140" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19V9H13V10.5C13.8 9.5 15 9 16.5 9V11C15 11 13.5 12 13 13.5V19H11Z" fill="white" />
              <circle cx="9" cy="9" r="1.5" fill="white" />
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

        <div className="px-6 py-8 space-y-8 flex flex-col">
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
                placeholder="Ex: SR_1234567890"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                autoComplete="off"
                className="h-[52px] w-full border-[1.5px] border-[#E8E8E8] rounded-[14px] pl-12 pr-4 text-[15px] font-[500] focus-visible:border-[#E5292F] focus-visible:ring-[#E5292F]/10 focus-visible:ring-offset-0 transition-all font-inter"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* CABINET TYPE SECTION */}
          <div className="space-y-4 animate-fade-up" style={{ animationDelay: '0.14s' }}>
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

          {/* INFO STRIP */}
          <div className="bg-[#F4F4F4] rounded-[14px] p-[14px] flex items-start gap-3 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <div className="w-2 h-2 rounded-full bg-[#E5292F] mt-1 shrink-0"></div>
            <p className="text-[12px] font-[400] text-[#9A9A9A] leading-[1.5] font-inter">
              <span className="font-[600] text-[#1A1A1A]">{cabinetType === 'cabinet' ? 'Cabinet' : 'Cabinet with CM'}</span> selecionado — {cabinetType === 'cabinet' ? 'será verificada apenas a estrutura sem módulos.' : 'o módulo de controlo será verificado durante a inspeção.'}
            </p>
          </div>

          {/* CTA BUTTON */}
          <div className="pt-2 animate-fade-up" style={{ animationDelay: '0.28s' }}>
            <Button
              type="submit"
              disabled={isLoading || serialNumber.trim().length <= 3}
              className={`w-full h-auto py-[18px] rounded-[20px] font-inter text-[15px] font-[700] tracking-[0.3px] transition-all flex items-center justify-center gap-3 active:scale-[0.97]
                ${serialNumber.trim().length > 3
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
