import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ExtractionConfigError, extractTicketFromImage } from '@/lib/ocr/gemini';
import { resolveSelectionMatches } from '@/lib/football/resolve-matches';
import type { ExtractResult } from '@/lib/ocr/schema';

export const maxDuration = 30;

const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
// Vercel limita el cuerpo de la petición a ~4.5 MB.
const MAX_TOTAL_BYTES = 4_200_000;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function fail(error: string, status: number) {
  const body: ExtractResult = { ok: false, error };
  return NextResponse.json(body, { status });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return fail('Debes iniciar sesión.', 401);
  }

  let images: File[] = [];
  try {
    const form = await request.formData();
    images = form.getAll('image').filter((value): value is File => value instanceof File);
  } catch {
    return fail('Solicitud inválida.', 400);
  }

  if (images.length === 0 || images.some((image) => !ALLOWED_MIME_TYPES.includes(image.type))) {
    return fail('Sube imágenes JPG, PNG o WebP.', 400);
  }
  if (images.length > MAX_IMAGES) {
    return fail(`Puedes subir máximo ${MAX_IMAGES} imágenes por ticket.`, 400);
  }
  const totalBytes = images.reduce((sum, image) => sum + image.size, 0);
  if (images.some((image) => image.size === 0 || image.size > MAX_IMAGE_BYTES) || totalBytes > MAX_TOTAL_BYTES) {
    return fail('Las imágenes son demasiado pesadas. Sube menos imágenes o más livianas.', 400);
  }

  const { data: marketRows, error: marketsError } = await supabase
    .from('markets')
    .select('id, code, canonical_name_es')
    .eq('is_active', true);
  if (marketsError || !marketRows) {
    console.error('extract: markets query failed', marketsError);
    return fail('No se pudo procesar la imagen. Inténtalo de nuevo.', 500);
  }

  try {
    const encoded = await Promise.all(
      images.map(async (image) => ({
        base64: Buffer.from(await image.arrayBuffer()).toString('base64'),
        mimeType: image.type,
      }))
    );
    const ticket = await extractTicketFromImage({
      images: encoded,
      markets: marketRows.map((m) => ({
        id: m.id as string,
        code: m.code as string,
        name: m.canonical_name_es as string,
      })),
    });
    const body: ExtractResult = {
      ok: true,
      ticket: { ...ticket, selections: await resolveSelectionMatches(ticket.selections) },
    };
    return NextResponse.json(body);
  } catch (error) {
    if (error instanceof ExtractionConfigError) {
      console.error('extract: not configured', error.message);
      return fail('El análisis automático no está configurado.', 503);
    }
    console.error('extract: failed', error);
    return fail('No se pudo leer el ticket. Puedes completarlo manualmente.', 502);
  }
}
