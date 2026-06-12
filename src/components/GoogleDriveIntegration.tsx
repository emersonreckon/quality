
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import googleDriveService from './GoogleDriveService';

interface GoogleDriveIntegrationProps {
  onFolderReady: (folderId: string) => void;
  serialNumber: string;
}

const GoogleDriveIntegration: React.FC<GoogleDriveIntegrationProps> = ({ 
  onFolderReady, 
  serialNumber 
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [folderId, setFolderId] = useState<string>("");

  const folderName = `SR_${serialNumber}`;

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    const ready = googleDriveService.isReady();
    setIsConnected(ready);
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      console.log("Iniciando conexão com Google Drive...");
      
      // Wait for initialization
      const initialized = await googleDriveService.waitForInitialization();
      if (!initialized) {
        toast.error("Erro ao inicializar Google Drive API");
        return;
      }

      console.log("GoogleDriveService inicializado, tentando autenticar...");

      // Authenticate
      const authenticated = await googleDriveService.authenticate();
      if (!authenticated) {
        toast.error("Falha na autenticação");
        return;
      }

      console.log("Autenticado com sucesso, criando/encontrando pasta...");

      // Find or create folder
      let currentFolderId = await googleDriveService.findFolderByName(folderName);
      
      if (!currentFolderId) {
        console.log("Pasta não encontrada, criando nova...");
        currentFolderId = await googleDriveService.createFolder(folderName);
      } else {
        console.log("Pasta encontrada:", currentFolderId);
        toast.info(`Pasta '${folderName}' já existe no Google Drive`);
      }

      if (currentFolderId) {
        setFolderId(currentFolderId);
        setIsConnected(true);
        onFolderReady(currentFolderId);
        toast.success(`Conectado! Pasta '${folderName}' pronta para uso.`);
        console.log("Conectado com sucesso, folder ID:", currentFolderId);
      } else {
        toast.error("Erro ao criar/encontrar pasta no Google Drive");
      }
    } catch (error) {
      console.error("Connection error:", error);
      toast.error("Erro ao conectar com Google Drive");
    } finally {
      setIsConnecting(false);
    }
  };

  if (isConnected && folderId) {
    return (
      <Alert className="mb-4">
        <AlertDescription>
          ✅ Conectado ao Google Drive! Pasta '{folderName}' pronta para receber os arquivos.
          <br />
          <small className="text-muted-foreground">ID da pasta: {folderId}</small>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mb-6 p-4 border rounded-lg">
      <h3 className="text-lg font-medium mb-2">Conectar ao Google Drive</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Para salvar os arquivos diretamente no Google Drive, clique no botão abaixo para autenticar e criar/encontrar a pasta '{folderName}'.
      </p>
      
      <Alert className="mb-4">
        <AlertDescription>
          <strong>Importante:</strong> Para usar o Google Drive real, você precisa:
          <ul className="list-disc ml-4 mt-2">
            <li>Criar um projeto no Google Cloud Console</li>
            <li>Ativar a Google Drive API</li>
            <li>Criar credenciais (API Key e Client ID)</li>
            <li>Configurar as credenciais no GoogleDriveService.ts</li>
          </ul>
          <p className="mt-2 text-sm">
            Atualmente o sistema está em modo de simulação para demonstração.
          </p>
        </AlertDescription>
      </Alert>

      <Button 
        onClick={handleConnect}
        disabled={isConnecting}
        className="w-full"
      >
        {isConnecting ? 'Conectando...' : 'Conectar ao Google Drive'}
      </Button>
    </div>
  );
};

export default GoogleDriveIntegration;
