'use client';

import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';

type PreferenceKey =
  | 'notification_match_start'
  | 'notification_selection_reached'
  | 'notification_ticket_completed';

type Preferences = Record<PreferenceKey, boolean>;

const OPTIONS: { key: PreferenceKey; title: string; description: string }[] = [
  {
    key: 'notification_match_start',
    title: 'Partido iniciando',
    description: 'Cuando empieza un partido de tus tickets',
  },
  {
    key: 'notification_selection_reached',
    title: 'Selecciones',
    description: 'Cuando una selección se cumple o se pierde',
  },
  {
    key: 'notification_ticket_completed',
    title: 'Ticket completo',
    description: 'Cuando tu ticket va ganado o se pierde (estimado)',
  },
];

export const NotificationPreferences: React.FC = () => {
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('profiles')
      .select('notification_match_start, notification_selection_reached, notification_ticket_completed')
      .maybeSingle()
      .then(({ data, error: queryError }) => {
        if (queryError || !data) {
          setError('No se pudieron cargar tus preferencias.');
          return;
        }
        setPreferences(data as Preferences);
      });
  }, []);

  const toggle = async (key: PreferenceKey, value: boolean) => {
    if (!preferences) return;
    const previous = preferences;
    setPreferences({ ...preferences, [key]: value });
    setError(null);

    const { data: auth } = await createClient().auth.getUser();
    if (!auth.user) return;
    const { error: updateError } = await createClient()
      .from('profiles')
      .update({ [key]: value })
      .eq('id', auth.user.id);
    if (updateError) {
      setPreferences(previous);
      setError('No se pudo guardar el cambio.');
    }
  };

  return (
    <Card>
      <div className="space-y-4">
        {OPTIONS.map((option) => (
          <div key={option.key} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="text-gray-400" size={20} />
              <div>
                <div className="font-medium text-gray-900">{option.title}</div>
                <div className="text-xs text-gray-600">{option.description}</div>
              </div>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                aria-label={option.title}
                checked={preferences?.[option.key] ?? false}
                disabled={!preferences}
                onChange={(e) => toggle(option.key, e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 peer-disabled:opacity-50"></div>
            </label>
          </div>
        ))}
      </div>
      {error && <p role="alert" className="mt-3 text-xs text-red-600">{error}</p>}
    </Card>
  );
};
