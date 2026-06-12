
export interface WindowWithFileSystem extends Window {
  showDirectoryPicker?: (options?: {
    id?: string;
    mode?: 'read' | 'readwrite';
    startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
  }) => Promise<FileSystemDirectoryHandle>;
}

export interface FileSystemDirectoryHandle {
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
}

export interface FileSystemFileHandle {
  createWritable(): Promise<FileSystemWritableFileStream>;
}

export interface FileSystemWritableFileStream extends WritableStream {
  write(data: any): Promise<void>;
  close(): Promise<void>;
}

export const checkIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};

export const checkFsApiSupport = (isInIframe: boolean): boolean => {
  const windowWithFS = window as WindowWithFileSystem;
  const hasDirectoryPicker = 'showDirectoryPicker' in windowWithFS;
  const supported = hasDirectoryPicker && !isInIframe;
  
  console.log("File System Access API check:", {
    hasDirectoryPicker,
    inIframe: isInIframe,
    supported
  });
  
  return supported;
};
