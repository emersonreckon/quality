import React, { useState, useEffect } from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Camera from "@/components/Camera";
import { CameraIcon, VideoIcon, Eye, X } from "lucide-react";
import { ReferenceImageButton } from "@/components/ReferenceImageModal";
import { generateInspectionPDF, isFileSystemAccessSupported } from "@/utils/pdfUtils";
import { generateMachineReportPDF } from "@/utils/machineInspectionReportPdf";
import { InspectionItem } from "@/types/inspection";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";

interface InspectionFormProps {
  serialNumber: string;
  cabinetType: 'cabinet' | 'cabinet-with-cm';
  onReset: () => void;
}

interface FormData {
  technicianName: string;
  date: string;
  cabinetSN: string;
  controlModuleSN: string;
  configurationType: string;
  assistantTechnician: string;
}

const InspectionForm: React.FC<InspectionFormProps> = ({ serialNumber, cabinetType, onReset }) => {
  const { toast: uiToast } = useToast();
  const isMobile = useIsMobile();
  const currentDate = new Date().toLocaleDateString('pt-BR');
  
  console.log("InspectionForm: Component loaded with serial:", serialNumber, "type:", cabinetType);
  
  const [formData, setFormData] = useState<FormData>({
    technicianName: "",
    date: currentDate,
    cabinetSN: serialNumber,
    controlModuleSN: "S/N",
    configurationType: "Standard - 4 prateleiras",
    assistantTechnician: ""
  });

  const [showCamera, setShowCamera] = useState(false);
  const [currentCameraId, setCurrentCameraId] = useState<string>("");
  const [currentSection, setCurrentSection] = useState<string>("");
  const [isVideoMode, setIsVideoMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingMachineReport, setIsGeneratingMachineReport] = useState(false);
  const [reportPdfBlob, setReportPdfBlob] = useState<Blob | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [previewMedia, setPreviewMedia] = useState<{ data: string; isVideo: boolean; id: string } | null>(null);
  const [qualityConfirmed, setQualityConfirmed] = useState(false);
  const [machineReportProgress, setMachineReportProgress] = useState(0);
  const progressIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const [photoData, setPhotoData] = useState<Map<string, string>>(new Map());
  const [videoData, setVideoData] = useState<Map<string, string>>(new Map());


  useEffect(() => {
    console.log("InspectionForm mounted");
  }, []);

  // 1. Armário
  const [cabinetItems, setCabinetItems] = useState<InspectionItem[]>([
    { id: "1.1", label: "1.1. Marcar o aperto dos parafusos do trinco inferior (lógica de selagem)", defaultRecord: "", defaultResult: "Ok", comment: "", photoTaken: false },
    { id: "1.2", label: "1.2. Verificar a correcta aplicação do sistema do trinco inferior, com foto lateral e frontal do mesmo", defaultRecord: "TI_F1,TI_F2", defaultResult: "Ok", comment: "", photoTaken: false },
    { id: "1.3", label: "1.3. Verificação da passagem de cabos no interior e exterior, tal como a sua ancoragem. Confirmar que não existe entalamento de cabos, nomeadamente junto da chapa de topo no interior. (Usar camera endoscopica)", defaultRecord: "AO_F1", defaultResult: "Ok", comment: "", photoTaken: false },
    { id: "1.4", label: "1.4. Verificar funcionamento de trinco inferior", defaultRecord: "AO_V1", defaultResult: "Ok", comment: "", photoTaken: false },
    { id: "1.5", label: "1.5. Verificar funcionamento de trinco superior", defaultRecord: "AO_V2", defaultResult: "Ok", comment: "", photoTaken: false },
    { id: "1.6", label: "1.6. Verificar a abertura/fecho de porta", defaultRecord: "AO_V3", defaultResult: "Ok", comment: "", photoTaken: false },
    { id: "1.7", label: "1.7. Verificar a abertura manual do trinco inferior", defaultRecord: "AO_V1", defaultResult: "Ok", comment: "", photoTaken: false },
    { id: "1.8", label: "1.8. Verificar e validar o espaçamento entre as prateleiras e o fundo do armário", defaultRecord: "", defaultResult: "Ok", comment: "", photoTaken: false },
    { id: "1.9", label: "1.9. Verifica a aplicação das etiquetas de SN", defaultRecord: "AO_F2", defaultResult: "Ok", comment: "", photoTaken: false },
    { id: "1.10", label: "1.10. Verificar que está aplicada a chapa de espaçamento ao módulo, do lado do puxador (aplicável apenas nos armários sem módulo)", defaultRecord: "AO_F3", defaultResult: "Ok", comment: "", photoTaken: false },
    { id: "1.11", label: "1.11. Abrir a porta ao máximo largar e verificar que a porta fecha e que os sensores estão no estado correto.", defaultRecord: "", defaultResult: "Ok", comment: "", photoTaken: false },
  ]);

  // 2. Prateleira
  const [shelfItems, setShelfItems] = useState<InspectionItem[]>([
    { id: "2.1", label: "2.1. Verificar a correta amarração dos cabos", defaultRecord: "", defaultResult: "Ok", comment: "", photoTaken: false },
    { id: "2.2", label: "2.2. Verificar a posição do sensor de temperatura", defaultRecord: "PA_F1", defaultResult: "Ok", comment: "", photoTaken: false },
    { id: "2.3", label: "2.3. Validar funcionamento de LEDs", defaultRecord: "PA_F3", defaultResult: "Ok", comment: "", photoTaken: false },
    { id: "2.4", label: "2.4. Garantir que estão aplicadas as abraçadeiras de fixação da prateleira ao rail lateral", defaultRecord: "PA_F3", defaultResult: "Ok", comment: "", photoTaken: false },
    { id: "2.5", label: "2.5. Confirmar que a tampa superior não tem empenos", defaultRecord: "", defaultResult: "Ok", comment: "", photoTaken: false },
    { id: "2.6", label: "2.6. Verificar a aplicação das etiquetas de SN", defaultRecord: "", defaultResult: "Ok", comment: "", photoTaken: false },
  ]);

  // 3. Control Module
  const [controlModuleItems, setControlModuleItems] = useState<InspectionItem[]>([
    { id: "3.1", label: "3.1. Verificar o correto suporte do módulo na parte inferior e a aplicação das chapas de aperto superior", defaultRecord: "", defaultResult: "N/A", comment: "", photoTaken: false },
    { id: "3.2", label: "3.2. Verificação geral da montagem dos componentes (mecânicos e electricos/electrónicos)", defaultRecord: "CM_F1_1", defaultResult: "N/A", comment: "", photoTaken: false },
    { id: "3.3", label: "3.3. Verificar a boa conexão de todos os conectores da MB", defaultRecord: "CM_F1_1", defaultResult: "N/A", comment: "", photoTaken: false },
    { id: "3.4", label: "3.4. Verificar a conexão entre placa MB e EL", defaultRecord: "CM_F1_1", defaultResult: "N/A", comment: "", photoTaken: false },
    { id: "3.5", label: "3.5. Verificar a aplicação das etiquetas de SN", defaultRecord: "CM_F1_1", defaultResult: "N/A", comment: "", photoTaken: false },
    { id: "3.6", label: "3.6. Verificar a boa conexão de todos cabos ethernet ligados aos switchs", defaultRecord: "CM_F1_2", defaultResult: "N/A", comment: "", photoTaken: false },
    { id: "3.7", label: "3.7. Verificar a boa fixação das fontes PSU", defaultRecord: "", defaultResult: "N/A", comment: "", photoTaken: false },
    { id: "3.8", label: "3.8. Verificação da passagem de cabos e a sua amarração na parte móvel", defaultRecord: "CM_F2_1", defaultResult: "N/A", comment: "", photoTaken: false },
    { id: "3.9", label: "3.9. Verificação da amarração dos cabos das prateleiras no interior do módulo", defaultRecord: "CM_F2_2", defaultResult: "N/A", comment: "", photoTaken: false },
    { id: "3.10", label: "3.10. Verificar a alimentação de todos os switchs de rede", defaultRecord: "CM_F1_2", defaultResult: "N/A", comment: "", photoTaken: false },
    { id: "3.11", label: "3.11. Verificação da uniformidade das folgas da gaveta", defaultRecord: "CM_F3", defaultResult: "N/A", comment: "", photoTaken: false },
    { id: "3.12", label: "3.12. Verificar o funcionamento do trinco da gaveta e a presença de chave", defaultRecord: "CM_F3", defaultResult: "N/A", comment: "", photoTaken: false },
    { id: "3.13", label: "3.13. Verificação da ligação elétrica nas tomadas do módulo", defaultRecord: "CM_F4", defaultResult: "N/A", comment: "", photoTaken: false },
    { id: "3.14", label: "3.14. Verificar funcionamento do router instalado", defaultRecord: "CM_F5", defaultResult: "N/A", comment: "", photoTaken: false },
    { id: "3.15", label: "3.15. Verificar a aplicação da chapa e do terminal de pagamento (questionar se aplicável)", defaultRecord: "", defaultResult: "N/A", comment: "", photoTaken: false },
    { id: "3.16", label: "3.16. Verificar a saída de cabo de alimentação geral pela parte inferior do módulo e garantir o correto posicionamento, para não ficar esmagado na palete", defaultRecord: "CM_F6", defaultResult: "N/A", comment: "", photoTaken: false },
  ]);

  // 4. Geral
  const [generalItems, setGeneralItems] = useState<InspectionItem[]>([
    { id: "4.1", label: "4.1. Inspeção geral das estruturas do módulo, prateleiras e armário", defaultRecord: "GL_F1", defaultResult: "Ok", comment: "", photoTaken: false },
    { id: "4.2", label: "4.2. Verificação geral de pintura", defaultRecord: "GL_F2", defaultResult: "Ok", comment: "", photoTaken: false },
    { id: "4.3", label: "4.3. Verificar presença da chave do CM junto dos documentos da máquina", defaultRecord: "GL_F3", defaultResult: "Ok", comment: "", photoTaken: false },
    { id: "4.4", label: "4.4. Verificação da presença do calço entre a porta e a grelha inferior.", defaultRecord: "GL_F4", defaultResult: "Ok", comment: "", photoTaken: false },
    { id: "4.5", label: "4.5. Conectar cabo do armário numa das tomadas do módulo e verificar o funcionamento (frio e ventilação)", defaultRecord: "", defaultResult: "Ok", comment: "", photoTaken: false },
  ]);

  // 5. Packaging
  const [packagingItems, setPackagingItems] = useState<InspectionItem[]>([
    { id: "5.1", label: "5.1. Verificar a ancoragem dos cabos e a aplicação das placas de esferovite", defaultRecord: "PK_F1", defaultResult: "N/A", comment: "", photoTaken: false },
    { id: "5.2", label: "5.2. Verificar o embalamento final", defaultRecord: "PK_F2", defaultResult: "N/A", comment: "", photoTaken: false },
  ]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRecordChange = (sectionSetter: React.Dispatch<React.SetStateAction<InspectionItem[]>>, itemId: string, value: string) => {
    sectionSetter(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, defaultRecord: value } : item
      )
    );
  };

  const handleResultChange = (sectionSetter: React.Dispatch<React.SetStateAction<InspectionItem[]>>, itemId: string, value: string) => {
    sectionSetter(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, defaultResult: value } : item
      )
    );
  };

  const handleCommentChange = (sectionSetter: React.Dispatch<React.SetStateAction<InspectionItem[]>>, itemId: string, value: string) => {
    sectionSetter(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, comment: value } : item
      )
    );
  };

  const isVideoRecord = (recordCode: string): boolean => {
    return /_(V\d*)$/i.test(recordCode.trim());
  };

  const handleOpenCamera = (sectionSetter: React.Dispatch<React.SetStateAction<InspectionItem[]>>, itemId: string, recordCode: string, section: string) => {
    if (!recordCode.trim()) return;
    
    const isVideo = isVideoRecord(recordCode);
    console.log(`Opening camera for ${recordCode}, video mode: ${isVideo}`);
    
    setCurrentCameraId(recordCode);
    setCurrentSection(section);
    setIsVideoMode(isVideo);
    
    setTimeout(() => {
      setShowCamera(true);
    }, 50);
    
    document.body.style.pointerEvents = 'none';
    setTimeout(() => {
      document.body.style.pointerEvents = '';
    }, 500);
  };

  const handleCaptureMedia = (mediaData: string, isVideo: boolean) => {
    console.log(`Media captured for ${currentCameraId}, is video: ${isVideo}`);
    
    let sectionSetter;
    switch (currentSection) {
      case "general":
        sectionSetter = setGeneralItems;
        break;
      case "shelf":
        sectionSetter = setShelfItems;
        break;
      case "cabinet":
        sectionSetter = setCabinetItems;
        break;
      case "controlModule":
        sectionSetter = setControlModuleItems;
        break;
      case "packaging":
        sectionSetter = setPackagingItems;
        break;
      default:
        return;
    }

    sectionSetter(prev =>
      prev.map(item => {
        if (item.defaultRecord.includes(',')) {
          const records = item.defaultRecord.split(',');
          if (records.includes(currentCameraId)) {
            return { ...item, photoTaken: true };
          }
          return item;
        }
        return item.defaultRecord === currentCameraId
          ? { ...item, photoTaken: true }
          : item;
      })
    );

    if (isVideo) {
      console.log(`Storing video data for ${currentCameraId}`);
      setVideoData(prev => {
        const newMap = new Map(prev);
        newMap.set(currentCameraId, mediaData);
        return newMap;
      });
    } else {
      console.log(`Storing photo data for ${currentCameraId}`);
      setPhotoData(prev => {
        const newMap = new Map(prev);
        newMap.set(currentCameraId, mediaData);
        return newMap;
      });
    }

    setShowCamera(false);

    toast.success(
      isVideo ? "Video gravado" : "Foto capturada", 
      { description: `${isVideo ? "Video" : "Foto"} para ${currentCameraId} salvo com sucesso.` }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Iniciando geração de documentos");
    console.log("Fotos:", photoData.size);
    console.log("Vídeos:", videoData.size);
    
    setIsSaving(true);
    
    try {
      toast.info("Processando", { 
        description: "Gerando documentos para download...",
      });

      const { success, message } = await generateInspectionPDF(
        formData,
        generalItems,
        shelfItems,
        cabinetItems,
        controlModuleItems,
        packagingItems,
        photoData,
        videoData,
        reportPdfBlob, // Sempre usar fallback para download direto
        false,
        cabinetType,
        additionalNotes
      );
      
      if (success) {
        toast.success("Sucesso", { description: message });
        setTimeout(() => {
          onReset();
        }, 2000);
      } else {
        toast.error("Erro", { description: message });
      }
    } catch (error) {
      console.error("Erro ao processar arquivos:", error);
      toast.error("Erro", {
        description: "Erro ao processar arquivos. Tente novamente."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateMachineReport = async () => {
    if (!formData.cabinetSN) {
      toast.error("Erro", { description: "Introduza um S/N de Cabinet primeiro." });
      return;
    }
    
    setIsGeneratingMachineReport(true);
    setMachineReportProgress(0);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      setMachineReportProgress(prev => (prev < 88 ? prev + 2 : 88));
    }, 100);

    toast.info("A gerar Machine Report", { description: "Consultando prateleiras e gerando PDF..." });

    try {
      // Lógica para detetar o número de prateleiras a partir do texto selecionado
      let numShelves = 1;
      if (formData.configurationType.includes("4 prateleiras")) numShelves = 4;
      else if (formData.configurationType.includes("3 prateleiras")) numShelves = 3;
      else if (formData.configurationType.includes("1 prateleira")) numShelves = 1;
      else numShelves = 4; // Default para Custom ou outros

      console.log(`[Relatório] Gerando com ${numShelves} prateleiras baseado na configuração: ${formData.configurationType}`);

      const { success, message, pdfBlob } = await generateMachineReportPDF(formData.cabinetSN, numShelves);

      if (success) {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        setMachineReportProgress(100);
        toast.success("Sucesso", { description: message });
        if (pdfBlob) {
          setReportPdfBlob(pdfBlob);
        }
      } else {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        setMachineReportProgress(0);
        toast.error("Erro", { description: message });
      }
    } catch (e) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setMachineReportProgress(0);
      toast.error("Erro crítico", { description: "Ocorreu um erro ao gerar o relatório." });
    } finally {
      setIsGeneratingMachineReport(false);
    }
  };

  const getResultBackgroundColor = (result: string) => {
    switch (result) {
      case "Ok":
        return "bg-green-500 text-white";
      case "Not Ok":
        return "bg-red-500 text-white";
      default:
        return "";
    }
  };

  const renderSingleCaptureButton = (
    sectionSetter: React.Dispatch<React.SetStateAction<InspectionItem[]>>,
    item: InspectionItem,
    sectionKey: string,
    recordId: string
  ) => {
    const isVideo = isVideoRecord(recordId);
    const isRecorded = recordId ? (photoData.has(recordId) || videoData.has(recordId)) : false;
    const mediaData = isVideo ? videoData.get(recordId) : photoData.get(recordId);

    const handleCaptureClick = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.currentTarget && 'blur' in e.currentTarget) {
        (e.currentTarget as HTMLElement).blur();
      }
      handleOpenCamera(sectionSetter, item.id, recordId, sectionKey);
      return false;
    };

    return (
      <div key={recordId} className="flex items-center gap-1">
        <Button
          variant="outline"
          className={`${isMobile ? 'flex-1' : ''} flex items-center justify-center gap-2 ${isRecorded ? 'bg-green-500 hover:bg-green-600 text-white' : ''}`}
          onClick={handleCaptureClick}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => { e.stopPropagation(); handleCaptureClick(e); }}
        >
          {isVideo ? <VideoIcon className="w-4 h-4" /> : <CameraIcon className="w-4 h-4" />}
          {recordId}
        </Button>
        {isRecorded && mediaData && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="flex items-center justify-center text-blue-600 border-blue-300 hover:bg-blue-50"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPreviewMedia({ data: mediaData, isVideo, id: recordId }); }}
            onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setPreviewMedia({ data: mediaData, isVideo, id: recordId }); }}
          >
            <Eye className="w-4 h-4" />
          </Button>
        )}
        <ReferenceImageButton recordCode={recordId} />
      </div>
    );
  };

  const renderCaptureButton = (
    sectionSetter: React.Dispatch<React.SetStateAction<InspectionItem[]>>, 
    item: InspectionItem, 
    sectionKey: string
  ) => {
    const records = item.defaultRecord.split(',');
    if (records.length > 1) {
      return (
        <div className="flex flex-col gap-1">
          {records.map(rec => renderSingleCaptureButton(sectionSetter, item, sectionKey, rec.trim()))}
        </div>
      );
    }
    return renderSingleCaptureButton(sectionSetter, item, sectionKey, item.defaultRecord);
  };

  const renderSectionTable = (
    title: string,
    items: InspectionItem[],
    sectionSetter: React.Dispatch<React.SetStateAction<InspectionItem[]>>,
    sectionKey: string,
    hideEmptyRecord = false
  ) => {
    return (
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        
        {isMobile ? (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-secondary/30 p-4 rounded-lg shadow-sm">
                <div className="font-medium mb-2">{item.label}</div>
                
                <div className="grid grid-cols-1 gap-3">
                  {(item.defaultRecord || !hideEmptyRecord) && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Registo video/foto
                      </label>
                      {item.defaultRecord ? (
                        renderCaptureButton(sectionSetter, item, sectionKey)
                      ) : (
                        <Input
                          value={item.defaultRecord}
                          onChange={(e) => handleRecordChange(sectionSetter, item.id, e.target.value)}
                          className="bg-secondary/50 w-full"
                        />
                      )}
                    </div>
                  )}
                  
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Resultado
                    </label>
                    <Select 
                      value={item.defaultResult}
                      onValueChange={(value) => handleResultChange(sectionSetter, item.id, value)}
                    >
                      <SelectTrigger className={`h-9 w-full ${getResultBackgroundColor(item.defaultResult)}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ok">Ok</SelectItem>
                        <SelectItem value="Not Ok">Not Ok</SelectItem>
                        <SelectItem value="N/A">N/A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Comentário
                    </label>
                    <Input 
                      value={item.comment}
                      onChange={(e) => handleCommentChange(sectionSetter, item.id, e.target.value)}
                      className="bg-secondary/50 w-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%]">Item</TableHead>
                <TableHead className="w-[20%]">Registo video/foto</TableHead>
                <TableHead className="w-[15%]">Resultado</TableHead>
                <TableHead className="w-[15%]">Comentário</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.label}</TableCell>
                  <TableCell>
                    {item.defaultRecord ? (
                      renderCaptureButton(sectionSetter, item, sectionKey)
                    ) : hideEmptyRecord ? null : (
                      <Input
                        value={item.defaultRecord}
                        onChange={(e) => handleRecordChange(sectionSetter, item.id, e.target.value)}
                        className="bg-secondary/50"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={item.defaultResult}
                      onValueChange={(value) => handleResultChange(sectionSetter, item.id, value)}
                    >
                      <SelectTrigger className={`h-9 ${getResultBackgroundColor(item.defaultResult)}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ok">Ok</SelectItem>
                        <SelectItem value="Not Ok">Not Ok</SelectItem>
                        <SelectItem value="N/A">N/A</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input 
                      value={item.comment}
                      onChange={(e) => handleCommentChange(sectionSetter, item.id, e.target.value)}
                      className="bg-secondary/50"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-white p-4 md:p-6 rounded-xl shadow-sm animate-fade-in">
      {showCamera && (
        <Camera
          onCapture={handleCaptureMedia}
          onClose={() => setShowCamera(false)}
          cameraId={currentCameraId}
          isVideoMode={isVideoMode}
        />
      )}

      {previewMedia && (
        <div
          className="fixed inset-0 z-40 bg-black/90 flex flex-col items-center justify-center"
          onClick={() => setPreviewMedia(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/20 rounded-full text-white hover:bg-white/30"
            onClick={() => setPreviewMedia(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <p className="text-white text-sm mb-3 font-medium opacity-80">{previewMedia.id}</p>
          {previewMedia.isVideo ? (
            <video
              src={previewMedia.data}
              controls
              className="max-h-[80vh] max-w-[95vw]"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={previewMedia.data}
              alt={`Preview ${previewMedia.id}`}
              className="max-h-[80vh] max-w-[95vw] object-contain rounded"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
      
      <h2 className="text-xl font-semibold mb-6 text-center">Validação de montagem de Armários e Módulos</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="space-y-2">
          <label className="text-sm font-medium">Técnico Resp.</label>
          <Input 
            name="technicianName"
            value={formData.technicianName} 
            onChange={handleFormChange} 
            className="bg-secondary/50" 
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Data</label>
          <Input 
            name="date"
            value={formData.date} 
            onChange={handleFormChange} 
            className="bg-secondary/50" 
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Armário S/N</label>
          <Input 
            name="cabinetSN"
            value={formData.cabinetSN} 
            onChange={handleFormChange} 
            className="bg-secondary/50" 
          />
        </div>
        {cabinetType === 'cabinet-with-cm' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Control Module S/N</label>
            <Input 
              name="controlModuleSN"
              value={formData.controlModuleSN} 
              onChange={handleFormChange} 
              className="bg-secondary/50" 
            />
          </div>
        )}
        <div className="space-y-2">
          <label className="text-sm font-medium">Técnico Aux.</label>
          <Input 
            name="assistantTechnician"
            value={formData.assistantTechnician} 
            onChange={handleFormChange} 
            className="bg-secondary/50" 
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Tipo de configuação</label>
          <Select 
            value={formData.configurationType}
            onValueChange={(value) => setFormData(prev => ({ ...prev, configurationType: value }))}
          >
            <SelectTrigger className="bg-secondary/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Standard - 1 prateleira">Standard - 1 prateleira</SelectItem>
              <SelectItem value="Standard - 3 prateleiras">Standard - 3 prateleiras</SelectItem>
              <SelectItem value="Standard - 4 prateleiras">Standard - 4 prateleiras</SelectItem>
              <SelectItem value="Custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {renderSectionTable("1. Armário", cabinetItems, setCabinetItems, "cabinet", true)}
        {renderSectionTable("2. Prateleira", shelfItems, setShelfItems, "shelf")}
        {cabinetType === 'cabinet-with-cm' && renderSectionTable("3. Control Module", controlModuleItems, setControlModuleItems, "controlModule")}
        {renderSectionTable("4. Geral", generalItems, setGeneralItems, "general")}
        {renderSectionTable("5. Packaging", packagingItems, setPackagingItems, "packaging")}

        <div className="mt-6 space-y-2">
          <label className="text-sm font-medium">Notas Adicionais</label>
          <Textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Informações adicionais relevantes para esta inspeção..."
            className="bg-secondary/50 min-h-[100px]"
          />
        </div>

        {reportPdfBlob && (
          <label className="flex items-start gap-3 cursor-pointer select-none mt-6">
            <input
              type="checkbox"
              checked={qualityConfirmed}
              onChange={(e) => setQualityConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 cursor-pointer accent-black shrink-0"
            />
            <span className="text-sm text-foreground">
              Confirmo que o quality check está em conformidade com a política de qualidade da Reckon.ai.
            </span>
          </label>
        )}

        <div className="mt-4 flex justify-end space-x-4">
          <div className="flex flex-col items-stretch gap-1">
            <Button
              type="button"
              variant="outline"
              className={`px-6 py-2 transition-colors relative overflow-hidden ${reportPdfBlob ? 'bg-green-500 text-white hover:bg-green-600 border-green-600' : ''}`}
              disabled={isGeneratingMachineReport}
              onClick={handleGenerateMachineReport}
            >
              <span className="relative z-10">
                {isGeneratingMachineReport
                  ? `Gerando Report... ${machineReportProgress}%`
                  : reportPdfBlob ? 'Report gerado ✓' : 'Gerar Machine Report'}
              </span>
            </Button>
            {(isGeneratingMachineReport || machineReportProgress === 100) && (
              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-100"
                  style={{ width: `${machineReportProgress}%` }}
                />
              </div>
            )}
          </div>
          <Button
            type="submit"
            className={`px-6 py-2 ${(!reportPdfBlob || !qualityConfirmed) ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isSaving || !reportPdfBlob || !qualityConfirmed}
            title={!reportPdfBlob ? 'Gere o Machine Report primeiro' : (!qualityConfirmed ? 'Confirme a política de qualidade' : undefined)}
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default InspectionForm;
