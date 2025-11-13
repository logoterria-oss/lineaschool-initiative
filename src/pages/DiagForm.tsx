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

      console.log('Total dictations:', dictations.length);
      console.log('Searching for:', formData.childName);
      console.log('All dictation names:', dictations.map((d: any) => ({
        name: d.child_name,
        status: d.status,
        hasMarkup: !!d.markup_data
      })));

      const normalizeText = (text: string) => {
        return text
          .toLowerCase()
          .trim()
          .replace(/\s+/g, ' ')
          .replace(/ё/g, 'е');
      };

      const searchName = normalizeText(formData.childName);
      console.log('Normalized search name:', searchName);
      
      const matchingDictation = dictations.find((d: any) => {
        if (d.status !== 'checked' || !d.markup_data) return false;
        
        const dictationName = normalizeText(d.child_name);
        console.log('Comparing with:', dictationName);
        
        const searchWords = searchName.split(' ').filter(w => w.length > 0);
        const dictationWords = dictationName.split(' ').filter(w => w.length > 0);
        
        console.log('Search words:', searchWords);
        console.log('Dictation words:', dictationWords);
        
        if (searchWords.length === 0 || dictationWords.length === 0) return false;
        
        const matches = searchWords.every(searchWord => 
          dictationWords.some(dictWord => 
            dictWord.includes(searchWord) || searchWord.includes(dictWord)
          )
        );
        
        console.log('Match result:', matches);
        return matches;
      });

      if (!matchingDictation) {
        toast({
          title: 'Диктант не найден',
          description: `Проверенный диктант для "${formData.childName}" не найден`,
          variant: 'destructive'
        });
        return;
      }

      const markupData = matchingDictation.markup_data;
      const greenCount = markupData.greenCount || 0;
      const redCount = markupData.redCount || 0;
      const totalCount = greenCount + redCount;
      const annotatedImage = matchingDictation.annotated_image;

      handleInputChange('dysgraphicErrors', String(greenCount));
      handleInputChange('dysorthographicErrors', String(redCount));
      handleInputChange('totalErrors', String(totalCount));
      
      if (annotatedImage) {
        const currentSamples = formData.writingSamples || [];
        if (!currentSamples.includes(annotatedImage)) {
          handleInputChange('writingSamples', [...currentSamples, annotatedImage].slice(0, 3));
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