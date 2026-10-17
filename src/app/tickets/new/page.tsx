import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { TicketUploadFlow } from '@/components/ticket/TicketUploadFlow';
import type { MarketOption } from '@/components/ticket/TicketForm';
import { createClient } from '@/lib/supabase/server';

export default async function NewTicketPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('markets')
    .select('id, canonical_name_es, requires_player')
    .eq('is_active', true)
    .order('canonical_name_es');

  const markets: MarketOption[] = (data ?? []).map((m) => ({
    id: m.id as string,
    name: m.canonical_name_es as string,
    requiresPlayer: Boolean(m.requires_player),
  }));

  return (
    <main>
      <Header title="Nuevo Ticket" subtitle="Sube una captura de tu ticket de apuesta" />
      <div className="p-4">
        {error || markets.length === 0 ? (
          <Card>
            <p className="text-sm text-red-600">
              No se pudieron cargar los mercados. Inténtalo de nuevo más tarde.
            </p>
          </Card>
        ) : (
          <TicketUploadFlow markets={markets} />
        )}
      </div>
    </main>
  );
}
