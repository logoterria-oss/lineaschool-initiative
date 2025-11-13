/**
 * ⚠️ КРИТИЧЕСКАЯ СТРАНИЦА - НЕ ИЗМЕНЯТЬ БЕЗ НЕОБХОДИМОСТИ
 * 
 * Страница диагностической формы
 * 
 * Ключевой функционал (handleLoadDictation):
 * - Загрузка проверенного диктанта по ФИ ребёнка
 * - Парсинг markup_data.errorTypes из базы данных
 * - Маппинг типов ошибок на поля формы (строки 147-160)
 * 
 * ВАЖНО: errorTypes приходят как объект {имя_типа: количество}
 * Маппинг на поля формы происходит через errorTypeMapping
 * 
 * Последнее изменение: 13.11.2025
 */

import Footer from "@/components/Footer";
import DiagFormNavigation from "@/components/diag/DiagFormNavigation";
import FormSections from "@/components/DiagForm/FormSections";
import { useFormDataManager } from "@/components/DiagForm/FormDataManager";
import { useConclusionLogic } from "@/components/DiagForm/ConclusionLogic";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function DiagForm() {
  const { formData, handleInputChange } = useFormDataManager();
  const { handleCreateConclusion } = useConclusionLogic();

  const handleLoadDictation = async () => {
    if (!formData.childName) {
      toast({
        title: 'Укажите ФИ ребёнка',
        description: 'Заполните поле "ФИ ребёнка" для поиска диктанта',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch('https://functions.poehali.dev/94ceb881-6ad6-4eff-8d2c-2975261768a0');
      const data = await response.json();
      const dictations = data.dictations || [];

      const normalizeText = (text: string) => {
        return text
          .toLowerCase()
          .trim()
          .replace(/\s+/g, ' ')
          .replace(/ё/g, 'е');
      };

      const searchName = normalizeText(formData.childName);
      
      const matchingDictation = dictations.find((d: any) => {
        if (d.status !== 'checked' || !d.has_annotation) return false;
        
        const dictationName = normalizeText(d.child_name);
        const searchWords = searchName.split(' ').filter(w => w.length > 0);
        const dictationWords = dictationName.split(' ').filter(w => w.length > 0);
        
        if (searchWords.length === 0 || dictationWords.length === 0) return false;
        
        return searchWords.every(searchWord => 
          dictationWords.some(dictWord => 
            dictWord.includes(searchWord) || searchWord.includes(dictWord)
          )
        );
      });

      if (!matchingDictation) {
        toast({
          title: 'Диктант не найден',
          description: `Проверенный диктант для "${formData.childName}" не найден`,
          variant: 'destructive'
        });
        return;
      }

      const detailResponse = await fetch(`https://functions.poehali.dev/94ceb881-6ad6-4eff-8d2c-2975261768a0?id=${matchingDictation.id}`);
      const detailData = await detailResponse.json();
      const dictationDetail = detailData.dictation;

      if (!dictationDetail || !dictationDetail.markup_data) {
        toast({
          title: 'Ошибка загрузки',
          description: 'Не удалось получить данные разметки диктанта',
          variant: 'destructive'
        });
        return;
      }

      const markupData = dictationDetail.markup_data;
      const greenCount = markupData.greenCount || 0;
      const redCount = markupData.redCount || 0;
      const totalCount = greenCount + redCount;
      const annotatedImage = dictationDetail.annotated_image;
      const errorTypes = markupData.errorTypes || {};

      console.log('Loaded errorTypes:', errorTypes);
      console.log('ErrorTypes keys:', Object.keys(errorTypes));

      handleInputChange('dysgraphicErrors', String(greenCount));
      handleInputChange('dysorthographicErrors', String(redCount));
      handleInputChange('totalErrors', String(totalCount));
      
      if (annotatedImage) {
        const currentSamples = formData.writingSamples || [];
        if (!currentSamples.includes(annotatedImage)) {
          handleInputChange('writingSamples', [...currentSamples, annotatedImage].slice(0, 3));
        }
      }

      const errorTypeMapping: Record<string, string[]> = {
        'analysisErrors': ['пропуски', 'вставки', 'перестановки', 'антиципации (предвосхищение)'],
        'acousticErrors': [
          'замены и смешения звонких-глухих согласных',
          'ошибки обозначения мягкости',
          'замены и смешения свистящих-шипящих согласных',
          'замены и смешения аффрикатов и их компонентов',
          'замены и смешения заднеязычных согласных',
          'замены и смешения соноров',
          'замены и смешения гласных в сильной позиции',
          'замены и смешения согласных по способу образования',
          'замены и смешения согласных по месту образования'
        ],
        'motorErrors': [
          'ошибки кинетического запуска',
          'графический поиск при написании буквы',
          'лишние элементы при написании буквы',
          'недописывание отдельных элементов буквы',
          'персеверации (повтор целой буквы, узнаваемой ее части или слога)',
          'неоднократные правильные обводки букв'
        ],
        'visualMotorErrors': [
          'смешение оптически сходных букв',
          'неточность передачи графического образа буквы',
          'неадекватность начертания буквы'
        ],
        'visualSpatialErrors': [
          'зеркальность написания букв',
          'неудержание строки',
          'дисметрия букв',
          'дисметрия элементов букв',
          'колебание наклона букв',
          'отсутствие слитности написания букв в словах',
          'левостороннее игнорирование',
          'неравномерность расстояний между словами',
          'избегания переноса слов'
        ],
        'additionalCharacteristics': [
          'гипертонус и гипотонус при письме',
          'микрография или макрография'
        ],
        'regulationViolations': [
          'пропуски элементов букв, букв, слогов, слов',
          'персеверации (навязчивые повторения) элементов букв, букв, слогов, слов',
          'контоминации (объединение слов)',
          'антиципации (предвосхищение слов и их элементов)',
          'ошибки обозначения границ предложения'
        ]
      };

      Object.entries(errorTypeMapping).forEach(([field, options]) => {
        const foundErrors = options.filter(opt => {
          const hasError = errorTypes[opt] && errorTypes[opt] > 0;
          console.log(`Checking ${opt}: ${errorTypes[opt]} -> ${hasError}`);
          return hasError;
        });
        console.log(`Field ${field}: found ${foundErrors.length} errors:`, foundErrors);
        if (foundErrors.length > 0) {
          handleInputChange(field, foundErrors);
        } else {
          handleInputChange(field, ['нет']);
        }
      });

      // Автоматически проставляем "орфографические ошибки" если есть красные маркеры (дизорфография)
      if (redCount > 0) {
        const currentRegulationViolations = formData.regulationViolations || [];
        if (!currentRegulationViolations.includes('орфографические ошибки')) {
          const newViolations = currentRegulationViolations.filter(v => v !== 'нет');
          newViolations.push('орфографические ошибки');
          handleInputChange('regulationViolations', newViolations);
        }
      }

      toast({
        title: 'Диктант загружен',
        description: `Добавлено: ${greenCount} дисграфических, ${redCount} дизорфографических (всего ${totalCount})`
      });
    } catch (error) {
      console.error('Error loading dictation:', error);
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить диктант',
        variant: 'destructive'
      });
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCreateConclusion(formData);
  };

  return (
    <div className="min-h-screen bg-white">
      <DiagFormNavigation />

      <main className="flex-1 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Диагностическая форма</h1>
          
          <form className="space-y-8" onSubmit={onSubmit}>
            <FormSections 
              formData={formData}
              onInputChange={handleInputChange}
              onLoadDictation={handleLoadDictation}
            />

            <div className="flex justify-center mt-8 pb-8">
              <Button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-8 py-4 text-lg font-semibold rounded-lg transition-colors duration-200 min-h-[48px] touch-manipulation select-none"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                Создать
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}