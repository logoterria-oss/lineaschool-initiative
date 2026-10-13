import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import PrivacyModal from '@/components/PrivacyModal';

export interface DiagContactValues {
  childName: string;
  childBirthDate: string;
  parentName: string;
  phone: string;
  telegram: string;
  messengerTelegram: boolean;
  messengerMax: boolean;
  marketingConsent: boolean;
  privacyConsent: boolean;
}

export const EMPTY_CONTACT: DiagContactValues = {
  childName: '',
  childBirthDate: '',
  parentName: '',
  phone: '+7 ',
  telegram: '@',
  messengerTelegram: false,
  messengerMax: false,
  marketingConsent: false,
  privacyConsent: false,
};

const formatBirthDate = (value: string) => {
  const n = value.replace(/\D/g, '');
  if (n.length <= 2) return n;
  if (n.length <= 4) return `${n.slice(0, 2)}.${n.slice(2)}`;
  return `${n.slice(0, 2)}.${n.slice(2, 4)}.${n.slice(4, 8)}`;
};

const formatPhone = (value: string) => {
  const n = value.replace(/\D/g, '');
  if (n.length <= 1) return '+7 ';
  if (n.length <= 4) return `+7 (${n.slice(1)}`;
  if (n.length <= 7) return `+7 (${n.slice(1, 4)}) ${n.slice(4)}`;
  if (n.length <= 9) return `+7 (${n.slice(1, 4)}) ${n.slice(4, 7)}-${n.slice(7)}`;
  return `+7 (${n.slice(1, 4)}) ${n.slice(4, 7)}-${n.slice(7, 9)}-${n.slice(9, 11)}`;
};

interface Props {
  values: DiagContactValues;
  onChange: (v: DiagContactValues) => void;
  /** Имя ребёнка уже известно из персональной ссылки */
  childLocked?: boolean;
  sending: boolean;
  disabled: boolean;
  onSubmit: () => void;
}

/** Контакты родителя — те же поля, что в форме записи на сайте */
const DiagContactForm = ({ values, onChange, childLocked, sending, disabled, onSubmit }: Props) => {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [error, setError] = useState('');
  const set = <K extends keyof DiagContactValues>(k: K, v: DiagContactValues[K]) =>
    onChange({ ...values, [k]: v });

  const submit = () => {
    if (!values.childName.trim() || !values.parentName.trim()) {
      setError('Заполните имя ребёнка и родителя');
      return;
    }
    if (values.phone.replace(/\D/g, '').length < 11) {
      setError('Введите номер телефона полностью');
      return;
    }
    if (!values.messengerTelegram && !values.messengerMax) {
      setError('Выберите хотя бы один мессенджер');
      return;
    }
    if (!values.privacyConsent) {
      setError('Необходимо согласие на обработку персональных данных');
      return;
    }
    setError('');
    onSubmit();
  };

  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-sm text-gray-700">ФИО ребёнка *</Label>
          <Input
            value={values.childName}
            disabled={childLocked}
            onChange={(e) => set('childName', e.target.value)}
            placeholder="Иванов Миша"
          />
        </div>
        <div>
          <Label className="text-sm text-gray-700">Дата рождения ребёнка</Label>
          <Input
            value={values.childBirthDate}
            onChange={(e) => set('childBirthDate', formatBirthDate(e.target.value))}
            placeholder="ДД.ММ.ГГГГ"
            inputMode="numeric"
          />
        </div>
        <div>
          <Label className="text-sm text-gray-700">ФИО родителя *</Label>
          <Input
            value={values.parentName}
            onChange={(e) => set('parentName', e.target.value)}
            placeholder="Иванова Анна"
          />
        </div>
        <div>
          <Label className="text-sm text-gray-700">Телефон *</Label>
          <Input
            value={values.phone}
            onChange={(e) => set('phone', formatPhone(e.target.value))}
            inputMode="tel"
          />
        </div>
      </div>

      <div>
        <Label className="text-sm text-gray-700 mb-1.5 block">Где с вами можно связаться? *</Label>
        <div className="flex gap-5">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
            <Checkbox
              checked={values.messengerTelegram}
              onCheckedChange={(c) => set('messengerTelegram', c === true)}
            />
            Telegram
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
            <Checkbox checked={values.messengerMax} onCheckedChange={(c) => set('messengerMax', c === true)} />
            Max
          </label>
        </div>
      </div>

      {values.messengerTelegram && (
        <div>
          <Label className="text-sm text-gray-700">Ник в Telegram</Label>
          <Input
            value={values.telegram}
            onChange={(e) => set('telegram', e.target.value.startsWith('@') ? e.target.value : `@${e.target.value}`)}
          />
        </div>
      )}

      <label className="flex items-start gap-2 cursor-pointer">
        <Checkbox
          checked={values.marketingConsent}
          onCheckedChange={(c) => set('marketingConsent', c === true)}
          className="mt-0.5"
        />
        <span className="text-xs text-gray-600 leading-snug">
          Я согласен(на) получать рекламно-информационные рассылки о занятиях, акциях и мероприятиях по
          SMS, электронной почте, в мессенджерах и социальных сетях. Отказаться можно в любой момент
          <span className="text-gray-400"> (необязательно)</span>
        </span>
      </label>

      <label className="flex items-start gap-2 cursor-pointer">
        <Checkbox
          checked={values.privacyConsent}
          onCheckedChange={(c) => set('privacyConsent', c === true)}
          className="mt-0.5"
        />
        <span className="text-xs text-gray-600 leading-snug">
          Я даю согласие на{' '}
          <button
            type="button"
            onClick={() => setPrivacyOpen(true)}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            обработку персональных данных
          </button>{' '}
          *
        </span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button onClick={submit} disabled={disabled || sending} className="w-full gap-2">
        {sending ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Check" size={16} />}
        Записаться на диагностику
      </Button>

      <PrivacyModal isOpen={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </div>
  );
};

export default DiagContactForm;
