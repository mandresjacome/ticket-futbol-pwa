'use client';

import React, { useRef, useState } from 'react';
import { Camera, Upload, ShieldCheck, Loader2, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TicketForm, type MarketOption } from '@/components/ticket/TicketForm';
import { compressImage } from '@/lib/image/compress';
import type { ExtractedTicket, ExtractResult } from '@/lib/ocr/schema';

type Step = 'select' | 'analyzing' | 'review';
type PickedImage = { id: number; file: File; url: string };

const MAX_IMAGES = 5;
const MAX_ORIGINAL_BYTES = 20 * 1024 * 1024;

export const TicketUploadFlow: React.FC<{ markets: MarketOption[] }> = ({ markets }) => {
  const nextId = useRef(1);
  const [step, setStep] = useState<Step>('select');
  const [images, setImages] = useState<PickedImage[]>([]);
  const [extracted, setExtracted] = useState<ExtractedTicket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  const revokeAll = (list: PickedImage[]) => list.forEach((image) => URL.revokeObjectURL(image.url));

  const reset = () => {
    revokeAll(images);
    setImages([]);
    setExtracted(null);
    setError(null);
    setStep('select');
    setFormKey((k) => k + 1);
  };

  const handleFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;

    const valid = files.filter((f) => f.type.startsWith('image/') && f.size <= MAX_ORIGINAL_BYTES);
    const available = MAX_IMAGES - images.length;
    const accepted = valid.slice(0, Math.max(available, 0));

    if (valid.length < files.length) {
      setError('Algunas imágenes se omitieron: solo se aceptan imágenes de hasta 20 MB.');
    } else if (valid.length > accepted.length) {
      setError(`Máximo ${MAX_IMAGES} imágenes por ticket.`);
    } else {
      setError(null);
    }

    setImages((prev) => [
      ...prev,
      ...accepted.map((file) => ({ id: nextId.current++, file, url: URL.createObjectURL(file) })),
    ]);
  };

  const removeImage = (id: number) => {
    setImages((prev) => {
      const target = prev.find((image) => image.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((image) => image.id !== id);
    });
  };

  const handleAnalyze = async () => {
    if (images.length === 0) return;
    setError(null);
    setStep('analyzing');

    try {
      const body = new FormData();
      for (const image of images) {
        body.append('image', await compressImage(image.file), `ticket-${image.id}.jpg`);
      }

      const response = await fetch('/api/tickets/extract', { method: 'POST', body });
      const result = (await response.json()) as ExtractResult;

      if (result.ok) {
        setExtracted(result.ticket);
        setFormKey((k) => k + 1);
        setStep('review');
      } else {
        setError(result.error);
        setStep('select');
      }
    } catch {
      setError('No se pudo analizar las imágenes. Puedes completar el ticket manualmente.');
      setStep('select');
    }
  };

  const startManual = () => {
    setExtracted(null);
    setFormKey((k) => k + 1);
    setStep('review');
  };

  const thumbnails = (removable: boolean) => (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {images.map((image, index) => (
        <div key={image.id} className="relative flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.url} alt={`Captura ${index + 1}`} className="h-28 w-auto rounded-lg border border-gray-200 object-cover" />
          {removable && (
            <button type="button" aria-label={`Quitar captura ${index + 1}`}
              onClick={() => removeImage(image.id)}
              className="absolute -right-1 -top-1 rounded-full bg-gray-800 p-1 text-white">
              <X size={12} />
            </button>
          )}
        </div>
      ))}
    </div>
  );

  if (step === 'review') {
    return (
      <div className="space-y-4">
        {images.length > 0 && <Card>{thumbnails(false)}</Card>}
        {extracted && (
          <Card className="border border-yellow-200 bg-yellow-50">
            <p className="text-sm text-gray-800">
              Se leyeron {extracted.selections.length} selecciones. Revisa cada dato con tu captura antes de guardar:
              la lectura automática puede equivocarse.
            </p>
          </Card>
        )}
        <TicketForm key={formKey} markets={markets} initialValues={extracted} onReset={reset} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        {step === 'analyzing' ? (
          <div className="text-center">
            <div className="mb-4">{thumbnails(false)}</div>
            <Loader2 className="mx-auto mb-2 animate-spin text-primary-600" size={32} />
            <p className="text-sm text-gray-700">Leyendo tu ticket...</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary-50">
              <Camera className="text-primary-600" size={36} />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Sube las capturas de tu ticket</h3>
            <p className="mb-4 text-sm text-gray-600">
              Si tu ticket es largo y lo capturaste en varias partes, sube todas las imágenes (hasta {MAX_IMAGES}).
              Las selecciones repetidas se unen automáticamente.
            </p>

            {error && (
              <div role="alert" className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-left text-sm text-red-700">
                <AlertTriangle className="mt-0.5 flex-shrink-0" size={16} />
                <span>{error}</span>
              </div>
            )}

            {images.length > 0 && <div className="mb-4 text-left">{thumbnails(true)}</div>}

            {images.length < MAX_IMAGES && (
              <div className="mb-3 space-y-3">
                <label className="block cursor-pointer">
                  <input type="file" accept="image/*" capture="environment" onChange={handleFiles} className="hidden" />
                  <span className="inline-flex w-full items-center justify-center rounded-lg border-2 border-primary-600 px-4 py-2 text-base font-medium text-primary-600 hover:bg-primary-50">
                    <Camera className="mr-2" size={20} />
                    Tomar foto
                  </span>
                </label>
                <label className="block cursor-pointer">
                  <input type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
                  <span className="inline-flex w-full items-center justify-center rounded-lg border-2 border-primary-600 px-4 py-2 text-base font-medium text-primary-600 hover:bg-primary-50">
                    <Upload className="mr-2" size={20} />
                    {images.length > 0 ? 'Agregar más desde galería' : 'Seleccionar de galería'}
                  </span>
                </label>
              </div>
            )}

            {images.length > 0 && (
              <Button fullWidth onClick={handleAnalyze}>
                Analizar ticket ({images.length} {images.length === 1 ? 'imagen' : 'imágenes'})
              </Button>
            )}

            <button type="button" onClick={startManual}
              className="mt-3 text-sm font-medium text-gray-600 underline hover:text-gray-900">
              Prefiero completarlo manualmente
            </button>
          </div>
        )}
      </Card>

      <Card className="border border-blue-200 bg-blue-50">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 text-blue-600" size={20} />
          <div>
            <h4 className="mb-1 font-medium text-gray-900">Tu privacidad</h4>
            <p className="text-sm text-gray-700">
              Para leer el ticket, las imágenes se envían a un servicio externo de IA (Google Gemini).
              Nosotros no las guardamos. Evita subir capturas con datos personales como tu nombre completo o documento.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <h4 className="mb-3 font-semibold text-gray-900">¿Cómo funciona?</h4>
        <ol className="space-y-2 text-sm text-gray-700">
          <li>1. Toma o selecciona las capturas de tu ticket.</li>
          <li>2. La aplicación lee los datos y une las capturas en un solo ticket.</li>
          <li>3. Confirma o corrige la información antes de guardar.</li>
          <li>4. Empieza el seguimiento de tus selecciones.</li>
        </ol>
      </Card>
    </div>
  );
};
