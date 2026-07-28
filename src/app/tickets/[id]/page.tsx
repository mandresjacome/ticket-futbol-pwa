'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { SelectionItem } from '@/components/ticket/SelectionItem';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getTicketById } from '@/lib/mock-data';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const ticket = getTicketById(ticketId);

  if (!ticket) {
    return (
      <main>
        <Header title="Ticket no encontrado" />
        <div className="p-4">
          <Card className="text-center py-8">
            <AlertCircle className="mx-auto mb-3 text-gray-400" size={48} />
            <p className="text-gray-600 mb-4">
              No se encontró el ticket solicitado
            </p>
            <Button onClick={() => router.push('/')}>Volver al inicio</Button>
          </Card>
        </div>
      </main>
    );
  }

  const dateFormatter = new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <main>
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-primary-600 mb-3 hover:text-primary-700"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Volver</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          Ticket #{ticketId.split('_')[1]}
        </h1>
      </div>

      <div className="p-4">
        {/* Información general del ticket */}
        <Card className="mb-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Calendar className="text-gray-400" size={18} />
                <span className="text-sm text-gray-600">Creado</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {dateFormatter.format(ticket.createdAt)}
              </span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <DollarSign className="text-gray-400" size={18} />
                <span className="text-sm text-gray-600">Apostado</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                ${ticket.stake.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-gray-400" size={18} />
                <span className="text-sm text-gray-600">Cuota total</span>
              </div>
              <span className="text-sm font-bold text-primary-600">
                {ticket.totalOdds.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-gray-400" size={18} />
                <span className="text-sm text-gray-600">Posible ganancia</span>
              </div>
              <span className="text-lg font-bold text-green-600">
                ${ticket.potentialWin.toLocaleString()}
              </span>
            </div>
          </div>
        </Card>

        {/* Selecciones */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Selecciones ({ticket.selections.length})
          </h3>
          <div className="space-y-3">
            {ticket.selections.map((selection) => (
              <SelectionItem key={selection.id} selection={selection} />
            ))}
          </div>
        </div>

        {/* Información de la casa de apuestas */}
        {ticket.bookmaker && (
          <Card className="mb-4 bg-gray-50">
            <div className="text-sm">
              <span className="text-gray-600">Casa de apuestas: </span>
              <span className="font-medium text-gray-900">
                {ticket.bookmaker}
              </span>
            </div>
          </Card>
        )}

        {/* Aclaración legal */}
        <Card className="bg-yellow-50 border border-yellow-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="text-yellow-600 mt-0.5 flex-shrink-0" size={20} />
            <div className="text-xs text-gray-700">
              <p className="font-medium mb-1">Aviso importante</p>
              <p>
                El seguimiento mostrado es informativo y se basa en estadísticas
                deportivas públicas. La liquidación oficial del ticket
                corresponde exclusivamente a la casa de apuestas.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
