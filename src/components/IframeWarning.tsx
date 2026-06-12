
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IframeWarningProps {
  openInNewWindow: () => void;
}

const IframeWarning: React.FC<IframeWarningProps> = ({ openInNewWindow }) => {
  return (
    <div className="mt-6">
      <Alert className="bg-yellow-50 border-yellow-200">
        <AlertTriangle className="w-4 h-4 text-yellow-500" />
        <AlertTitle className="text-yellow-800">Aplicativo em iframe</AlertTitle>
        <AlertDescription className="text-yellow-700">
          O aplicativo está rodando em um iframe, o que pode limitar alguns recursos.
          <Button 
            variant="outline" 
            className="mt-2 w-full border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            onClick={openInNewWindow}
          >
            Abrir em nova janela
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default IframeWarning;
