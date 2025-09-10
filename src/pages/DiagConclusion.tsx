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
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Логопедическое заключение
            </h1>
            <p className="text-lg text-gray-600">№ {serialNumber}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-8 space-y-8">
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