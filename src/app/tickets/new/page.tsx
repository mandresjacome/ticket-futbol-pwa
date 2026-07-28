'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Camera, Upload, FileText, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = () => {
    // Simulación - en versión real aquí iría el OCR
    alert(
      'Función de análisis en desarrollo.\n\nEn la versión completa, aquí se extraerá automáticamente la información del ticket.'
    );
    // Por ahora redirigir a un ticket de demostración
    router.push('/ticket/ticket_1');
  };

  return (
    <main>
      <Header
        title="Nuevo Ticket"
        subtitle="Sube una captura de tu ticket de apuesta"
      />

      <div className="p-4">
        {/* Área de carga */}
        <Card className="mb-4">
          <div className="text-center">
            {!preview ? (
              <>
                <div className="w-24 h-24 mx-auto mb-4 bg-primary-50 rounded-full flex items-center justify-center">
                  <Camera className="text-primary-600" size={40} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Selecciona una imagen
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Toma una foto o selecciona una imagen de tu galería
                </p>

                <div className="space-y-3">
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button fullWidth>
                      <Camera className="mr-2" size={20} />
                      Tomar foto
                    </Button>
                  </label>

                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button variant="outline" fullWidth>
                      <Upload className="mr-2" size={20} />
                      Seleccionar de galería
                    </Button>
                  </label>
                </div>
              </>
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Preview del ticket"
                  className="w-full max-h-96 object-contain rounded-lg mb-4"
                />
                <div className="space-y-2">
                  <Button fullWidth onClick={handleAnalyze}>
                    Analizar ticket
                  </Button>
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => {
                      setPreview(null);
                    }}
                  >
                    Cambiar imagen
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Información sobre PDF */}
        <Card className="mb-4 bg-gray-50 border border-gray-200">
          <div className="flex items-start gap-3">
            <FileText className="text-gray-400 mt-0.5" size={20} />
            <div>
              <h4 className="font-medium text-gray-900 mb-1">
                Soporte de PDF
              </h4>
              <p className="text-sm text-gray-600">
                La opción de cargar archivos PDF estará disponible en una
                versión futura.
              </p>
            </div>
          </div>
        </Card>

        {/* Proceso de análisis */}
        <Card className="mb-4">
          <h4 className="font-semibold text-gray-900 mb-3">
            ¿Cómo funciona?
          </h4>
          <ol className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">
                1
              </span>
              <span>Selecciona o toma una foto clara de tu ticket</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span>
                La aplicación leerá automáticamente los datos del ticket
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span>Confirma o corrige la información antes de guardar</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">
                4
              </span>
              <span>¡Comienza el seguimiento en tiempo real!</span>
            </li>
          </ol>
        </Card>

        {/* Aviso de privacidad */}
        <Card className="bg-blue-50 border border-blue-200">
          <div className="flex items-start gap-3">
            <ShieldCheck className="text-blue-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-medium text-gray-900 mb-1">
                Tu privacidad es importante
              </h4>
              <p className="text-sm text-gray-700">
                Las imágenes de tus tickets se almacenan de forma segura y
                privada. Solo tú tienes acceso a ellas.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
