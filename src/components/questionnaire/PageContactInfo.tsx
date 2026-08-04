import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import CitySelect from "@/components/ui/CitySelect";
import { FormData, HandleInputChange } from "./types";

interface Props {
  formData: FormData;
  handleInputChange: HandleInputChange;
  errors?: string[];
}

const err = (errors: string[] | undefined, field: string) => errors?.includes(field);

export default function PageContactInfo({ formData, handleInputChange, errors }: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Контактные данные родителя
      </h2>

      <div data-error={err(errors, 'parentName') || undefined}>
        <Label htmlFor="parent-name" className={err(errors, 'parentName') ? 'text-red-500' : ''}>
          ФИО родителя (законного представителя) *
        </Label>
        <Input
          id="parent-name"
          value={formData.parentName}
          onChange={(e) => handleInputChange("parentName", e.target.value)}
          className={`mt-2 ${err(errors, 'parentName') ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
          required
        />
        {err(errors, 'parentName') && <p className="text-red-500 text-xs mt-1">Обязательное поле</p>}
      </div>

      <div data-error={err(errors, 'parentPhone') || undefined}>
        <Label htmlFor="parent-phone" className={err(errors, 'parentPhone') ? 'text-red-500' : ''}>
          Номер телефона родителя (законного представителя) *
        </Label>
        <Input
          id="parent-phone"
          type="tel"
          value={formData.parentPhone}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
            let masked = '';
            if (digits.length === 0) {
              masked = '';
            } else {
              const d = digits[0] === '8' ? '7' + digits.slice(1) : digits;
              masked = '+7';
              if (d.length > 1) masked += ' (' + d.slice(1, 4);
              if (d.length >= 4) masked += ') ' + d.slice(4, 7);
              if (d.length >= 7) masked += '-' + d.slice(7, 9);
              if (d.length >= 9) masked += '-' + d.slice(9, 11);
            }
            handleInputChange("parentPhone", masked);
          }}
          className={`mt-2 ${err(errors, 'parentPhone') ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
          placeholder="+7 (900) 123-45-67"
          required
        />
        {err(errors, 'parentPhone') && <p className="text-red-500 text-xs mt-1">Обязательное поле</p>}
      </div>

      <div data-error={err(errors, 'parentEmail') || undefined}>
        <Label htmlFor="parent-email" className={err(errors, 'parentEmail') ? 'text-red-500' : ''}>
          Электронная почта родителя (законного представителя) *
        </Label>
        <Input
          id="parent-email"
          type="email"
          value={formData.parentEmail}
          onChange={(e) => handleInputChange("parentEmail", e.target.value)}
          className={`mt-2 ${err(errors, 'parentEmail') ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
        />
        {err(errors, 'parentEmail') && <p className="text-red-500 text-xs mt-1">Обязательное поле</p>}
      </div>

      <div data-error={err(errors, 'city') || undefined}>
        <Label htmlFor="city" className={err(errors, 'city') ? 'text-red-500' : ''}>
          Населённый пункт *
        </Label>
        <div className={`mt-2 ${err(errors, 'city') ? 'ring-1 ring-red-400 rounded-md' : ''}`}>
          <CitySelect
            id="city"
            value={formData.city}
            timezoneLabel={formData.cityTimezone}
            onChange={(val, timezoneLabel, region) => {
              handleInputChange("city", val);
              handleInputChange("cityTimezone", timezoneLabel || "");
              handleInputChange("cityRegion", region || "");
            }}
          />
        </div>
        {err(errors, 'city') && <p className="text-red-500 text-xs mt-1">Обязательное поле</p>}
      </div>
    </div>
  );
}