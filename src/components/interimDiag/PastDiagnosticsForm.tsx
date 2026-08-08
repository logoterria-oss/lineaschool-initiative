import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  READING_CHAR_LEVELS,
  READING_ERROR_CATALOG,
  DYSGRAPHIC_ERROR_CATALOG,
  ORTHOGRAPHIC_ERROR_CATALOG,
} from './readingWriting';
import PastDiagnosticsErrorList from './PastDiagnosticsErrorList';
import {
  IMPAIRED_GROUPS,
  ImpairedProcessKey,
  ProcessLevel,
  PROCESS_LEVELS,
} from './impairedProcesses';
import { PastEntry } from './pastDiagnostics';

interface Props {
  draft: Omit<PastEntry, 'id'>;
  editingId: number | null;
  saving: boolean;
  error: string;
  savedAt: number | null;
  patch: (p: Partial<Omit<PastEntry, 'id'>>) => void;
  setLevel: (key: ImpairedProcessKey, level: ProcessLevel | null) => void;
  onSave: () => void;
}

export default function PastDiagnosticsForm({
  draft,
  editingId,
  saving,
  error,
  savedAt,
  patch,
  setLevel,
  onSave,
}: Props) {
  return (
    <div className="mt-6 rounded-lg border border-gray-200 p-4">
      <h4 className="mb-3 text-sm font-semibold text-gray-900">
        {editingId ? 'Изменение записи' : 'Добавить прошлую диагностику'}
      </h4>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label className="text-sm">Тип диагностики</Label>
          <Select
            value={draft.diagType}
            onValueChange={(v) => patch({ diagType: v as 'primary' | 'interim' })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primary">Первичная</SelectItem>
              <SelectItem value="interim">Промежуточная</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm">Дата диагностики</Label>
          <Input
            type="date"
            value={draft.date || ''}
            onChange={(e) => patch({ date: e.target.value })}
            className="mt-1"
          />
        </div>
        <div className="sm:col-span-3 border-t border-gray-200 pt-4">
          <h5 className="text-sm font-semibold text-gray-900">Нарушенные речевые процессы</h5>
          <p className="mt-1 text-xs text-gray-500">
            По умолчанию везде «норма» — измените только нарушенные процессы. Если процесс не
            обследовался, выберите «Не оценивался»: он не попадёт в цепочку динамики.
          </p>

          <div className="mt-4 space-y-5">
            {IMPAIRED_GROUPS.map((group, idx) => (
              <div key={group.title}>
                <p className="mb-2 text-xs font-semibold uppercase text-gray-500">
                  {idx + 1}) {group.title}
                </p>
                <div className="space-y-3">
                  {group.items.map((item) => (
                    <div
                      key={item.key}
                      className="grid grid-cols-1 items-center gap-2 sm:grid-cols-2"
                    >
                      <Label className="text-sm font-normal text-gray-700">{item.label}</Label>
                      <Select
                        value={draft.levels[item.key] || 'норма'}
                        onValueChange={(v) =>
                          setLevel(item.key, v === 'none' ? null : (v as ProcessLevel))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Не оценивался</SelectItem>
                          {PROCESS_LEVELS.map((lvl) => (
                            <SelectItem key={lvl} value={lvl}>
                              {lvl}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sm:col-span-3 border-t border-gray-200 pt-4">
          <h5 className="text-sm font-semibold text-gray-900">Чтение и письмо</h5>
        </div>
        <div>
          <Label className="text-sm">Скорость чтения (сл/мин)</Label>
          <Input
            type="number"
            min="0"
            value={draft.readingSpeed}
            onChange={(e) => patch({ readingSpeed: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-sm">Понимание прочитанного (%)</Label>
          <Input
            type="number"
            min="0"
            max="100"
            value={draft.readingComprehension}
            onChange={(e) => patch({ readingComprehension: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-sm">Количество слов в работе</Label>
          <Input
            type="number"
            min="0"
            value={draft.dictationWords}
            onChange={(e) => patch({ dictationWords: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-sm">Дисграфических ошибок</Label>
          <Input
            type="number"
            min="0"
            value={draft.dysgraphicErrors}
            onChange={(e) => patch({ dysgraphicErrors: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-sm">Орфографических ошибок</Label>
          <Input
            type="number"
            min="0"
            value={draft.dysorthographicErrors}
            onChange={(e) => patch({ dysorthographicErrors: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-sm">Ошибок всего</Label>
          <Input
            type="number"
            min="0"
            value={draft.totalErrors}
            onChange={(e) => patch({ totalErrors: e.target.value })}
            className="mt-1"
          />
        </div>
        <div className="sm:col-span-3">
          <Label className="text-sm">Характер чтения</Label>
          <Select value={draft.readingChar || undefined} onValueChange={(v) => patch({ readingChar: v })}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Не указан" />
            </SelectTrigger>
            <SelectContent>
              {READING_CHAR_LEVELS.map((lvl) => (
                <SelectItem key={lvl} value={lvl}>
                  {lvl}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="sm:col-span-3 space-y-3">
          <PastDiagnosticsErrorList
            title="Ошибки чтения"
            catalog={READING_ERROR_CATALOG}
            selected={draft.readingErrorTypes}
            onChange={(v) => patch({ readingErrorTypes: v })}
          />
          <PastDiagnosticsErrorList
            title="Типы дисграфических ошибок"
            catalog={DYSGRAPHIC_ERROR_CATALOG}
            selected={draft.errorTypes}
            onChange={(v) => patch({ errorTypes: v })}
          />
          <PastDiagnosticsErrorList
            title="Типы орфографических ошибок"
            catalog={ORTHOGRAPHIC_ERROR_CATALOG}
            selected={draft.orthoErrorTypes}
            onChange={(v) => patch({ orthoErrorTypes: v })}
          />
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {savedAt && !error && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-green-700">
          <Icon name="Check" size={16} />
          Изменения сохранены
        </p>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {saving ? 'Сохранение…' : editingId ? 'Сохранить изменения' : 'Добавить'}
        </button>
      </div>
    </div>
  );
}