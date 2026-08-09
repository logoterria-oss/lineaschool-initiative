import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { StudentRow } from '@/lib/studentsApi';
import { NameWithDot, ageLabel } from './studentsTableHelpers';
import CitySelect from '@/components/ui/CitySelect';

const AgeCell = ({
  s,
  onSave,
}: {
  s: StudentRow;
  onSave: (id: number, age: number | null) => Promise<void>;
}) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(s.age != null ? String(s.age) : '');
  const [saving, setSaving] = useState(false);

  const start = () => {
    setValue(s.age != null ? String(s.age) : '');
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const trimmed = value.trim();
      await onSave(s.id, trimmed === '' ? null : Number(trimmed));
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <td className="px-3 py-3 align-top">
        <Input
          type="number"
          min={1}
          max={120}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-9 w-20 text-sm"
          placeholder="Лет"
        />
        <div className="flex gap-2 mt-2">
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? '…' : 'ОК'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
            Отмена
          </Button>
        </div>
      </td>
    );
  }

  return (
    <td className="px-3 py-3 text-gray-700 whitespace-nowrap align-top group">
      <div className="flex items-center gap-2">
        <span>
          {s.age ? ageLabel(s.age) : '—'}
          {s.age_manual && (
            <span className="ml-1 text-[10px] text-purple-500 align-middle">(вручную)</span>
          )}
        </span>
        <button
          onClick={start}
          title="Редактировать возраст"
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-purple-600 transition-opacity"
        >
          <Icon name="Pencil" size={14} />
        </button>
      </div>
    </td>
  );
};

const ConclusionCell = ({
  s,
  onSave,
}: {
  s: StudentRow;
  onSave: (id: number, value: string) => Promise<void>;
}) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(s.conclusion);
  const [saving, setSaving] = useState(false);

  const start = () => {
    setValue(s.conclusion);
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave(s.id, value);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <td className="px-3 py-3 align-top">
        <Textarea
          rows={3}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="text-sm"
          placeholder="Формы нарушений чтения и письма"
        />
        <div className="flex gap-2 mt-2">
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? 'Сохранение…' : 'Сохранить'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
            Отмена
          </Button>
        </div>
      </td>
    );
  }

  return (
    <td className="px-3 py-3 text-gray-700 align-top group">
      <div className="flex items-start gap-2">
        <span className="flex-1">
          {s.conclusion || '—'}
          {s.conclusion_manual && (
            <span className="ml-1 text-[10px] text-purple-500 align-middle">(вручную)</span>
          )}
        </span>
        <button
          onClick={start}
          title="Редактировать"
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-purple-600 transition-opacity flex-shrink-0"
        >
          <Icon name="Pencil" size={14} />
        </button>
      </div>
    </td>
  );
};

// Часовой пояс приходит из анкеты родителя в виде «МСК+4».
// В таблице показываем в привычном виде: «г. Новосибирск (Мск+4)».
// Анкету заполнили не все, поэтому город можно указать вручную —
// он подтягивает часовой пояс из справочника адресов, как в анкете.
const TimezoneCell = ({
  s,
  onSave,
}: {
  s: StudentRow;
  onSave: (s: StudentRow, city: string, region: string, timezone: string) => Promise<void>;
}) => {
  const [editing, setEditing] = useState(false);
  const [city, setCity] = useState(s.city || '');
  const [region, setRegion] = useState(s.city_region || '');
  const [timezone, setTimezone] = useState(s.city_timezone || '');
  const [saving, setSaving] = useState(false);

  const start = () => {
    setCity(s.city || '');
    setRegion(s.city_region || '');
    setTimezone(s.city_timezone || '');
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave(s, city.trim(), region, timezone);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <td className="px-3 py-3 align-top min-w-[260px]">
        <CitySelect
          value={city}
          timezoneLabel={timezone}
          onChange={(c, tzLabel, reg) => {
            setCity(c);
            setTimezone(tzLabel || '');
            setRegion(reg || '');
          }}
          placeholder="Населённый пункт..."
        />
        <div className="flex gap-2 mt-2">
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? 'Сохранение…' : 'Сохранить'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
            Отмена
          </Button>
        </div>
      </td>
    );
  }

  const raw = (s.city || '').trim();
  // «г Новосибирск» из справочника адресов → «г. Новосибирск»
  const cityLabel = raw.replace(/^(г|с|д|п|пгт|рп|ст|х|аул|село|деревня)\s+/i, (m) =>
    `${m.trim()}. `,
  );
  const tz = (s.city_timezone || '').replace(/^МСК/i, 'Мск');
  const isMoscowTime = /Мск\+0$/i.test(tz);

  return (
    <td className="px-3 py-3 align-top whitespace-nowrap text-gray-700 group">
      <div className="flex items-start gap-2">
        <span>
          {raw ? (
            <>
              {cityLabel}
              {tz && (
                // Разницу с Москвой подсвечиваем: она влияет на расписание
                <span className={isMoscowTime ? 'text-gray-400' : 'font-medium text-purple-600'}>
                  {' '}
                  ({tz})
                </span>
              )}
              {s.city_manual && (
                <span className="ml-1 text-[10px] text-purple-500 align-middle">(вручную)</span>
              )}
            </>
          ) : (
            <span className="text-gray-300">—</span>
          )}
        </span>
        <button
          onClick={start}
          title="Указать населённый пункт"
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-purple-600 transition-opacity flex-shrink-0"
        >
          <Icon name="Pencil" size={14} />
        </button>
      </div>
    </td>
  );
};

const MainTable = ({
  rows,
  onSaveConclusion,
  onSaveAge,
  onSaveCity,
}: {
  rows: StudentRow[];
  onSaveConclusion: (id: number, value: string) => Promise<void>;
  onSaveAge: (id: number, age: number | null) => Promise<void>;
  onSaveCity: (s: StudentRow, city: string, region: string, timezone: string) => Promise<void>;
}) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-500 text-left">
            <th className="px-3 py-3 font-semibold w-12">№</th>
            <th className="px-3 py-3 font-semibold">Фамилия Имя</th>
            <th className="px-3 py-3 font-semibold">Возраст</th>
            <th className="px-3 py-3 font-semibold">Часовой пояс</th>
            <th className="px-3 py-3 font-semibold">Формы нарушений чтения и письма</th>
            <th className="px-3 py-3 font-semibold">Абонемент</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s, i) => (
            <tr key={s.id} className="border-t border-gray-100 hover:bg-purple-50/50">
              <td className="px-3 py-3 text-gray-400 align-top">{i + 1}</td>
              <td className="px-3 py-3 align-top font-medium text-gray-900">
                <NameWithDot name={s.name} statusId={s.status_id} statusName={s.status_name} />
              </td>
              <AgeCell s={s} onSave={onSaveAge} />
              <TimezoneCell s={s} onSave={onSaveCity} />
              <ConclusionCell s={s} onSave={onSaveConclusion} />
              <td className="px-3 py-3 align-top">
                {s.tariff ? (
                  <div className="flex flex-col">
                    <span className="text-gray-800">{s.tariff.name}</span>
                    <span
                      className={`text-xs ${s.tariff.is_active ? 'text-green-600' : 'text-gray-400'}`}
                    >
                      {s.tariff.is_active
                        ? `остаток ${s.tariff.paid_lessons_left} занятий`
                        : 'нет оплаченных занятий'}
                      {s.tariff.shared_with_siblings && (
                        <span className="text-purple-500"> · разделён между сиблингами</span>
                      )}
                    </span>
                  </div>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default MainTable;