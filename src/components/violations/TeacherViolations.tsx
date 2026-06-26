import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Violation,
  fetchViolations,
  disputeViolation,
} from '@/lib/violationsApi';
import { GROUP_TEACHERS, INDIVIDUAL_TEACHERS } from '@/lib/supervisionChecklist';
import {
  MONTHS,
  QUARTERS,
  monthStart,
  monthEnd,
  PeriodMode,
} from '@/lib/supervisionPeriod';

const ALL_TEACHERS = [...INDIVIDUAL_TEACHERS, ...GROUP_TEACHERS];

const selectCls =
  'h-10 px-3 rounded-md border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-400';

const fmtDate = (d: string | null) => {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}.${m}.${y}`;
};

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const TeacherViolations = () => {
  const now = new Date();
  const [teacherId, setTeacherId] = useState<number | ''>('');
  const [periodMode, setPeriodMode] = useState<PeriodMode>('quarter');
  const [year, setYear] = useState(now.getFullYear());
  const [quarter, setQuarter] = useState(Math.floor(now.getMonth() / 3) + 1);
  const [fromMonth, setFromMonth] = useState(0);
  const [toMonth, setToMonth] = useState(now.getMonth());

  const [items, setItems] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Состояние диалога оспаривания.
  const [disputing, setDisputing] = useState<Violation | null>(null);
  const [disputeText, setDisputeText] = useState('');
  const [disputePhotos, setDisputePhotos] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const years = useMemo(() => {
    const y = now.getFullYear();
    return [y - 2, y - 1, y, y + 1];
  }, [now]);

  const period = useMemo(() => {
    if (periodMode === 'quarter') {
      const q = QUARTERS.find((x) => x.id === quarter)!;
      return { from: monthStart(year, q.from), to: monthEnd(year, q.to) };
    }
    const lo = Math.min(fromMonth, toMonth);
    const hi = Math.max(fromMonth, toMonth);
    return { from: monthStart(year, lo), to: monthEnd(year, hi) };
  }, [periodMode, quarter, fromMonth, toMonth, year]);

  const load = () => {
    if (!teacherId) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError('');
    fetchViolations({ teacher_id: teacherId, date_from: period.from, date_to: period.to })
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId, period.from, period.to]);

  const openDispute = (v: Violation) => {
    setDisputing(v);
    setDisputeText(v.dispute_comment ?? '');
    setDisputePhotos(v.dispute_photos ?? []);
  };

  const handleAddPhotos = async (files: FileList | null) => {
    if (!files) return;
    const urls = await Promise.all(Array.from(files).map(fileToDataUrl));
    setDisputePhotos((prev) => [...prev, ...urls]);
  };

  const removePhoto = (idx: number) =>
    setDisputePhotos((prev) => prev.filter((_, i) => i !== idx));

  const submitDispute = async () => {
    if (!disputing) return;
    if (!disputeText.trim() && disputePhotos.length === 0) {
      setError('Добавьте комментарий или фотографии');
      return;
    }
    setSending(true);
    try {
      await disputeViolation(disputing.id, disputeText.trim(), disputePhotos);
      setDisputing(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка отправки');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Выбор педагога */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-gray-700">Педагог</label>
        <select
          className={`${selectCls} w-full`}
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="">— выберите педагога —</option>
          {ALL_TEACHERS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Выбор периода */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
        <div className="flex gap-2">
          <button
            onClick={() => setPeriodMode('quarter')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              periodMode === 'quarter' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-red-100'
            }`}
          >
            Квартал
          </button>
          <button
            onClick={() => setPeriodMode('range')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              periodMode === 'range' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-red-100'
            }`}
          >
            Диапазон месяцев
          </button>
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Год</label>
            <select className={selectCls} value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {periodMode === 'quarter' ? (
            <div className="space-y-1 flex-1 min-w-[200px]">
              <label className="text-xs text-gray-500">Квартал</label>
              <select
                className={`${selectCls} w-full`}
                value={quarter}
                onChange={(e) => setQuarter(Number(e.target.value))}
              >
                {QUARTERS.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">С месяца</label>
                <select className={selectCls} value={fromMonth} onChange={(e) => setFromMonth(Number(e.target.value))}>
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">По месяц</label>
                <select className={selectCls} value={toMonth} onChange={(e) => setToMonth(Number(e.target.value))}>
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Список */}
      {loading ? (
        <p className="text-gray-500">Загрузка…</p>
      ) : error && !disputing ? (
        <p className="text-red-600">{error}</p>
      ) : teacherId === '' ? (
        <p className="text-gray-400 text-sm">Выберите педагога, чтобы увидеть нарушения.</p>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          За выбранный период нарушений нет
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((v) => (
            <div key={v.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm text-gray-500">{fmtDate(v.violation_date)}</div>
                  <div className="text-sm text-gray-800 mt-1">{v.violation_title}</div>
                  {v.admin_comment && (
                    <div className="text-sm text-gray-600 mt-1">Комментарий руководителя: {v.admin_comment}</div>
                  )}
                </div>
                {v.penalty && (
                  <span className="font-semibold text-red-600 whitespace-nowrap flex-shrink-0">{v.penalty}</span>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                {v.dispute_status === 'disputed' ? (
                  <span className="inline-flex items-center gap-1.5 text-sm text-amber-700">
                    <Icon name="Clock" size={15} /> Оспорено — на рассмотрении
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">Не согласны с нарушением?</span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDispute(v)}
                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  <Icon name="MessageSquareWarning" size={15} className="mr-1" />
                  {v.dispute_status === 'disputed' ? 'Изменить оспаривание' : 'Оспорить'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Диалог оспаривания */}
      <Dialog open={!!disputing} onOpenChange={(o) => !o && setDisputing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Оспорить нарушение</DialogTitle>
          </DialogHeader>
          {disputing && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                <div className="text-gray-500 mb-1">{fmtDate(disputing.violation_date)}</div>
                {disputing.violation_title}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Ваш комментарий</label>
                <Textarea
                  rows={4}
                  placeholder="Опишите, почему вы не согласны с нарушением"
                  value={disputeText}
                  onChange={(e) => setDisputeText(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Фотографии и скриншоты
                </label>
                <label className="flex items-center justify-center gap-2 h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer text-gray-500 hover:border-red-400 hover:text-red-600 transition-colors">
                  <Icon name="Upload" size={18} />
                  Прикрепить файлы
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleAddPhotos(e.target.files)}
                  />
                </label>
                {disputePhotos.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {disputePhotos.map((url, i) => (
                      <div key={i} className="relative">
                        <img
                          src={url}
                          alt="Доказательство"
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          onClick={() => removePhoto(i)}
                          className="absolute -top-2 -right-2 bg-white rounded-full border border-gray-200 shadow-sm p-0.5 text-gray-500 hover:text-red-600"
                        >
                          <Icon name="X" size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDisputing(null)}>
                  Отмена
                </Button>
                <Button
                  onClick={submitDispute}
                  disabled={sending}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {sending ? 'Отправка…' : 'Отправить оспаривание'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherViolations;
