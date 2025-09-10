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
            className="mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="норма" id="phonematic-norm" />
              <Label htmlFor="phonematic-norm" className="text-sm">норма</Label>
            </div>
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="уподобления и замены слогов, обусловленные дефектами звукопроизношения" id="phonematic-caused" className="mt-0.5" />
              <Label htmlFor="phonematic-caused" className="text-sm leading-5">уподобления и замены слогов, обусловленные дефектами звукопроизношения</Label>
            </div>
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="уподобления и замены слогов, НЕ обусловленные дефектами звукопроизношения" id="phonematic-not-caused" className="mt-0.5" />
              <Label htmlFor="phonematic-not-caused" className="text-sm leading-5">уподобления и замены слогов, НЕ обусловленные дефектами звукопроизношения</Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </section>
  );
}