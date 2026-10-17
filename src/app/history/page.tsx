import React from 'react';
import { Header } from '@/components/layout/Header';
import { TicketCard } from '@/components/ticket/TicketCard';
import { LiveRefresher } from '@/components/ticket/LiveRefresher';
import { Card } from '@/components/ui/Card';
import { getUserTickets } from '@/lib/tickets/queries';
import { Clock, TrendingUp, TrendingDown, Activity } from 'lucide-react';

const formatMoney = (value: number) => value.toLocaleString('es-CO');

export default async function HistoryPage() {
  const tickets = await getUserTickets();

  const liveTickets = tickets.filter((t) => t.status === 'live');
  const pendingTickets = tickets.filter((t) => t.status === 'pending');
  const wonTickets = tickets.filter((t) => t.status === 'won');
  const lostTickets = tickets.filter((t) => t.status === 'lost');

  const totalStaked = tickets.reduce((sum, t) => sum + t.stake, 0);
  const totalWon = wonTickets.reduce((sum, t) => sum + t.potentialWin, 0);
  const winRate =
    wonTickets.length + lostTickets.length > 0
      ? (wonTickets.length / (wonTickets.length + lostTickets.length)) * 100
      : 0;

  const sections = [
    { title: 'En vivo', items: liveTickets },
    { title: 'Pendientes', items: pendingTickets },
    { title: 'Ganados', items: wonTickets },
    { title: 'Perdidos', items: lostTickets },
  ];

  return (
    <main>
      <LiveRefresher />
      <Header title="Historial" subtitle="Todos tus tickets" />

      <div className="p-4">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="text-center p-3">
            <Activity className="mx-auto mb-1 text-primary-600" size={20} />
            <div className="text-lg font-bold text-gray-900">{tickets.length}</div>
            <div className="text-xs text-gray-600">Total</div>
          </Card>

          <Card className="text-center p-3">
            <TrendingUp className="mx-auto mb-1 text-green-600" size={20} />
            <div className="text-lg font-bold text-green-600">{wonTickets.length}</div>
            <div className="text-xs text-gray-600">Ganados</div>
          </Card>

          <Card className="text-center p-3">
            <TrendingDown className="mx-auto mb-1 text-red-600" size={20} />
            <div className="text-lg font-bold text-red-600">{lostTickets.length}</div>
            <div className="text-xs text-gray-600">Perdidos</div>
          </Card>
        </div>

        <Card className="mb-6 bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Total registrado</span>
              <span className="font-bold text-gray-900">${formatMoney(totalStaked)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Total ganado</span>
              <span className="font-bold text-green-600">${formatMoney(totalWon)}</span>
            </div>
            <div className="pt-2 border-t border-primary-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Tasa de acierto</span>
                <span className="font-bold text-primary-700">{winRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </Card>

        {sections.map(
          (section) =>
            section.items.length > 0 && (
              <div key={section.title} className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {section.title} ({section.items.length})
                </h3>
                {section.items.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))}
              </div>
            )
        )}

        {tickets.length === 0 && (
          <Card className="text-center py-8">
            <Clock className="mx-auto mb-3 text-gray-400" size={48} />
            <p className="text-gray-600">Aún no tienes tickets registrados</p>
          </Card>
        )}

        <p className="text-center text-xs text-gray-500">
          Los estados son estimados. La liquidación oficial corresponde a tu casa de apuestas.
        </p>
      </div>
    </main>
  );
}
