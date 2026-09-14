import Icon from '@/components/ui/icon';
import { Requisites } from '@/lib/letterheadMarkup';
import { ORG_DETAILS as O } from '@/lib/orgDetails';

const field =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400';

export const OWN_REQUISITES = [
  `ИП ${O.personName}`,
  `ОГРНИП: ${O.ogrnip}`,
  `ИНН: ${O.inn}`,
  `Юридический адрес: ${O.address}`,
  'Расчётный счёт: 40802810800008649860',
  'Банк: АО «ТБанк»',
  'БИК: 044525974',
  'Корр. счёт: 30101810145250000974',
  `Телефон: ${O.phone}`,
  'E-mail: lineaschool@mail.ru',
].join('\n');

interface Props {
  value: Requisites;
  onChange: (patch: Partial<Requisites>) => void;
}

const RequisitesEditor = ({ value: r, onChange }: Props) => (
  <div className="border border-gray-200 rounded-xl overflow-hidden">
    <button
      onClick={() => onChange({ enabled: !r.enabled })}
      className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium transition-colors ${
        r.enabled ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
      }`}
    >
      <span className="flex items-center gap-2">
        <Icon name={r.enabled ? 'CircleCheck' : 'Circle'} size={16} />
        Реквизиты и подписи сторон
      </span>
      <Icon name={r.enabled ? 'ChevronUp' : 'ChevronDown'} size={16} />
    </button>

    {r.enabled && (
      <div className="p-3 space-y-4 bg-white">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">Левая колонка</span>
            <button
              onClick={() =>
                onChange({
                  leftBody: OWN_REQUISITES,
                  leftSign: 'Абраменко В.А.',
                })
              }
              className="text-[11px] text-green-700 hover:underline"
            >
              Подставить свои реквизиты
            </button>
          </div>
          <input
            className={field}
            value={r.leftTitle}
            onChange={(e) => onChange({ leftTitle: e.target.value })}
            placeholder="Исполнитель:"
          />
          <textarea
            className={`${field} min-h-[120px] resize-y leading-relaxed`}
            value={r.leftBody}
            onChange={(e) => onChange({ leftBody: e.target.value })}
            placeholder={'ИП Иванов Иван Иванович\nОГРНИП: …\nИНН: …'}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className={field}
              value={r.leftSign}
              onChange={(e) => onChange({ leftSign: e.target.value })}
              placeholder="Абраменко В.А."
            />
            <input
              className={field}
              value={r.leftDate}
              onChange={(e) => onChange({ leftDate: e.target.value })}
              placeholder="«27» августа 2026 г."
            />
          </div>
        </div>

        <div className="space-y-2 pt-1 border-t border-gray-100">
          <span className="text-xs font-semibold text-gray-700 block pt-2">Правая колонка</span>
          <input
            className={field}
            value={r.rightTitle}
            onChange={(e) => onChange({ rightTitle: e.target.value })}
            placeholder="Заказчик:"
          />
          <textarea
            className={`${field} min-h-[120px] resize-y leading-relaxed`}
            value={r.rightBody}
            onChange={(e) => onChange({ rightBody: e.target.value })}
            placeholder={'Петрова Анна Сергеевна\nПаспорт: серия … № …\nАдрес регистрации: …'}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className={field}
              value={r.rightSign}
              onChange={(e) => onChange({ rightSign: e.target.value })}
              placeholder="Петрова А.С."
            />
            <input
              className={field}
              value={r.rightDate}
              onChange={(e) => onChange({ rightDate: e.target.value })}
              placeholder="«___» _________ 2026 г."
            />
          </div>
        </div>
      </div>
    )}
  </div>
);

export default RequisitesEditor;
