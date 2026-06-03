import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FormData, HandleInputChange } from "./types";

interface Props {
  formData: FormData;
  handleInputChange: HandleInputChange;
}

export default function PageContactInfo({ formData, handleInputChange }: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Контактные данные родителя
      </h2>

      <div>
        <Label htmlFor="parent-name">ФИО родителя (законного представителя) *</Label>
        <Input
          id="parent-name"
          value={formData.parentName}
          onChange={(e) => handleInputChange("parentName", e.target.value)}
          className="mt-2"
          required
        />
      </div>

      <div>
        <Label htmlFor="parent-phone">Номер телефона родителя (законного представителя) *</Label>
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
          className="mt-2"
          placeholder="+7 (900) 123-45-67"
          required
        />
      </div>

      <div>
        <Label htmlFor="parent-email">Электронная почта родителя (законного представителя) *</Label>
        <Input
          id="parent-email"
          type="email"
          value={formData.parentEmail}
          onChange={(e) => handleInputChange("parentEmail", e.target.value)}
          className="mt-2"
        />
      </div>
    </div>
  );
}
