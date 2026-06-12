import React, { useRef, useState, useEffect } from 'react';
import { toast } from "sonner";
import { X, Video, Camera as CameraIcon, Play, Square } from 'lucide-react';
import { Button } from './ui/button';

interface CameraProps {
  onCapture: (mediaData: string, isVideo: boolean) => void;
  onClose: () => void;
  cameraId: string;
  isVideoMode: boolean;
}

const Camera: React.FC<CameraProps> = ({ onCapture, onClose, cameraId, isVideoMode }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef<number | null>(null);

  // Compute the CSS-pixel height of the Android nav bar using three sources (in priority order):
  //  1. window.visualViewport: in Capacitor edge-to-edge mode the layout viewport extends behind
  //     system bars while visualViewport.height is the actually-visible area. The difference
  //     (minus the top inset for the status bar) gives the exact nav bar height in CSS pixels
  //     without any Java code or density calculations.
  //  2. window.__androidNavBarHeight injected by MainActivity divided by devicePixelRatio to
  //     convert physical pixels → CSS pixels.
  //  3. Conservative fallback: 200px covers any Android nav bar up to ~66dp at 3× density.
  const readNavBarCSS = (): number => {
    const vv = window.visualViewport;
    if (vv) {
      const bottomGap = Math.round(window.innerHeight - vv.height - (vv.offsetTop ?? 0));
      if (bottomGap > 10) return bottomGap;
    }
    const raw = (window as any).__androidNavBarHeight;
    if (typeof raw === 'number' && raw > 0) {
      return Math.round(raw / (window.devicePixelRatio || 1));
    }
    return 0;
  };

  const [navBarOffset, setNavBarOffset] = useState<number>(() => {
    const h = readNavBarCSS();
    return h > 0 ? h + 24 : 200;
  });

  useEffect(() => {
    const update = () => {
      const h = readNavBarCSS();
      if (h > 0) setNavBarOffset(h + 24);
    };
    update();
    window.visualViewport?.addEventListener('resize', update);
    return () => window.visualViewport?.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    const startCamera = async () => {
      try {
        setIsCameraLoading(true);
        setCameraError(null);
        
        let mediaStream: MediaStream;
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { exact: 'environment' } },
            audio: isVideoMode,
          });
        } catch (err) {
          console.log("Could not get environment camera, trying default", err);
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: isVideoMode,
          });
        }
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          setStream(mediaStream);
        }
        
        setIsCameraLoading(false);
      } catch (error) {
        console.error('Error accessing camera:', error);
        setCameraError("Unable to access camera. Please check permissions.");
        setIsCameraLoading(false);
        toast.error("Unable to access camera. Please check permissions.");
      }
    };

    startCamera();

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
      }
      
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isVideoMode]);

  const startVideoRecording = () => {
    if (!stream) return;
    
    try {
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });

        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          onCapture(base64data, true);
        };
        
        setIsRecording(false);
        setRecordingTime(0);
        if (recordingTimerRef.current) {
          window.clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
      };
      
      mediaRecorder.start(1000);
      setIsRecording(true);
      
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // toast removed to avoid overlapping buttons on mobile
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error("Failed to start recording. Please try again.");
    }
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      toast.success("Recording stopped");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      setIsCapturing(true);
      
      const shutter = document.createElement('div');
      shutter.className = 'shutter-animation';
      document.body.appendChild(shutter);
      
      setTimeout(() => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const context = canvas.getContext('2d');
        if (context) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const imageData = canvas.toDataURL('image/jpeg', 0.8);
          
          onCapture(imageData, false);
        }
        
        document.body.removeChild(shutter);
        setIsCapturing(false);
      }, 300);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const preventDefaultAndStopPropagation = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };
  
  const preventTouchPropagation = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  const handleCloseClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
    return false;
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black flex flex-col animate-fade-in" 
      onClick={preventDefaultAndStopPropagation}
      onMouseDown={preventDefaultAndStopPropagation}
      onMouseUp={preventDefaultAndStopPropagation}
      onTouchStart={preventTouchPropagation}
      onTouchEnd={preventTouchPropagation}
      onTouchMove={preventTouchPropagation}
      onContextMenu={preventDefaultAndStopPropagation}
    >
      <div
        className="flex items-center justify-between px-4 pb-4"
        style={{ paddingTop: 'max(36px, env(safe-area-inset-top))' }}
        onClick={preventDefaultAndStopPropagation}
      >
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">
            {isVideoMode ? (
              <>
                <Video className="inline-block mr-1 w-4 h-4" />
                Video {cameraId}
              </>
            ) : (
              <>
                <CameraIcon className="inline-block mr-1 w-4 h-4" />
                Photo {cameraId}
              </>
            )}
          </span>
          {isRecording && (
            <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
              <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse"></span>
              REC {formatTime(recordingTime)}
            </span>
          )}
        </div>
        <button 
          onClick={handleCloseClick}
          onTouchEnd={handleCloseClick}
          className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          disabled={isRecording}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div
        className="flex-1 min-h-0 relative flex items-center justify-center bg-black overflow-hidden"
        onClick={preventDefaultAndStopPropagation}
        onTouchStart={preventTouchPropagation}
        onTouchEnd={preventTouchPropagation}
      >
        {isCameraLoading && (
          <div className="text-white">Loading camera...</div>
        )}
        
        {cameraError && (
          <div className="text-red-500 p-4 text-center">
            {cameraError}
            <div className="mt-2">
              <button 
                onClick={(e) => {
                  preventDefaultAndStopPropagation(e);
                  onClose();
                }}
                className="px-4 py-2 bg-white text-black rounded"
              >
                Close
              </button>
            </div>
          </div>
        )}
        
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline
          onClick={preventDefaultAndStopPropagation}
          onTouchStart={preventTouchPropagation}
          onTouchEnd={preventTouchPropagation}
          className="max-h-full max-w-full object-contain"
          style={{ pointerEvents: "auto" }}
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>
      
      <div
        className="px-6 pt-6 bg-black"
        style={{ paddingBottom: `${navBarOffset}px` }}
        onClick={preventDefaultAndStopPropagation}
        onTouchStart={preventTouchPropagation}
        onTouchEnd={preventTouchPropagation}
      >
        {isVideoMode ? (
          <div 
            className="flex items-center justify-center" 
            onClick={preventDefaultAndStopPropagation}
            onTouchStart={preventTouchPropagation}
            onTouchEnd={preventTouchPropagation}
          >
            {!isRecording ? (
              <Button
                onClick={(e) => {
                  preventDefaultAndStopPropagation(e);
                  startVideoRecording();
                }}
                onTouchEnd={(e) => {
                  preventTouchPropagation(e);
                  startVideoRecording();
                }}
                disabled={isCameraLoading || !!cameraError}
                className="rounded-full w-16 h-16 bg-red-500 hover:bg-red-600 flex items-center justify-center"
              >
                <Play className="w-8 h-8 text-white" />
              </Button>
            ) : (
              <Button
                onClick={(e) => {
                  preventDefaultAndStopPropagation(e);
                  stopVideoRecording();
                }}
                onTouchEnd={(e) => {
                  preventTouchPropagation(e);
                  stopVideoRecording();
                }}
                className="rounded-full w-16 h-16 bg-red-500 hover:bg-red-600 flex items-center justify-center"
              >
                <Square className="w-6 h-6 text-white" />
              </Button>
            )}
          </div>
        ) : (
          <button
            onClick={(e) => {
              preventDefaultAndStopPropagation(e);
              capturePhoto();
            }}
            onTouchEnd={(e) => {
              preventTouchPropagation(e);
              capturePhoto();
            }}
            disabled={isCapturing || isCameraLoading || !!cameraError}
            className={`w-16 h-16 mx-auto flex items-center justify-center rounded-full border-4 border-white
              ${isCapturing || isCameraLoading || !!cameraError ? 'bg-white/50 opacity-50' : 'bg-white/20 hover:bg-white/30'} 
              transition-all duration-200 btn-press`}
          >
            <div className="w-12 h-12 rounded-full bg-white" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Camera;
