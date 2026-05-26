import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '@/components/AdminHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const S20_URL = 'https://functions.poehali.dev/6d9e6094-fd18-47ec-b45f-ad3ee4ba7cc2';

interface Lesson {
  id: number;
  date: string;
  time_from: string;
  time_to: string;
  room?: string;
  group_ids?: number[];
  teacher_ids?: (string | number)[];
  status?: number;
  subject_id?: number;
  note?: string;
  type_id?: number;
}

interface Group {
  id: number;
  name: string;
  teacher_ids?: string[];
  b_date?: string;
  e_date?: string;
}

const STATUS_LABELS: Record<number, string> = {
  1: 'Запланировано',
  2: 'Проведено',
  3: 'Отменено',
};

const STATUS_COLORS: Record<number, string> = {
  1: 'bg-blue-100 text-blue-700',
  2: 'bg-green-100 text-green-700',
  3: 'bg-red-100 text-red-700',
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTime(t: string): string {
  return t ? t.slice(0, 5) : '';
}

const SchedulePage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'lessons' | 'groups'>('lessons');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 13);
    return d.toISOString().slice(0, 10);
  });

  const loadLessons = async () => {
    setLoading(true);
    setError('');
    try {
      const resp = await fetch(`${S20_URL}?date_from=${dateFrom}&date_to=${dateTo}`);
      const data = await resp.json();
      setLessons(data.lessons || []);
    } catch {
      setError('Не удалось загрузить расписание');
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    setLoading(true);
    setError('');
    try {
      const resp = await fetch(`${S20_URL}?mode=groups`);
      const data = await resp.json();
      setGroups(data.groups || []);
    } catch {
      setError('Не удалось загрузить группы');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'lessons') loadLessons();
    else loadGroups();
  }, [tab]);

  const groupedLessons = lessons.reduce<Record<string, Lesson[]>>((acc, l) => {
    const key = l.date || 'Без даты';
    if (!acc[key]) acc[key] = [];
    acc[key].push(l);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedLessons).sort();

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <AdminHeader showOnlyHome />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigate('/admin')} className="text-gray-500 hover:text-gray-800">
              <Icon name="ArrowLeft" size={20} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Расписание</h1>
          </div>

          <div className="flex gap-2 mb-6">
            <Button
              variant={tab === 'lessons' ? 'default' : 'outline'}
              onClick={() => setTab('lessons')}
              className="gap-2"
            >
              <Icon name="Calendar" size={16} />
              Занятия
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

          {tab === 'lessons' && (
            <div className="flex flex-wrap gap-3 mb-6 items-end">
              <div>
                <label className="text-xs text-gray-500 block mb-1">С</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="border rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">По</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="border rounded px-3 py-2 text-sm"
                />
              </div>
              <Button onClick={loadLessons} className="gap-2">
                <Icon name="RefreshCw" size={16} />
                Обновить
              </Button>
            </div>
          )}

          {loading && (
            <div className="text-center py-12 text-gray-500">
              <Icon name="Loader2" size={32} className="animate-spin mx-auto mb-3" />
              Загрузка из S20...
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-4">
              {error}
            </div>
          )}

          {!loading && tab === 'lessons' && (
            <>
              {sortedDates.length === 0 && !error && (
                <div className="text-center py-12 text-gray-400">
                  Занятий за выбранный период нет
                </div>
              )}
              {sortedDates.map(date => (
                <div key={date} className="mb-6">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    {formatDate(date)}
                  </h2>
                  <div className="space-y-2">
                    {groupedLessons[date]
                      .sort((a, b) => (a.time_from || '').localeCompare(b.time_from || ''))
                      .map(lesson => (
                        <Card key={lesson.id} className="border border-gray-200">
                          <CardContent className="py-3 px-4 flex items-center gap-4">
                            <div className="text-lg font-bold text-gray-800 w-24 shrink-0">
                              {formatTime(lesson.time_from)}
                              {lesson.time_to && (
                                <span className="text-sm font-normal text-gray-400 ml-1">
                                  — {formatTime(lesson.time_to)}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              {lesson.note && (
                                <div className="text-sm text-gray-700 truncate">{lesson.note}</div>
                              )}
                              {lesson.room && (
                                <div className="text-xs text-gray-400">{lesson.room}</div>
                              )}
                            </div>
                            {lesson.status !== undefined && (
                              <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${STATUS_COLORS[lesson.status] || 'bg-gray-100 text-gray-600'}`}>
                                {STATUS_LABELS[lesson.status] || `Статус ${lesson.status}`}
                              </span>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              ))}
            </>
          )}

          {!loading && tab === 'groups' && (
            <>
              {groups.length === 0 && !error && (
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