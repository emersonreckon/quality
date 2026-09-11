import { InspectionItem } from '@/types/inspection';
import { readDraftFile } from '@/utils/nativeFileUtils';

export interface DraftJSON {
  version: 1;
  savedAt: string;
  cabinetType: 'cabinet' | 'cabinet-with-cm';
  machineType: 'rework' | 'nls';
  formData: {
    technicianName: string;
    date: string;
    cabinetSN: string;
    controlModuleSN: string;
    configurationType: string;
    assistantTechnician: string;
  };
  cabinetItems: InspectionItem[];
  shelfItems: InspectionItem[];
  controlModuleItems: InspectionItem[];
  generalItems: InspectionItem[];
  packagingItems: InspectionItem[];
  additionalNotes: string;
  qualityConfirmed: boolean;
  photoKeys: string[];
  videoKeys: string[];
}

export interface LoadedDraft {
  json: DraftJSON;
  photoMap: Map<string, string>;
  videoMap: Map<string, string>;
  reportPdfBlob: Blob | null;
}

// UTF-8 safe JSON → base64
export const jsonToBase64 = (data: unknown): string => {
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  let binary = '';
  bytes.forEach(b => (binary += String.fromCharCode(b)));
  return btoa(binary);
};

// base64 → UTF-8 safe JSON
const base64ToJson = <T>(base64: string): T => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
};

const base64ToPdfBlob = (base64: string): Blob => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: 'application/pdf' });
};

// Packaging items that belong to Fase 2 — never restored from draft
const FASE2_RECORDS = new Set(['PK_F1', 'PK_F2']);

export const loadFullDraft = async (serialNumber: string): Promise<LoadedDraft | null> => {
  try {
    const jsonBase64 = await readDraftFile(serialNumber, 'formulario.json');
    if (!jsonBase64) return null;

    const draftJson = base64ToJson<DraftJSON>(jsonBase64);

    // Photos — skip Fase 2 items
    const photoMap = new Map<string, string>();
    for (const key of draftJson.photoKeys) {
      if (FASE2_RECORDS.has(key)) continue;
      const base64 = await readDraftFile(serialNumber, `${key}.jpg`);
      if (base64) photoMap.set(key, `data:image/jpeg;base64,${base64}`);
    }

    // Videos — skip Fase 2 items
    const videoMap = new Map<string, string>();
    for (const key of draftJson.videoKeys) {
      if (FASE2_RECORDS.has(key)) continue;
      const base64 = await readDraftFile(serialNumber, `${key}.mp4`);
      if (base64) videoMap.set(key, `data:video/mp4;base64,${base64}`);
    }

    // Machine Report PDF
    let reportPdfBlob: Blob | null = null;
    const pdfBase64 = await readDraftFile(serialNumber, 'machineReport.pdf');
    if (pdfBase64) reportPdfBlob = base64ToPdfBlob(pdfBase64);

    return { json: draftJson, photoMap, videoMap, reportPdfBlob };
  } catch (error) {
    console.error('[DRAFT] Erro ao carregar rascunho:', error);
    return null;
  }
};
