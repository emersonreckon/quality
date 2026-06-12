import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

/**
 * Check if running on a native platform (Android/iOS)
 */
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Save a blob file to native device storage under InspectionReports folder
 */
export const saveFileToDevice = async (
  fileName: string,
  blob: Blob,
  subfolder?: string
): Promise<{ success: boolean; path: string }> => {
  try {
    const base64 = await blobToBase64(blob);
    // Remove data URL prefix if present
    const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;

    const folderPath = subfolder || 'Inspections';
    console.log(`🔍 NATIVE FILE DEBUG: Saving to folder: ${folderPath}, file: ${fileName}`);
    console.log(`🔍 NATIVE FILE DEBUG: Full path will be: Documents/${folderPath}/${fileName}`);

    // Ensure directory exists
    try {
      await Filesystem.mkdir({
        path: folderPath,
        directory: Directory.Documents,
        recursive: true,
      });
      console.log(`🔍 NATIVE FILE DEBUG: Directory ${folderPath} prepared`);
    } catch (mkdirError) {
      // Directory may already exist
      console.log(`🔍 NATIVE FILE DEBUG: Note on mkdir:`, mkdirError);
    }

    const filePath = `${folderPath}/${fileName}`;

    const result = await Filesystem.writeFile({
      path: filePath,
      data: base64Data,
      directory: Directory.Documents,
    });

    console.log(`🔍 NATIVE FILE DEBUG: File saved successfully to: ${result.uri}`);
    return { success: true, path: result.uri };
  } catch (error) {
    console.error('🔍 NATIVE FILE DEBUG: Error saving file to device:', error);
    return { success: false, path: '' };
  }
};

/**
 * Save a ZIP blob directly to native device storage
 */
export const saveZipToDevice = async (
  fileName: string,
  blob: Blob
): Promise<{ success: boolean; path: string }> => {
  try {
    const base64 = await blobToBase64(blob);
    const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;

    console.log(`🔍 NATIVE ZIP DEBUG: Saving ZIP: ${fileName} to Documents root`);

    const result = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Documents,
    });

    console.log(`🔍 NATIVE ZIP DEBUG: ZIP saved successfully to: ${result.uri}`);
    return { success: true, path: result.uri };
  } catch (error) {
    console.error('🔍 NATIVE ZIP DEBUG: Error saving ZIP to device:', error);
    return { success: false, path: '' };
  }
};

/**
 * Convert a Blob to base64 string
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
