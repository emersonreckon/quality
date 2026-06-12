
import { toast } from "sonner";

// Declare global types for Google APIs
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

class GoogleDriveService {
  private isInitialized = false;
  private isSignedIn = false;
  private tokenClient: any = null;
  private accessToken: string | null = null;
  private API_KEY = 'AIzaSyDt8zd85x_zWqCA07M3suMsSK-rpeyLSVM';
  private CLIENT_ID = '708499149417-s9tr3isvhkjc8lo2gm3rn71m9vqelnas.apps.googleusercontent.com';
  private DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
  private SCOPES = 'https://www.googleapis.com/auth/drive.file';

  constructor() {
    console.log("GoogleDriveService: Initializing...");
    this.initializeGoogleAPI();
  }

  private async initializeGoogleAPI(): Promise<void> {
    try {
      // Wait for gapi to be loaded
      await this.waitForGapi();
      
      // Load the client library
      await new Promise<void>((resolve) => {
        window.gapi.load('client', resolve);
      });

      // Initialize the client
      await window.gapi.client.init({
        apiKey: this.API_KEY,
        discoveryDocs: [this.DISCOVERY_DOC],
      });

      // Initialize the token client
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: this.CLIENT_ID,
        scope: this.SCOPES,
        callback: (response: any) => {
          if (response.error) {
            console.error('Token client error:', response);
            toast.error('Erro na autenticação');
            return;
          }
          this.accessToken = response.access_token;
          this.isSignedIn = true;
          console.log('GoogleDriveService: Authentication successful');
        },
      });

      this.isInitialized = true;
      console.log("GoogleDriveService: Initialization complete");
    } catch (error) {
      console.error("GoogleDriveService: Initialization failed:", error);
      toast.error("Falha ao inicializar Google Drive");
    }
  }

  private waitForGapi(): Promise<void> {
    return new Promise((resolve) => {
      const checkGapi = () => {
        if (window.gapi && window.google) {
          resolve();
        } else {
          setTimeout(checkGapi, 100);
        }
      };
      checkGapi();
    });
  }

  public async waitForInitialization(): Promise<boolean> {
    let attempts = 0;
    while (!this.isInitialized && attempts < 100) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    return this.isInitialized;
  }

  public async authenticate(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.waitForInitialization();
      }

      if (this.isSignedIn) {
        return true;
      }

      // Request access token
      return new Promise((resolve) => {
        const originalCallback = this.tokenClient.callback;
        this.tokenClient.callback = (response: any) => {
          originalCallback(response);
          if (response.error) {
            toast.error("Falha na autenticação com Google Drive");
            resolve(false);
          } else {
            toast.success("Autenticado com sucesso no Google Drive!");
            resolve(true);
          }
        };
        this.tokenClient.requestAccessToken({ prompt: 'consent' });
      });
    } catch (error) {
      console.error("GoogleDriveService: Authentication failed:", error);
      toast.error("Falha na autenticação com Google Drive");
      return false;
    }
  }

  public async findFolderByName(folderName: string): Promise<string | null> {
    try {
      if (!this.isSignedIn || !this.accessToken) {
        await this.authenticate();
      }

      const response = await window.gapi.client.drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive',
      });

      const files = response.result.files;
      if (files && files.length > 0) {
        console.log(`Found folder '${folderName}' with ID: ${files[0].id}`);
        return files[0].id;
      }

      console.log(`Folder '${folderName}' not found`);
      return null;
    } catch (error) {
      console.error("Error finding folder:", error);
      toast.error("Erro ao buscar pasta no Google Drive");
      return null;
    }
  }

  public async createFolder(folderName: string): Promise<string | null> {
    try {
      if (!this.isSignedIn || !this.accessToken) {
        const authenticated = await this.authenticate();
        if (!authenticated) return null;
      }

      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      };

      const response = await window.gapi.client.drive.files.create({
        resource: fileMetadata,
        fields: 'id',
      });

      const folderId = response.result.id;
      console.log(`Created folder '${folderName}' with ID: ${folderId}`);
      toast.success(`Pasta '${folderName}' criada no Google Drive!`);
      
      return folderId;
    } catch (error) {
      console.error("Error creating folder:", error);
      toast.error("Erro ao criar pasta no Google Drive");
      return null;
    }
  }

  public async uploadFile(
    fileContent: string, 
    fileName: string, 
    folderId: string, 
    mimeType = 'application/pdf'
  ): Promise<string | null> {
    try {
      if (!this.isSignedIn || !this.accessToken) {
        const authenticated = await this.authenticate();
        if (!authenticated) return null;
      }

      // Convert base64 or data URL to blob
      let blob: Blob;
      if (fileContent.startsWith('data:')) {
        // Data URL
        const base64Data = fileContent.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: mimeType });
      } else {
        // Assume it's already binary data or text
        blob = new Blob([fileContent], { type: mimeType });
      }

      const metadata = {
        name: fileName,
        mimeType: mimeType,
        parents: [folderId],
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', blob);

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: form,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      const fileId = result.id;
      
      console.log(`Uploaded file '${fileName}' with ID: ${fileId}`);
      toast.success(`Arquivo '${fileName}' enviado para o Google Drive!`);
      return fileId;
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(`Erro ao enviar arquivo '${fileName}' para o Google Drive`);
      return null;
    }
  }

  public async getFileLink(fileId: string): Promise<string | null> {
    try {
      return `https://drive.google.com/file/d/${fileId}/view`;
    } catch (error) {
      console.error("Error getting file link:", error);
      return null;
    }
  }

  public isReady(): boolean {
    return this.isInitialized && this.isSignedIn;
  }

  public resetAuth(): void {
    this.isSignedIn = false;
    this.accessToken = null;
    console.log("GoogleDriveService: Authentication reset");
  }
}

// Create a singleton instance
const googleDriveService = new GoogleDriveService();
export default googleDriveService;
