import React from 'react';
import { Header } from '@/components/layout/Header';
import { TicketCard } from '@/components/ticket/TicketCard';
import { Button } from '@/components/ui/Button';
import { mockTickets, mockTicketSummary } from '@/lib/mock-data';
import { TrendingUp, Activity } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  // Obtener tickets activos (live y pending)
  const activeTickets = mockTickets.filter(
    (ticket) => ticket.status === 'live' || ticket.status === 'pending'
  );

  return (
    <main>
      <Header title="Inicio" subtitle="Tus tickets activos" />

      <div className="p-4">
        {/* Tarjeta de bienvenida */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-lg p-6 text-white mb-6">
          <h2 className="text-2xl font-bold mb-2">¡Bienvenido! ⚽</h2>
          <p className="text-primary-100 text-sm">
            Sigue tus tickets en tiempo real y recibe alertas importantes.
          </p>
        </div>

        {/* Resumen general */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="text-primary-600" size={20} />
              <span className="text-sm text-gray-600">Tickets activos</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {mockTicketSummary.live + mockTicketSummary.pending}
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-green-600" size={20} />
              <span className="text-sm text-gray-600">Ganados</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {mockTicketSummary.won}
            </div>
          </div>
        </div>

        {/* Lista de tickets activos */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Tickets en juego
          </h3>

          {activeTickets.length > 0 ? (
            <div>
              {activeTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg p-8 text-center shadow-sm">
              <div className="text-gray-400 mb-3">
                <Activity size={48} className="mx-auto" />
              </div>
              <p className="text-gray-600 mb-4">
                No tienes tickets activos en este momento
              </p>
              <Link href="/tickets/new">
                <Button>Subir nuevo ticket</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Aclaración legal */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-gray-700">
          <p className="font-medium mb-1">📋 Importante</p>
          <p className="text-xs">
            El seguimiento es informativo. La liquidación oficial del ticket
            corresponde exclusivamente a la casa de apuestas.
          </p>
        </div>
      </div>
    </main>
  );
}
