import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { isNativePlatform } from "@/utils/nativeFileUtils";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    } | undefined;
  }
}

// Configs adapted from Python
const SECRET_KEY = '981239jw1298';
const MASTER_IP = '172.29.1.8';
const SHELF_BASE_IP = '172.29.1.';
const MASTER_PORT = '8000';
const SHELF_PORT = '5002';

const HEADERS_MASTER = { "secret": SECRET_KEY, "sender-port": "8060" };
const HEADERS_SHELF = { "secret": SECRET_KEY, "sender-port": "8060" };

const masterUrl = (path: string) =>
  isNativePlatform()
    ? `http://${MASTER_IP}:${MASTER_PORT}${path}`
    : `/master-proxy${path}`;

const fetchJSON = async (url: string, headers: HeadersInit) => {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 30000); // Aumentado para 30s pois o hardware é lento
    const res = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(id);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.warn(`[fetchJSON] ${url} falhou com status ${res.status}:`, errorText);
      return `HTTP Error ${res.status}: ${errorText.substring(0, 50)}`;
    }
    
    const text = await res.text();
    try {
      return JSON.stringify(JSON.parse(text));
    } catch {
      return text;
    }
  } catch (err: any) {
    console.error("fetchJSON error for url:", url, err);
    return `Fetch Error: ${err.message || err}`;
  }
};

const fetchImageBase64 = async (url: string, headers: HeadersInit): Promise<string | null> => {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 10000); // Aumentado para 10s
    const res = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(id);
    
    if (!res.ok) {
      console.warn(`[fetchImage] ${url} falhou com status ${res.status}`);
      return null;
    }

    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const json = await res.json();
      if (!json.success || !json.result) {
        console.warn(`[fetchImage] JSON retornado sem imagem para ${url}:`, json);
        return null;
      }
      return json.result.startsWith('data:image')
        ? json.result
        : `data:image/jpeg;base64,${json.result}`;
    }

    // Fallback para respostas que retornem imagem directamente como blob
    const blob = await res.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error(`[fetchImage] Erro crítico ao buscar ${url}:`, err);
    return null;
  }
};

/**
 * Obtém as dimensões reais de uma imagem a partir de um data URL
 */
const getImageDimensions = (dataUrl: string): Promise<{ width: number, height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 800, height: 600 });
    img.src = dataUrl;
  });
};

