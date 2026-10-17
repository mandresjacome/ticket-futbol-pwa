import React from 'react';
import Link from 'next/link';
import type { Ticket } from '@/types';
import { Card } from '@/components/ui/Card';
import { ChevronRight, Calendar } from 'lucide-react';

type TicketCardProps = {
  ticket: Ticket;
};

export const TicketCard: React.FC<TicketCardProps> = ({ ticket }) => {
  // Calcular resumen de selecciones
  const selectionsReached = ticket.selections.filter(
    (s) => s.status === 'target_reached'
  ).length;
  const selectionsLive = ticket.selections.filter(
    (s) => s.status === 'live_tracking' || s.status === 'currently_winning'
  ).length;
  const selectionsPending = ticket.selections.filter(
    (s) => s.status === 'upcoming'
  ).length;

  // Determinar si hay partido en vivo
  const hasLiveMatch = ticket.selections.some(
    (s) => s.match.status === 'live'
  );

  // Obtener el primer partido en vivo si existe
  const liveSelection = ticket.selections.find(
    (s) => s.match.status === 'live'
  );

  // Formatear fecha
  const dateFormatter = new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Bogota',
  });

  return (
    <Link href={`/tickets/${ticket.id}`}>
      <Card hoverable className="mb-4">
        {/* Encabezado */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  ticket.status === 'live'
                    ? 'bg-blue-500 animate-pulse'
                    : ticket.status === 'pending'
                    ? 'bg-gray-400'
                    : ticket.status === 'won'
                    ? 'bg-green-500'
                    : 'bg-red-500'
                }`}
              />
              <span className="font-semibold text-gray-900">
                {ticket.type === 'parlay'
                  ? 'Parlay'
                  : ticket.type === 'single'
                  ? 'Sencilla'
                  : 'Sistema'}
                {' · '}
                {ticket.selections.length}{' '}
                {ticket.selections.length === 1 ? 'selección' : 'selecciones'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
              <Calendar size={12} />
              {dateFormatter.format(ticket.createdAt)}
            </div>
          </div>
          <ChevronRight className="text-gray-400" size={20} />
        </div>

        {/* Partido en vivo */}
        {hasLiveMatch && liveSelection && (
          <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {liveSelection.match.homeTeam.shortName} vs{' '}
                  {liveSelection.match.awayTeam.shortName}
                </div>
                <div className="text-xs text-gray-600 mt-0.5">
                  {liveSelection.match.competition}
                </div>
              </div>
              <div className="text-right ml-3">
                <div className="text-lg font-bold text-gray-900">
                  {liveSelection.match.homeScore} -{' '}
                  {liveSelection.match.awayScore}
                </div>
                <div className="text-xs text-blue-600 font-medium">
                  {liveSelection.match.currentMinute}&apos;
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resumen de selecciones */}
        <div className="flex items-center gap-3 text-sm mb-3">
          {selectionsReached > 0 && (
            <div className="text-green-600 font-medium">
              {selectionsReached} cumplida{selectionsReached !== 1 && 's'}
            </div>
          )}
          {selectionsLive > 0 && (
            <div className="text-blue-600 font-medium">
              {selectionsLive} en juego
            </div>
          )}
          {selectionsPending > 0 && (
            <div className="text-gray-600 font-medium">
              {selectionsPending} pendiente{selectionsPending !== 1 && 's'}
            </div>
          )}
        </div>

        {/* Información financiera */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <div className="text-xs text-gray-600">Apostado</div>
            <div className="text-sm font-semibold text-gray-900">
              ${ticket.stake.toLocaleString('es-CO')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600">Cuota total</div>
            <div className="text-sm font-bold text-primary-600">
              {ticket.totalOdds.toFixed(2)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-600">Posible ganancia</div>
            <div className="text-sm font-semibold text-green-600">
              ${ticket.potentialWin.toLocaleString('es-CO')}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};
