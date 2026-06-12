import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Mapping of record codes to their reference images.
 * Each code can have one or more reference images.
 */
const REFERENCE_IMAGES: Record<string, string[]> = {
  // 1. Armário
  'AO_F1': ['/reference-images/AO_F1.jpg'],
  'AO_F2': ['/reference-images/AO_F2.jpg'],
  'AO_F3': ['/reference-images/AO_F3.jpg'],
  // 1. Armário (Tilt)
  'TI_F1': ['/reference-images/TI_F1.jpg'],
  'TI_F2': ['/reference-images/TI_F2.jpg'],
  // 2. Prateleira
  'PA_F1': ['/reference-images/PA_F1.jpg'],
  'PA_F2': ['/reference-images/PA_F2.jpg'],
  'PA_F3': ['/reference-images/PA_F3.jpg'],
  // 3. Control Module
  'CM_F1_1': ['/reference-images/CM_F1_1.jpg'],
  'CM_F1_2': ['/reference-images/CM_F1_2.jpg'],
  'CM_F1_3': ['/reference-images/CM_F1_3.jpg'],
  'CM_F1_4': ['/reference-images/CM_F1_4.jpg'],
  'CM_F2_1': ['/reference-images/CM_F2_1.jpg'],
  'CM_F2_2': ['/reference-images/CM_F2_2.jpg'],
  'CM_F2_3': ['/reference-images/CM_F2_3.jpg'],
  'CM_F3': ['/reference-images/CM_F3.jpg', '/reference-images/CM_F3-2.jpg'],
  'CM_F3_1': ['/reference-images/CM_F3_1.jpg'],
  'CM_F3_2': ['/reference-images/CM_F3_2.jpg'],
  'CM_F4': ['/reference-images/CM_F4.jpg'],
  'CM_F5': ['/reference-images/CM_F5.jpg'],
  'CM_F6': ['/reference-images/CM_F6.jpg'],
  // 4. Geral
  'GL_F1': ['/reference-images/GL_F1.jpg'],
  'GL_F1-2': ['/reference-images/GL_F1-2.jpg'],
  'GL_F2': ['/reference-images/GL_F2.jpg'],
  'GL_F2_1': ['/reference-images/GL_F2_1.jpg'],
  'GL_F2_2': ['/reference-images/GL_F2_2.jpg'],
  'GL_F3': ['/reference-images/GL_F3.jpg'],
  'GL_F3-2': ['/reference-images/GL_F3-2.jpg'],
  'GL_F4': ['/reference-images/GL_F4.jpg'],
  'GL_F4-2': ['/reference-images/GL_F4-2.jpg'],
  'GL_F1-F2-F3-F4': [
    '/reference-images/GL_F1.jpg',
    '/reference-images/GL_F2.jpg',
    '/reference-images/GL_F2_1.jpg',
    '/reference-images/GL_F2_2.jpg',
    '/reference-images/GL_F3.jpg',
    '/reference-images/GL_F3-2.jpg',
    '/reference-images/GL_F4-2.jpg',
  ],
  // 5. Packaging
  'PK_F1': ['/reference-images/PK_F1.jpg'],
  'PK_F2': ['/reference-images/PK_F2.jpg'],
};

export const hasReferenceImage = (recordCode: string): boolean => {
  return !!REFERENCE_IMAGES[recordCode];
};

export const getReferenceImages = (recordCode: string): string[] => {
  return REFERENCE_IMAGES[recordCode] || [];
};

interface ReferenceImageModalProps {
  recordCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ReferenceImageModal: React.FC<ReferenceImageModalProps> = ({ recordCode, open, onOpenChange }) => {
  const images = getReferenceImages(recordCode);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images.length) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-3xl max-h-[90vh] p-2 md:p-6">
        <DialogHeader>
          <DialogTitle className="text-center pr-8">
            Imagem de Referência — {recordCode}
          </DialogTitle>
        </DialogHeader>
        <div className="relative flex items-center justify-center min-h-[200px]">
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-0 z-10"
              onClick={() => setCurrentIndex(i => (i - 1 + images.length) % images.length)}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
          )}
          <img
            src={images[currentIndex]}
            alt={`Referência ${recordCode}`}
            className="max-h-[70vh] max-w-full object-contain rounded-lg"
          />
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 z-10"
              onClick={() => setCurrentIndex(i => (i + 1) % images.length)}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          )}
        </div>
        {images.length > 1 && (
          <p className="text-center text-sm text-muted-foreground">
            {currentIndex + 1} / {images.length}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

interface ReferenceImageButtonProps {
  recordCode: string;
  className?: string;
}

export const ReferenceImageButton: React.FC<ReferenceImageButtonProps> = ({ recordCode, className }) => {
  const [open, setOpen] = useState(false);

  if (!hasReferenceImage(recordCode)) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={`flex items-center gap-1 text-xs border-blue-300 text-blue-600 hover:bg-blue-50 ${className || ''}`}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
      >
        <Eye className="w-3.5 h-3.5" />
        Ref.
      </Button>
      <ReferenceImageModal recordCode={recordCode} open={open} onOpenChange={setOpen} />
    </>
  );
};

export default ReferenceImageModal;
