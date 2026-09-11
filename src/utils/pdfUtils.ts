
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { InspectionItem } from "@/types/inspection";
import JSZip from 'jszip';
import { isNativePlatform, saveZipToDevice } from '@/utils/nativeFileUtils';

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    } | undefined;
  }
}

type FormData = {
  technicianName: string;
  date: string;
  cabinetSN: string;
  controlModuleSN: string;
  configurationType: string;
  assistantTechnician: string;
};

// --- HELPERS ---

/**
 * Converte dataURL para Blob de forma segura
 */
const dataURLtoBlob = (dataURL: string): Blob => {
  const parts = dataURL.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const binaryString = atob(parts[1]);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
};

/**
 * Trigger de download no navegador usando link temporário (mais estável que FileSaver)
 */
const triggerBrowserDownload = (blob: Blob, fileName: string) => {
  console.log(`[ZIP SERVICE] Disparando download via browser: ${fileName}`);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

// --- MAIN SERVICE ---

export const generateInspectionPDF = async (
  formData: FormData,
  generalItems: InspectionItem[],
  shelfItems: InspectionItem[],
  cabinetItems: InspectionItem[],
  controlModuleItems: InspectionItem[],
  packagingItems: InspectionItem[],
  photoMap: Map<string, string>,
  videoMap: Map<string, string> = new Map(),
  reportPdfBlob: Blob | null = null,
  returnBlob: boolean = false,
  cabinetType: 'cabinet' | 'cabinet-with-cm' = 'cabinet-with-cm',
  additionalNotes: string = '',
  machineType: 'rework' | 'nls' = 'rework'
): Promise<{ success: boolean, message: string, pdfBlob?: string }> => {

  console.log("[ZIP SERVICE] Iniciando processo completo de geração");

  try {
    const zip = new JSZip();
    // Senior Fix: Remove the sub-folder creation to prevent duplicate folders on extraction
    // Files will be added directly to the zip root
    const zipTarget = zip;

    // 1. GERAR PDF PRINCIPAL (FORMULÁRIO)
    console.log("[ZIP SERVICE] Gerando PDF do formulário principal...");
    const doc = new jsPDF();

    // Polyfill autoTable
    if (typeof doc.autoTable !== 'function') {
      (doc as any).autoTable = function (options: any) {
        autoTable(this, options);
        return this;
      };
    }

    doc.setFontSize(16);
    doc.text("Validação de montagem de Armários e Módulos", 14, 20);

    doc.setFontSize(10);
    doc.text(`Técnico Resp.: ${formData.technicianName}`, 14, 30);
    doc.text(`Data: ${formData.date}`, 14, 35);
    doc.text(`Tipo de Máquina: ${machineType === 'nls' ? 'NLS' : 'Rework'}`, 14, 40);
    doc.text(`Armário S/N: ${formData.cabinetSN}`, 14, 45);

    let yPos = 50;
    if (cabinetType === 'cabinet-with-cm') {
      doc.text(`Control Module S/N: ${formData.controlModuleSN}`, 14, yPos);
      yPos += 5;
    }
    doc.text(`Tipo de configuração: ${formData.configurationType}`, 14, yPos);
    yPos += 5;
    doc.text(`Técnico Aux.: ${formData.assistantTechnician}`, 14, yPos);

    const addSection = (title: string, items: InspectionItem[], startY: number) => {
      doc.setFontSize(12);
      doc.text(title, 14, startY);
      const rows = items.map(it => [it.label, it.defaultRecord || "", it.checked ? "OK" : "—"]);
      doc.autoTable({
        startY: startY + 5,
        head: [['Item', 'Registo', 'Verificado']],
        body: rows,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0] },
        columnStyles: { 2: { halign: 'center' } }
      });
      return (doc.lastAutoTable?.finalY || (startY + 20)) + 10;
    };

    let nextY = 65;
    nextY = addSection("1. Armário", cabinetItems, nextY);
    if (nextY > 250) { doc.addPage(); nextY = 20; }

    nextY = addSection("2. Prateleira", shelfItems, nextY);
    if (nextY > 250) { doc.addPage(); nextY = 20; }

    if (cabinetType === 'cabinet-with-cm') {
      nextY = addSection("3. Control Module", controlModuleItems, nextY);
      if (nextY > 250) { doc.addPage(); nextY = 20; }
    }

    nextY = addSection("4. Geral", generalItems, nextY);
    if (nextY > 250) { doc.addPage(); nextY = 20; }

    nextY = addSection("5. Packaging", packagingItems, nextY);

    if (additionalNotes.trim()) {
      const notesY = (doc.lastAutoTable?.finalY || nextY) + 10;
      if (notesY > 260) doc.addPage();
      doc.setFontSize(12);
      doc.text("Notas Adicionais", 14, notesY > 260 ? 20 : notesY);
      doc.setFontSize(9);
      doc.text(doc.splitTextToSize(additionalNotes, 180), 14, notesY > 260 ? 28 : notesY + 8);
    }

    const mainPdfBlob = doc.output('blob');
    const mainPdfName = `Report_${formData.cabinetSN}.pdf`;

    if (returnBlob) {
      // Usado apenas para integração com Drive se necessário
      const reader = new FileReader();
      const pdfDataUrl = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(mainPdfBlob);
      });
      return { success: true, message: "PDF gerado", pdfBlob: pdfDataUrl };
    }

    // Adiciona o PDF principal ao ZIP
    zipTarget.file(mainPdfName, mainPdfBlob);
    console.log(`[ZIP SERVICE] PDF Principal adicionado ao ZIP: ${mainPdfName}`);

    // 2. ADICIONAR FOTOS COMO JPG
    console.log(`[ZIP SERVICE] Processando ${photoMap.size} fotos...`);
    for (const [code, data] of photoMap.entries()) {
      if (!data || code.toUpperCase().endsWith('_V1')) continue;

      try {
        const blob = dataURLtoBlob(data);
        zipTarget.file(`${code}.jpg`, blob);
        console.log(`[ZIP SERVICE] Foto adicionada: ${code}.jpg`);
      } catch (err) {
        console.error(`[ZIP SERVICE] Erro ao processar foto ${code}:`, err);
      }
    }

    // 3. ADICIONAR VÍDEOS
    console.log(`[ZIP SERVICE] Processando ${videoMap.size} vídeos...`);
    for (const [code, data] of videoMap.entries()) {
      if (!data) continue;
      try {
        const videoBlob = dataURLtoBlob(data);
        zipTarget.file(`${code}.mp4`, videoBlob);
        console.log(`[ZIP SERVICE] Vídeo adicionado: ${code}.mp4`);
      } catch (err) {
        console.error(`[ZIP SERVICE] Erro ao processar vídeo ${code}:`, err);
      }
    }

    // 3.5 ADICIONAR O MACHINE REPORT PDF (SE EXISTIR)
    if (reportPdfBlob) {
      const folderName = formData.cabinetSN || 'Inspeção';
      const currentDate = new Date();
      const fileDateStr = currentDate.getFullYear() +
        String(currentDate.getMonth() + 1).padStart(2, '0') +
        String(currentDate.getDate()).padStart(2, '0') + '_' +
        String(currentDate.getHours()).padStart(2, '0') +
        String(currentDate.getMinutes()).padStart(2, '0') +
        String(currentDate.getSeconds()).padStart(2, '0');
        
      zipTarget.file(`machineReport_${folderName}_${fileDateStr}.pdf`, reportPdfBlob);
      console.log(`[ZIP SERVICE] Machine Report adicionado ao ZIP`);
    }

    // 4. GERAR O ARQUIVO ZIP FINAL
    console.log("[ZIP SERVICE] Comprimindo arquivos e gerando ZIP final...");
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    const folderName = formData.cabinetSN || 'Inspeção';
    const zipName = `${folderName}.zip`;

    // 5. DISPARAR DOWNLOAD OU SALVAMENTO NATIVO
    if (isNativePlatform()) {
      console.log("[ZIP SERVICE] Plataforma Nativa detectada (APK). Usando Filesystem API.");
      const result = await saveZipToDevice(zipName, zipBlob);

      if (result.success) {
        return {
          success: true,
          message: `Sucesso! ${result.message}: ${zipName}`
        };
      } else {
        throw new Error(result.message);
      }
    } else {
      console.log("[ZIP SERVICE] Plataforma Browser detectada. Disparando download automático.");
      triggerBrowserDownload(zipBlob, zipName);
      return {
        success: true,
        message: `Download iniciado: O arquivo ${zipName} está sendo baixado.`
      };
    }

  } catch (error: any) {
    console.error("[ZIP SERVICE] ERRO CRÍTICO:", error);
    return {
      success: false,
      message: `Erro ao gerar ZIP: ${error.message || "Tente novamente."}`
    };
  }
};
