import React from 'react';
import { Header } from '@/components/layout/Header';
import { TicketCard } from '@/components/ticket/TicketCard';
import { Card } from '@/components/ui/Card';
import { mockTickets } from '@/lib/mock-data';
import { Clock, TrendingUp, TrendingDown, Activity } from 'lucide-react';

export default function HistoryPage() {
  // Agrupar tickets por estado
  const liveTickets = mockTickets.filter((t) => t.status === 'live');
  const pendingTickets = mockTickets.filter((t) => t.status === 'pending');
  const wonTickets = mockTickets.filter((t) => t.status === 'won');
  const lostTickets = mockTickets.filter((t) => t.status === 'lost');

  // Calcular estadísticas
  const totalStaked = mockTickets.reduce((sum, t) => sum + t.stake, 0);
  const totalWon = wonTickets.reduce((sum, t) => sum + t.potentialWin, 0);
  const winRate =
    wonTickets.length + lostTickets.length > 0
      ? (wonTickets.length / (wonTickets.length + lostTickets.length)) * 100
      : 0;

  return (
    <main>
      <Header title="Historial" subtitle="Todos tus tickets" />

      <div className="p-4">
        {/* Estadísticas generales */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="text-center p-3">
            <Activity className="mx-auto mb-1 text-primary-600" size={20} />
            <div className="text-lg font-bold text-gray-900">
              {mockTickets.length}
            </div>
            <div className="text-xs text-gray-600">Total</div>
          </Card>

          <Card className="text-center p-3">
            <TrendingUp className="mx-auto mb-1 text-green-600" size={20} />
            <div className="text-lg font-bold text-green-600">
              {wonTickets.length}
            </div>
            <div className="text-xs text-gray-600">Ganados</div>
          </Card>

          <Card className="text-center p-3">
            <TrendingDown className="mx-auto mb-1 text-red-600" size={20} />
            <div className="text-lg font-bold text-red-600">
              {lostTickets.length}
            </div>
            <div className="text-xs text-gray-600">Perdidos</div>
          </Card>
        </div>

        {/* Resumen financiero */}
        <Card className="mb-6 bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Total apostado</span>
              <span className="font-bold text-gray-900">
                ${totalStaked.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Total ganado</span>
              <span className="font-bold text-green-600">
                ${totalWon.toLocaleString()}
              </span>
            </div>
            <div className="pt-2 border-t border-primary-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Tasa de éxito</span>
                <span className="font-bold text-primary-700">
                  {winRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Tickets en vivo */}
        {liveTickets.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              En vivo ({liveTickets.length})
            </h3>
            {liveTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}

        {/* Tickets pendientes */}
        {pendingTickets.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Pendientes ({pendingTickets.length})
            </h3>
            {pendingTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}

        {/* Tickets ganados */}
        {wonTickets.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Ganados ({wonTickets.length})
            </h3>
            {wonTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}

        {/* Tickets perdidos */}
        {lostTickets.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Perdidos ({lostTickets.length})
            </h3>
            {lostTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}

        {/* Mensaje si no hay tickets */}
        {mockTickets.length === 0 && (
          <Card className="text-center py-8">
            <Clock className="mx-auto mb-3 text-gray-400" size={48} />
            <p className="text-gray-600">Aún no tienes tickets registrados</p>
          </Card>
        )}
      </div>
    </main>
  );
}