export const generateMachineReportPDF = async (cabinetSN: string, numShelves: number = 4) => {
  // Connectivity check before generating
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    await fetch(masterUrl(`/door_status`), { headers: HEADERS_MASTER, signal: ctrl.signal });
    clearTimeout(t);
  } catch (e: any) {
    const url = masterUrl(`/door_status`);
    return {
      success: false,
      message: `Sem ligação ao dispositivo (${url}). Confirme que o telemóvel está na mesma rede WiFi que o armário.`,
      pdfBlob: undefined
    };
  }

  try {
    const doc = new jsPDF();

    // Polyfill autoTable just in case
    if (typeof doc.autoTable !== 'function') {
      (doc as any).autoTable = function (options: any) {
        autoTable(this, options);
        return this;
      };
    }

    const currentDate = new Date();
    const dateStr = currentDate.toISOString().replace('T', ' ').substring(0, 26);
    const fileDateStr = currentDate.getFullYear() +
      String(currentDate.getMonth() + 1).padStart(2, '0') +
      String(currentDate.getDate()).padStart(2, '0') + '_' +
      String(currentDate.getHours()).padStart(2, '0') +
      String(currentDate.getMinutes()).padStart(2, '0') +
      String(currentDate.getSeconds()).padStart(2, '0');

    // --- Page 1: Master Status ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Machine Report", 14, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`SN Cabinet: ${cabinetSN}`, 14, 30);
    doc.text(`DATE: ${dateStr}`, 14, 36);

    // Fetch Master Status
    console.log("[Relatório] Buscando status do Master...");
    let doorStatus = "N/A";
    let actuatorStatus = "N/A";
    let notifyRaw = "N/A";

    try {
      doorStatus = await fetchJSON(masterUrl(`/door_status`), HEADERS_MASTER);
      actuatorStatus = await fetchJSON(masterUrl(`/actuator_status`), HEADERS_MASTER);
      notifyRaw = await fetchJSON(masterUrl(`/notify`), HEADERS_MASTER);
    } catch (e) {
      console.warn("[Relatório] Falha ao buscar status individuais do Master:", e);
    }

    // Sanitize function to avoid multi-line overlaps
    const sanitize = (text: any) => {
      if (typeof text !== 'string') return String(text);
      if (text.startsWith('HTTP Error') || text.startsWith('Fetch Error')) return 'N/A';
      if (text.includes('<!doctype') || text.includes('<html')) return 'N/A';
      return text.replace(/\n/g, ' ').replace(/\r/g, '').substring(0, 80);
    };

    doc.setFont("helvetica", "bold");
    doc.text(`Master Component (${MASTER_IP}) Status:`, 14, 55);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Door Status: ${sanitize(doorStatus)}`, 14, 65);
    doc.text(`Actuator Status: ${sanitize(actuatorStatus)}`, 14, 72);

    let notifyDoors = "N/A";
    let notifyActuator = "N/A";
    try {
      const parsedNotify = JSON.parse(notifyRaw);
      if (parsedNotify.door) notifyDoors = JSON.stringify(parsedNotify.door);
      if (parsedNotify.actuator) notifyActuator = JSON.stringify(parsedNotify.actuator);
    } catch (e) {
      if (notifyRaw && notifyRaw.includes('door')) {
        notifyDoors = sanitize(notifyRaw);
      }
    }

    doc.text(`Notify Doors: ${sanitize(notifyDoors)}`, 14, 79);
    doc.text(`Notify Actuator: ${sanitize(notifyActuator)}`, 14, 86);

    // --- Pages 2..N: Shelves ---
    const allImages: { ip: string, left: string | null, right: string | null }[] = [];

    // Busca todos os dados de uma vez do Master
    console.log(`[Relatório] Buscando dados de ${numShelves} prateleiras via Master...`);
    const masterDataRaw = await fetchJSON(masterUrl(`/api/get_shelf_data?num_shelves=${numShelves}`), HEADERS_MASTER);
    
    console.log("[Relatório] Resposta Raw do Master:", masterDataRaw);

    let shelvesData: any = {};
    try {
      const parsed = typeof masterDataRaw === 'string' ? JSON.parse(masterDataRaw) : masterDataRaw;
      
      if (parsed.success && parsed.shelves) {
        shelvesData = parsed.shelves;
      } else {
        console.warn("[Relatório] JSON recebido mas sem sucesso ou sem 'shelves':", parsed);
      }

      // Tenta extrair status do Master da resposta agregada se disponível
      if (parsed.door_status !== undefined) doorStatus = parsed.door_status;
      if (parsed.actuator_status !== undefined) actuatorStatus = parsed.actuator_status;
      if (parsed.notify !== undefined) {
        notifyRaw = typeof parsed.notify === 'string' ? parsed.notify : JSON.stringify(parsed.notify);
      }
    } catch (e) {
      console.error("[Relatório] Erro ao processar JSON do Master:", e);
    }

    // Total pages calculation: 1 (Master) + numShelves + 1 (Combined Overview)
    const totalPages = 1 + numShelves + 1;

    for (let i = 1; i <= numShelves; i++) {
      const shelfId = `${i * 10}`;
      const fullIp = `${SHELF_BASE_IP}${shelfId}`;
      const data = shelvesData[shelfId] || {};

      doc.addPage();

      const scaleWeight = data.scale || "N/A";
      const tempSensor = !data.temp_sensor || typeof data.temp_sensor === 'object' ? "N/A" : String(data.temp_sensor);

      console.log(`[Relatório] Processando Shelf ${shelfId}: Scale=${scaleWeight}, Temp=${tempSensor}`);

      const leftPath = data.image_left_url || "";
      const rightPath = data.image_right_url || "";

      // Extract SN from image path if not directly provided
      let shelfSN = data.sn || data.serial_number || data.serial || "N/A";
      
      console.log(`[Relatório] Processando Shelf ${shelfId}:`, {
        data,
        leftPath,
        currentSN: shelfSN
      });

      if (shelfSN === "N/A" && leftPath && leftPath.includes('_')) {
        const filename = leftPath.split('/').pop() || '';
        const parts = filename.split('_');
        if (parts.length >= 3) {
          shelfSN = parts[1];
          console.log(`[Relatório] SN extraído do path: ${shelfSN}`);
        }
      }

      const imgLeft = await fetchImageBase64(masterUrl(leftPath || `/images/live_images/${shelfId}_UNKNOWN_left.jpg`), HEADERS_SHELF);
      const imgRight = await fetchImageBase64(masterUrl(rightPath || `/images/live_images/${shelfId}_UNKNOWN_right.jpg`), HEADERS_SHELF);

      allImages.push({ ip: fullIp, left: imgLeft, right: imgRight });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(`Shelf ${shelfId} (SN: ${shelfSN})`, 14, 30);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`Scale Weight: ${scaleWeight}`, 14, 40);
      doc.text(`Temperature Sensor: ${tempSensor}`, 14, 46);

      // Render images
      if (imgLeft) {
        doc.text("Left Camera:", 14, 60);
        doc.addImage(imgLeft, 'JPEG', 14, 65, 80, 60);
      } else {
        doc.text("[Sem Imagem Câmera Esquerda]", 14, 60);
      }

      if (imgRight) {
        doc.text("Right Camera:", 104, 60);
        doc.addImage(imgRight, 'JPEG', 104, 65, 80, 60);
      } else {
        doc.text("[Sem Imagem Câmera Direita]", 104, 60);
      }
    }

    // --- Final Page: Combined Grid ---
    doc.addPage();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Combined Shelf Images Overview", 14, 25);

    let currentY = 35;

    for (const shelfImgs of allImages) {
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`Images from Shelf ${shelfImgs.ip}`, 14, currentY);

      if (shelfImgs.left) {
        doc.addImage(shelfImgs.left, 'JPEG', 14, currentY + 5, 80, 60);
      } else {
        doc.text("N/A", 14, currentY + 35);
      }

      if (shelfImgs.right) {
        doc.addImage(shelfImgs.right, 'JPEG', 104, currentY + 5, 80, 60);
      } else {
        doc.text("N/A", 104, currentY + 35);
      }

      currentY += 75;
    }

    // --- Post-process: Add pagination headers starting from Page 2 ---
    const totalCount = doc.internal.pages.length - 1;
    for (let i = 2; i <= totalCount; i++) {
      doc.setPage(i);
      doc.setFontSize(12);
      doc.text(`-- ${i - 1} of ${totalCount - 1} --`, 105, 15, { align: "center" });
    }

    const fileName = `machineReport_${cabinetSN}_${fileDateStr}.pdf`;
    doc.save(fileName);

    const pdfBlob = doc.output('blob');
    return { success: true, message: `Report gerado com sucesso: ${fileName}`, pdfBlob };
  } catch (error: any) {
    console.error("Error generating Machine Report:", error);
    return { success: false, message: `Erro ao gerar relatório: ${error.message}`, pdfBlob: undefined };
  }
};
