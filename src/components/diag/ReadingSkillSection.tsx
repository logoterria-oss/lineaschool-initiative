import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

interface ReadingSkillProps {
  readingSkill: string[];
  readingSpeed: string;
  readingComprehension: string;
  onCheckboxChange: (field: string, value: string, checked: boolean) => void;
  onInputChange: (field: string, value: string | string[]) => void;
}

export default function ReadingSkillSection({ 
  readingSkill, 
  readingSpeed, 
  readingComprehension, 
  onCheckboxChange, 
  onInputChange 
}: ReadingSkillProps) {
  return (
    <div className="space-y-6">
      <Label className="text-lg font-semibold">Навык чтения</Label>
      
      <div className="ml-4">
        <Label className="text-base font-semibold">Характер чтения</Label>
        <div className="mt-2 space-y-2">
          {[
            "побуквенное чтение",
            "побуквенно-послоговое чтение", 
            "послоговое чтение",
            "переход от послогового чтения к синтетическому",
            "синтетическое чтение"
          ].map(option => {
            const isSelected = readingSkill.some(skill => skill.startsWith(option));
            const selectedWithNorm = readingSkill.find(skill => skill.startsWith(option));
            
            return (
              <div key={option} className="space-y-1">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id={`reading-skill-${option}`}
                    checked={isSelected}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onCheckboxChange("readingSkill", option, true);
                      } else {
                        const toRemove = readingSkill.filter(skill => skill.startsWith(option));
                        toRemove.forEach(skill => {
                          onInputChange("readingSkill", readingSkill.filter(item => item !== skill));
                        });
                      }
                    }}
                    className="mt-0.5"
                  />
                  <Label htmlFor={`reading-skill-${option}`} className="text-sm leading-5">{option}</Label>
                </div>
                
                {isSelected && (
                  <div className="ml-8 space-y-1">
                    {["соответствует возрастной норме", "НЕ соответствует возрастной норме"].map(norm => {
                      const fullValue = `${option} (${norm})`;
                      const isNormSelected = selectedWithNorm === fullValue || (selectedWithNorm === option && norm === "соответствует возрастной норме");
                      
                      return (
                        <div key={norm} className="flex items-start space-x-2">
                          <Checkbox
                            id={`reading-norm-${option}-${norm}`}
                            checked={isNormSelected}
                            onCheckedChange={(checked) => {
                              const oldValues = readingSkill.filter(skill => !skill.startsWith(option));
                              if (checked) {
                                onInputChange("readingSkill", [...oldValues, fullValue]);
                              } else {
                                onInputChange("readingSkill", [...oldValues, option]);
                              }
                            }}
                            className="mt-0.5"
                          />
                          <Label htmlFor={`reading-norm-${option}-${norm}`} className="text-sm leading-5">
                            {norm}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="ml-4">
        <Label className="text-base font-semibold">Ошибки чтения</Label>
        <div className="mt-2 space-y-2">
          {[
            "пропуск, перестановка, замены букв/слогов/слов при чтении",
            "аграмматизмы при чтении",
            "ошибки угадывающего чтения",
            "затруднения в припоминании букв",
            "зеркальность чтения букв и/или слов"
          ].map(option => (
            <div key={option} className="flex items-start space-x-2">
              <Checkbox
                id={`reading-errors-${option}`}
                checked={readingSkill.includes(option)}
                onCheckedChange={(checked) => onCheckboxChange("readingSkill", option, !!checked)}
                className="mt-0.5"
              />
              <Label htmlFor={`reading-errors-${option}`} className="text-sm leading-5">{option}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="ml-4">
        <Label htmlFor="reading-speed" className="text-base font-semibold">Скорость чтения</Label>
        <div className="mt-2 flex items-center space-x-2">
          <Input
            id="reading-speed"
            type="number"
            placeholder="___"
            value={readingSpeed}
            onChange={(e) => onInputChange("readingSpeed", e.target.value)}
            className="w-24"
          />
          <span className="text-sm text-gray-600">слов/мин</span>
        </div>
      </div>

      <div className="ml-4">
        <Label htmlFor="reading-comprehension" className="text-base font-semibold">Понимание прочитанного</Label>
        <div className="mt-2 flex items-center space-x-2">
          <Input
            id="reading-comprehension"
            type="number"
            placeholder="___"
            value={readingComprehension}
            onChange={(e) => onInputChange("readingComprehension", e.target.value)}
            className="w-24"
            min="0"
            max="100"
          />
          <span className="text-sm text-gray-600">%</span>
        </div>
      </div>
    </div>
  );
}
