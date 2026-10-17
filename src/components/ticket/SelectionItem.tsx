import React from 'react';
import type { TicketSelection } from '@/types';
import { StatusBadge } from './StatusBadge';

type SelectionItemProps = {
  selection: TicketSelection;
  showMatch?: boolean;
};

export const SelectionItem: React.FC<SelectionItemProps> = ({
  selection,
  showMatch = true,
}) => {
  const { match, market, selection: selectionText, odds, status, progress, player } = selection;

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
      {/* Partido */}
      {showMatch && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <div className="font-semibold text-gray-900">
              {match.homeTeam.shortName} vs {match.awayTeam.shortName}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {match.competition}
              {match.status === 'live' && match.currentMinute && (
                <span className="ml-2 text-blue-600 font-medium">
                  {match.currentMinute}&apos;
                </span>
              )}
            </div>
          </div>
          {match.status === 'live' && match.homeScore !== undefined && (
            <div className="text-lg font-bold text-gray-900 ml-3">
              {match.homeScore} - {match.awayScore}
            </div>
          )}
        </div>
      )}

      {/* Mercado y selección */}
      <div className="mb-2">
        <div className="text-sm text-gray-600">{market.name}</div>
        <div className="font-medium text-gray-900 mt-0.5">
          {selectionText}
          {player && <span className="ml-1">({player.name})</span>}
        </div>
      </div>

      {/* Progreso */}
      {progress && (
        <div className="mb-3 p-2 bg-gray-50 rounded">
          <div className="text-sm text-gray-700">{progress.message}</div>
          {progress.isOnTrack && status !== 'target_reached' && (
            <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 transition-all"
                style={{
                  width: `${(progress.current / progress.target) * 100}%`,
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Estado y cuota */}
      <div className="flex items-center justify-between">
        <StatusBadge status={status} size="sm" />
        <div className="text-sm">
          <span className="text-gray-600">Cuota:</span>
          <span className="ml-1 font-bold text-gray-900">{odds.toFixed(2)}</span>
        </div>
      </div>

      {status !== 'upcoming' && (
        <p className="mt-2 text-xs text-gray-500">
          Estado estimado. La liquidación oficial la define tu casa de apuestas.
        </p>
      )}
    </div>
  );
};
