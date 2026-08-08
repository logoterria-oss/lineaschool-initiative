import { useState } from "react";
import Footer from "@/components/Footer";
import DiagFormNavigation from "@/components/diag/DiagFormNavigation";
import FormSections from "@/components/DiagForm/FormSections";
import { useFormDataManager } from "@/components/DiagForm/FormDataManager";
import { useConclusionLogic } from "@/components/DiagForm/ConclusionLogic";
import { Button } from "@/components/ui/button";
import IncompleteSectionsDialog, {
  IncompleteSection,
} from "@/components/diag/IncompleteSectionsDialog";
import { checkPrimaryCompleteness } from "@/components/DiagForm/checkCompleteness";

export default function DiagForm() {
  const { formData, handleInputChange } = useFormDataManager();
  const { handleCreateConclusion } = useConclusionLogic();
  const [incomplete, setIncomplete] = useState<IncompleteSection[]>([]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Перед сохранением показываем, какие разделы остались пустыми
    const gaps = checkPrimaryCompleteness(formData);
    if (gaps.length > 0) {
      setIncomplete(gaps);
      return;
    }
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

      <IncompleteSectionsDialog
        open={incomplete.length > 0}
        sections={incomplete}
        onCancel={() => setIncomplete([])}
        onConfirm={() => {
          setIncomplete([]);
          handleCreateConclusion(formData);
        }}
      />

      <Footer />
    </div>
  );
}
