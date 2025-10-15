import { useState } from "react";
import { useParams } from "react-router-dom";
import Footer from "@/components/Footer";
import DiagFormNavigation from "@/components/diag/DiagFormNavigation";
import LoadingState from "@/components/diag/LoadingState";
import ErrorState from "@/components/diag/ErrorState";
import PersonalDataView from "@/components/diag/PersonalDataView";
import AnamnesticsView from "@/components/diag/AnamnesticsView";
import SpeechView from "@/components/diag/SpeechView";
import WrittenSpeechView from "@/components/diag/WrittenSpeechView";
import ConclusionView from "@/components/diag/ConclusionView";
import RecommendationsView from "@/components/diag/RecommendationsView";
import SignatureView from "@/components/diag/SignatureView";
import ImageModal from "@/components/diag/ImageModal";
import { useDiagData } from "@/hooks/useDiagData";

export default function DiagConclusion() {
  const { serialNumber } = useParams();
  const { diagData, loading, error } = useDiagData(serialNumber);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} serialNumber={serialNumber} />;
  }

  if (!diagData || typeof diagData !== 'object') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Ошибка загрузки</h2>
          <p className="text-gray-600 mb-6">Данные повреждены или отсутствуют</p>
          <button 
            onClick={() => window.location.href = '/diag_form'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Заполнить форму заново
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <DiagFormNavigation />

      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 no-print">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Логопедическое заключение
            </h1>
            <p className="text-lg text-gray-600 mb-4">№ {serialNumber}</p>
            
            <div className="flex justify-center">
              <button
                onClick={async () => {
                  try {
                    const { generatePDF } = await import('@/utils/pdfGenerator');
                    await generatePDF(diagData, serialNumber || 'Unknown');
                  } catch (error) {
                    console.error('Ошибка генерации PDF:', error);
                    alert('Не удалось создать PDF файл');
                  }
                }}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Скачать PDF
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-8 space-y-8 print-page">
            {/* Логотип школы сверху - только для печати */}
            <div className="hidden print:block mb-4">
              <img 
                src="https://cdn.poehali.dev/files/de9188c6-e5b1-4bed-8da4-7cdaf08d2550.png" 
                alt="LineaSchool" 
                className="h-16 object-contain"
              />
            </div>

            {/* Заголовок - только для печати */}
            <div className="hidden print:block text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Логопедическое заключение
              </h1>
              <p className="text-base text-gray-600">№ {serialNumber}</p>
            </div>

            <PersonalDataView diagData={diagData} />
            <AnamnesticsView diagData={diagData} />
            <SpeechView diagData={diagData} />
            <WrittenSpeechView diagData={diagData} onImageClick={setSelectedImage} />
            <ConclusionView diagData={diagData} />
            <RecommendationsView diagData={diagData} />
            <SignatureView diagData={diagData} />
          </div>
        </div>
      </main>

      <Footer />
      
      <ImageModal 
        selectedImage={selectedImage} 
        onClose={() => setSelectedImage(null)} 
      />
    </div>
  );
}