import React from 'react';
import type { SelectionStatus } from '@/types';
import {
  Clock,
  Play,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Flag,
  Ban,
  AlertCircle,
} from 'lucide-react';

type StatusBadgeProps = {
  status: SelectionStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md';
};

const statusConfig: Record<
  SelectionStatus,
  {
    label: string;
    color: string;
    bgColor: string;
    icon: React.ElementType;
  }
> = {
  upcoming: {
    label: 'Próxima',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: Clock,
  },
  live_tracking: {
    label: 'En juego',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: Play,
  },
  currently_winning: {
    label: 'Se está cumpliendo',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: TrendingUp,
  },
  target_reached: {
    label: 'Objetivo alcanzado',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: CheckCircle2,
  },
  lost: {
    label: 'Perdida',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: XCircle,
  },
  finished: {
    label: 'Finalizada',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: Flag,
  },
  void: {
    label: 'Anulada',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    icon: Ban,
  },
  needs_review: {
    label: 'Requiere revisión',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: AlertCircle,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showIcon = true,
  size = 'md',
}) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeStyles = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
  };

  const iconSize = size === 'sm' ? 14 : 16;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.color} ${config.bgColor} ${sizeStyles[size]}`}
    >
      {showIcon && <Icon size={iconSize} />}
      {config.label}
    </span>
  );
};
