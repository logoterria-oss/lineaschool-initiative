import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

const API = 'https://functions.poehali.dev/903d39bc-07b8-462d-92da-a1922db341aa';

interface TrashItem {
  id: number;
  student_name: string;
  date_of_examination: string | null;
  therapist_name: string;
  diag_type: string;
  archived_at: string | null;
  archived_by: string;
}

const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString('ru-RU') : '—');

export default function ReportsTrash({ onRestored }: { onRestored: () => void }) {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    fetch(`${API}?archived=1`, {
      headers: { 'X-Admin-Password': sessionStorage.getItem('admin_password') || '' },
    })
      .then((r) => r.json())
      .then((d) => setItems(d?.success ? d.reports || [] : []))
      .catch(() => setError('Не удалось загрузить корзину'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const restore = async (id: number) => {
    setBusyId(id);
    setError('');
    try {
      const res = await fetch(`${API}?id=${id}`, {
        method: 'POST',
        headers: {
          'X-Admin-Password': sessionStorage.getItem('admin_password') || '',
          'X-Auth-Token': localStorage.getItem('staff_token') || '',
        },
      });
      const d = await res.json().catch(() => null);
      if (res.ok && d?.success) {
        load();
        onRestored();
      } else {
        setError(d?.error || 'Не удалось восстановить');
      }
    } catch {
      setError('Ошибка связи с сервером');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <p className="py-6 text-center text-sm text-gray-500">Загрузка корзины…</p>;
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <p className="text-sm text-gray-600">
        Удалённые заключения хранятся здесь и не пропадают. Любое можно вернуть в общий список.
      </p>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Icon name="Trash2" size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">Корзина пуста</p>
          </CardContent>
        </Card>
      ) : (
        items.map((it) => (
          <Card key={it.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-gray-900">{it.student_name}</span>
                  <Badge
                    className={
                      it.diag_type === 'interim'
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                    }
                  >
                    {it.diag_type === 'interim' ? 'Промежуточная' : 'Первичная'}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Диагностика {fmt(it.date_of_examination)} · логопед {it.therapist_name || '—'}
                </p>
                <p className="text-xs text-gray-400">
                  Удалено {fmt(it.archived_at)}
                  {it.archived_by ? ` · ${it.archived_by}` : ''}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={busyId === it.id}
                onClick={() => restore(it.id)}
              >
                <Icon name="RotateCcw" size={14} className="mr-1" />
                {busyId === it.id ? 'Восстановление…' : 'Восстановить'}
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
