import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ErrorTypeModalProps {
  open: boolean;
  onSelect: (errorType: string) => void;
  onCancel: () => void;
}

const ERROR_TYPES = [
  {
    category: "Ошибки языкового анализа и синтеза",
    options: [
      "пропуски",
      "вставки",
      "перестановки",
      "антиципации (предвосхищение)"
    ]
  },
  {
    category: "Ошибки акустико-артикуляторного сходства",
    options: [
      "замены и смешения звонких-глухих согласных",
      "ошибки обозначения мягкости",
      "замены и смешения свистящих-шипящих согласных",
      "замены и смешения аффрикатов и их компонентов",
      "замены и смешения заднеязычных согласных",
      "замены и смешения соноров",
      "замены и смешения гласных в сильной позиции",
      "замены и смешения согласных по способу образования",
      "замены и смешения согласных по месту образования"
    ]
  },
  {
    category: "Моторные ошибки",
    options: [
      "ошибки кинетического запуска",
      "графический поиск при написании буквы",
      "лишние элементы при написании буквы",
      "недописывание отдельных элементов буквы",
      "персеверации (повтор целой буквы, узнаваемой ее части или слога)",
      "неоднократные правильные обводки букв"
    ]
  },
  {
    category: "Зрительно-моторные ошибки",
    options: [
      "смешение оптически сходных букв",
      "неточность передачи графического образа буквы",
      "неадекватность начертания буквы"
    ]
  },
  {
    category: "Зрительно-пространственные ошибки",
    options: [
      "зеркальность написания букв",
      "неудержание строки",
      "дисметрия букв",
      "дисметрия элементов букв",
      "колебание наклона букв",
      "отсутствие слитности написания букв в словах",
      "левостороннее игнорирование",
      "неравномерность расстояний между словами",
      "избегания переноса слов"
    ]
  },
  {
    category: "Дополнительные характеристики письма",
    options: [
      "гипертонус и гипотонус при письме",
      "микрография или макрография"
    ]
  },
  {
    category: "Нарушения регуляции письменной деятельности",
    options: [
      "пропуски элементов букв, букв, слогов, слов",
      "персеверации (навязчивые повторения) элементов букв, букв, слогов, слов",
      "контоминации (объединение слов)",
      "антиципации (предвосхищение слов и их элементов)",
      "ошибки обозначения границ предложения"
    ]
  }
];

export default function ErrorTypeModal({ open, onSelect, onCancel }: ErrorTypeModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Выберите тип дисграфической ошибки</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {ERROR_TYPES.map((group) => (
              <div key={group.category}>
                <h3 className="font-semibold text-sm mb-3 text-gray-700">{group.category}</h3>
                <div className="space-y-2">
                  {group.options.map((option) => (
                    <Button
                      key={option}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-3 px-4 hover:bg-green-50 hover:border-green-500"
                      onClick={() => onSelect(option)}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>
            Отмена
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
