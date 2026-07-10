import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

type StorageLocation = 'ExternalStorage' | 'Documents' | 'External' | 'Data';

const STORAGE_ATTEMPTS: Array<{ directory: Directory; location: StorageLocation }> = [
  { directory: Directory.ExternalStorage, location: 'ExternalStorage' },
  { directory: Directory.Documents,       location: 'Documents'       },
  { directory: Directory.External,        location: 'External'        },
  { directory: Directory.Data,            location: 'Data'            },
];

const STORAGE_MESSAGES: Record<StorageLocation, string> = {
  ExternalStorage: 'Ficheiro gravado no cartão SD',
  Documents:       'Ficheiro gravado na pasta Documentos do dispositivo',
  External:        'Ficheiro gravado no armazenamento externo do dispositivo',
  Data:            'Ficheiro gravado no armazenamento interno do dispositivo',
};

const ERROR_MESSAGE =
  'Não foi possível gravar o ficheiro. Verifique as permissões de armazenamento nas definições do dispositivo.';

type WriteResult = {
  success: boolean;
  path: string;
  message: string;
};

/**
 * Tenta gravar filePath com base64Data usando ExternalStorage → ExternalFiles → Documents.
 * Quando mkdirPath é fornecido, cria a pasta antes de gravar.
 */
const writeFileWithFallback = async (
  filePath: string,
  base64Data: string,
  mkdirPath?: string
): Promise<WriteResult> => {
  for (const { directory, location } of STORAGE_ATTEMPTS) {
    try {
      if (mkdirPath) {
        try {
          await Filesystem.mkdir({ path: mkdirPath, directory, recursive: true });
        } catch (_) {
          // a pasta pode já existir — ignorar
        }
      }

      const result = await Filesystem.writeFile({ path: filePath, data: base64Data, directory });
      console.log(`[STORAGE] Gravado em ${location}: ${result.uri}`);
      return { success: true, path: result.uri, message: STORAGE_MESSAGES[location] };
    } catch (error) {
      console.warn(`[STORAGE] Tentativa ${location} falhou:`, error);
    }
  }

  return { success: false, path: '', message: ERROR_MESSAGE };
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Grava um blob numa subpasta usando fallback automático de armazenamento.
 */
export const saveFileToDevice = async (
  fileName: string,
  blob: Blob,
  subfolder?: string
): Promise<WriteResult> => {
  try {
    const base64 = await blobToBase64(blob);
    const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
    const folderPath = subfolder || 'Inspections';
    const filePath = `${folderPath}/${fileName}`;

    return await writeFileWithFallback(filePath, base64Data, folderPath);
  } catch (error) {
    console.error('[STORAGE] Erro em saveFileToDevice:', error);
    return { success: false, path: '', message: ERROR_MESSAGE };
  }
};

/**
 * Grava um ZIP na raiz usando fallback automático de armazenamento.
 */
export const saveZipToDevice = async (
  fileName: string,
  blob: Blob
): Promise<WriteResult> => {
  try {
    const base64 = await blobToBase64(blob);
    const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;

    return await writeFileWithFallback(fileName, base64Data);
  } catch (error) {
    console.error('[STORAGE] Erro em saveZipToDevice:', error);
    return { success: false, path: '', message: ERROR_MESSAGE };
  }
};

// --- GESTÃO DE RASCUNHOS ---

const DRAFT_DIRS: Directory[] = [
  Directory.ExternalStorage,
  Directory.Documents,
  Directory.External,
  Directory.Data,
];

const sanitizeForPath = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, '_');
const draftFolderPath = (serialNumber: string) => `rascunho_SN_${sanitizeForPath(serialNumber)}`;

// Procura em qual directório o rascunho foi gravado
const findDraftDirectory = async (serialNumber: string): Promise<Directory | null> => {
  for (const dir of DRAFT_DIRS) {
    try {
      await Filesystem.stat({
        path: `${draftFolderPath(serialNumber)}/formulario.json`,
        directory: dir,
      });
      return dir;
    } catch {
      // não está aqui
    }
  }
  return null;
};

export const checkDraftExists = async (serialNumber: string): Promise<boolean> => {
  return (await findDraftDirectory(serialNumber)) !== null;
};

export const listAllDrafts = async (): Promise<string[]> => {
  if (!Capacitor.isNativePlatform()) return [];
  const seen = new Set<string>();
  const results: string[] = [];
  for (const dir of DRAFT_DIRS) {
    try {
      const { files } = await Filesystem.readdir({ path: '', directory: dir });
      for (const file of files) {
        if (file.name.startsWith('rascunho_SN_') && !seen.has(file.name)) {
          seen.add(file.name);
          results.push(file.name.replace('rascunho_SN_', ''));
        }
      }
    } catch {
      // directório não acessível — continuar
    }
  }
  return results;
};

// Grava um ficheiro binário (base64 puro) na pasta do rascunho
export const saveDraftRawFile = async (
  serialNumber: string,
  fileName: string,
  base64Data: string
): Promise<boolean> => {
  const folder = draftFolderPath(serialNumber);
  const result = await writeFileWithFallback(`${folder}/${fileName}`, base64Data, folder);
  return result.success;
};

// Lê um ficheiro da pasta do rascunho — devolve base64 puro ou null
export const readDraftFile = async (
  serialNumber: string,
  fileName: string
): Promise<string | null> => {
  const dir = await findDraftDirectory(serialNumber);
  if (!dir) return null;
  try {
    const result = await Filesystem.readFile({
      path: `${draftFolderPath(serialNumber)}/${fileName}`,
      directory: dir,
    });
    return result.data as string;
  } catch {
    return null;
  }
};

// Apaga toda a pasta do rascunho
export const deleteDraftFolder = async (serialNumber: string): Promise<boolean> => {
  const dir = await findDraftDirectory(serialNumber);
  if (!dir) return false;
  try {
    await Filesystem.rmdir({
      path: draftFolderPath(serialNumber),
      directory: dir,
      recursive: true,
    });
    console.log(`[DRAFT] Pasta ${draftFolderPath(serialNumber)} apagada`);
    return true;
  } catch (error) {
    console.error('[DRAFT] Erro ao apagar rascunho:', error);
    return false;
  }
};
