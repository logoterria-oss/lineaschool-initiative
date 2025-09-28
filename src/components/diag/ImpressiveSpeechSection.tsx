import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ImpressiveSpeechData {
  wordUnderstanding: string;
  complexConstructions: string;
  phonematicPerception: string;
}

interface ImpressiveSpeechProps {
  formData: ImpressiveSpeechData;
  onInputChange: (field: string, value: string) => void;
}

export default function ImpressiveSpeechSection({ formData, onInputChange }: ImpressiveSpeechProps) {
  return (
    <section className="bg-gray-50 p-6 rounded-lg">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Импрессивная речь</h2>
      <div className="space-y-6">
        
        {/* Понимание слов */}
        <div>
          <Label className="text-base font-semibold">Понимание слов, обозначающих названия предметов и действий</Label>
          <RadioGroup 
            value={formData.wordUnderstanding} 
            onValueChange={(value) => onInputChange("wordUnderstanding", value)}
            className="mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="норма" id="word-norm" />
              <Label htmlFor="word-norm" className="text-sm">норма</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="нарушено" id="word-impaired" />
              <Label htmlFor="word-impaired" className="text-sm">нарушено</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Понимание сложных конструкций */}
        <div>
          <Label className="text-base font-semibold">Понимание сложных лексико-грамматических конструкций</Label>
          <RadioGroup 
            value={formData.complexConstructions} 
            onValueChange={(value) => onInputChange("complexConstructions", value)}
            className="mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="норма" id="complex-norm" />
              <Label htmlFor="complex-norm" className="text-sm">норма</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="нарушено" id="complex-impaired" />
              <Label htmlFor="complex-impaired" className="text-sm">нарушено</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Фонематическое восприятие */}
        <div>
          <Label className="text-base font-semibold">Фонематическое восприятие</Label>
          <RadioGroup 
            value={formData.phonematicPerception} 
            onValueChange={(value) => onInputChange("phonematicPerception", value)}
            className="mt-2 space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="норма" id="phonematic-norm" />
              <Label htmlFor="phonematic-norm" className="text-sm">норма</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="не соответствует возрастной норме (1-2 ошибки в пробе)" id="phonematic-partial" />
              <Label htmlFor="phonematic-partial" className="text-sm">не соответствует возрастной норме (1-2 ошибки в пробе)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="не сформировано" id="phonematic-not-formed" />
              <Label htmlFor="phonematic-not-formed" className="text-sm">не сформировано</Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </section>
  );
}