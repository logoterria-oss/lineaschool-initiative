import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const S20_URL = 'https://functions.poehali.dev/6d9e6094-fd18-47ec-b45f-ad3ee4ba7cc2';

// ── Индивидуальные ────────────────────────────────────────────────────────────

interface Slot {
  date: string;
  weekday: number;
  weekday_name: string;
  time_from: string;
  time_to: string;
  teacher_id: number;
  teacher_name: string;
}

interface DayGroup {
  weekday: number;
  weekday_name: string;
  slots: Slot[];
}

const TEACHER_SHORT: Record<number, string> = {
  2: 'Анастасия',
  18: 'Анна',
  11: 'Валерия',
  4: 'Дарья',
};

const TEACHER_COLOR: Record<number, string> = {
  2: 'bg-purple-100 text-purple-700 border-purple-200',
  18: 'bg-teal-100 text-teal-700 border-teal-200',
  11: 'bg-green-100 text-green-700 border-green-200',
  4: 'bg-orange-100 text-orange-700 border-orange-200',
};

// ── Группы ────────────────────────────────────────────────────────────────────

interface Group {
  id: number;
  name: string;
  teacher_ids?: string[];
  b_date?: string;
  e_date?: string;
}

// ─────────────────────────────────────────────────────────────────────────────

const SchedulePage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'individual' | 'groups'>('individual');

  // Индивидуальные — свободные слоты
  const [days, setDays] = useState<DayGroup[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState('');

  // Группы
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState('');

  const loadSlots = async () => {
    setSlotsLoading(true);
    setSlotsError('');
    try {
      const resp = await fetch(`${S20_URL}?mode=free_slots`);
      const data = await resp.json();
      setDays(data.slots_by_weekday || []);
    } catch {
      setSlotsError('Не удалось загрузить свободные окна');
    } finally {
      setSlotsLoading(false);
    }
  };

  const loadGroups = async () => {
    setGroupsLoading(true);
    setGroupsError('');
    try {
      const resp = await fetch(`${S20_URL}?mode=groups`);
      const data = await resp.json();
      setGroups(data.groups || []);
    } catch {
      setGroupsError('Не удалось загрузить группы');
    } finally {
      setGroupsLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'individual') loadSlots();
    else loadGroups();
  }, [tab]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <AdminHeader showOnlyHome />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">

          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigate('/admin')} className="text-gray-500 hover:text-gray-800">
              <Icon name="ArrowLeft" size={20} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Расписание (S20)</h1>
          </div>

          {/* Табы */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={tab === 'individual' ? 'default' : 'outline'}
              onClick={() => setTab('individual')}
              className="gap-2"
            >
              <Icon name="User" size={16} />
              Индивидуальные
            </Button>
            <Button
              variant={tab === 'groups' ? 'default' : 'outline'}
              onClick={() => setTab('groups')}
              className="gap-2"
            >
              <Icon name="Users" size={16} />
              Группы
            </Button>
          </div>

          {/* ── Таб: Индивидуальные ── */}
          {tab === 'individual' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  Свободные окна по графику педагогов на ближайшие 4 недели
                </p>
                <Button variant="outline" size="sm" onClick={loadSlots} className="gap-1.5">
                  <Icon name="RefreshCw" size={14} />
                  Обновить
                </Button>
              </div>

              {slotsLoading && (
                <div className="text-center py-12 text-gray-500">
                  <Icon name="Loader2" size={32} className="animate-spin mx-auto mb-3" />
                  Загрузка из S20…
                </div>
              )}

              {slotsError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-4">
                  {slotsError}
                </div>
              )}

              {!slotsLoading && !slotsError && days.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Icon name="CalendarOff" size={36} className="mx-auto mb-3" />
                  Свободных окон нет
                </div>
              )}

              {!slotsLoading && days.length > 0 && (
                <>
                  {/* Легенда */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {Object.entries(TEACHER_SHORT).map(([id, name]) => (
                      <span
                        key={id}
                        className={`text-xs font-medium px-3 py-1 rounded-full border ${TEACHER_COLOR[Number(id)]}`}
                      >
                        {name}
                      </span>
                    ))}
                  </div>

                  {/* Карточки по дням */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {days.map((day) => {
                      const byTime: Record<string, Slot[]> = {};
                      day.slots.forEach((s) => {
                        const key = `${s.time_from}–${s.time_to}`;
                        if (!byTime[key]) byTime[key] = [];
                        byTime[key].push(s);
                      });

                      return (
                        <div
                          key={day.weekday}
                          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                        >
                          <div className="bg-teal-600 px-4 py-2.5 flex items-center gap-2">
                            <Icon name="CalendarDays" size={15} className="text-teal-100" />
                            <span className="font-semibold text-white text-sm">{day.weekday_name}</span>
                            <span className="ml-auto text-teal-200 text-xs">
                              {Object.keys(byTime).length} окон
                            </span>
                          </div>
                          <div className="p-3 space-y-1.5">
                            {Object.entries(byTime)
                              .sort(([a], [b]) => a.localeCompare(b))
                              .map(([timeKey, slots]) => (
                                <div
                                  key={timeKey}
                                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                                >
                                  <span className="font-mono font-semibold text-gray-800 text-sm">
                                    {timeKey}
                                  </span>
                                  <div className="flex flex-wrap gap-1 justify-end">
                                    {slots.map((s) => (
                                      <span
                                        key={s.teacher_id}
                                        className={`text-xs font-medium px-2 py-0.5 rounded-full border ${TEACHER_COLOR[s.teacher_id] || 'bg-gray-100 text-gray-600 border-gray-200'}`}
                                      >
                                        {TEACHER_SHORT[s.teacher_id] || s.teacher_name.split(' ')[0]}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}

          {/* ── Таб: Группы ── */}
          {tab === 'groups' && (
            <>
              {groupsLoading && (
                <div className="text-center py-12 text-gray-500">
                  <Icon name="Loader2" size={32} className="animate-spin mx-auto mb-3" />
                  Загрузка из S20…
                </div>
              )}
              {groupsError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-4">
                  {groupsError}
                </div>
              )}
              {!groupsLoading && groups.length === 0 && !groupsError && (
                <div className="text-center py-12 text-gray-400">Групп не найдено</div>
              )}
              <div className="space-y-3">
                {groups.map(group => (
                  <Card key={group.id} className="border border-gray-200">
                    <CardContent className="py-3 px-4 flex items-center gap-4">
                      <div className="p-2 bg-green-100 rounded-lg shrink-0">
                        <Icon name="Users" size={18} className="text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800">{group.name}</div>
                        {group.teacher_ids && group.teacher_ids.length > 0 && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            {group.teacher_ids.join(', ')}
                          </div>
                        )}
                      </div>
                      {group.b_date && group.e_date && (
                        <div className="text-xs text-gray-400 shrink-0 text-right">
                          {group.b_date} — {group.e_date}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default SchedulePage;
