import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface InterimRecommendationsData {
  teacherRecommendations: string;
  parentRecommendations: string;
  logopedist: string;
}

interface Props {
  data: InterimRecommendationsData;
  onChange: (patch: Partial<InterimRecommendationsData>) => void;
}

export default function InterimRecommendationsSection({ data, onChange }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Рекомендации</h2>

      <div className="space-y-6">
        <div>
          <Label htmlFor="teacher-recommendations" className="text-base font-semibold">
            Рекомендации педагогам
          </Label>
          <Textarea
            id="teacher-recommendations"
            value={data.teacherRecommendations}
            onChange={(e) => onChange({ teacherRecommendations: e.target.value })}
            className="mt-2"
            rows={4}
            placeholder="Введите рекомендации педагогам"
          />
        </div>

        <div>
          <Label htmlFor="parent-recommendations" className="text-base font-semibold">
            Рекомендации родителям
          </Label>
          <Textarea
            id="parent-recommendations"
            value={data.parentRecommendations}
            onChange={(e) => onChange({ parentRecommendations: e.target.value })}
            className="mt-2"
            rows={4}
            placeholder="Введите рекомендации родителям"
          />
        </div>

        <div>
          <Label className="text-base font-semibold">Логопед-диагност</Label>
          <Select value={data.logopedist} onValueChange={(v) => onChange({ logopedist: v })}>
            <SelectTrigger className="mt-2 w-64">
              <SelectValue placeholder="Выберите логопеда" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Абраменко Виктория">Абраменко Виктория</SelectItem>
              <SelectItem value="Зинченко Ирина">Зинченко Ирина</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
