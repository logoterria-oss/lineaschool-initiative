import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PersonalDataSection from "@/components/DiagResult/PersonalDataSection";
import AnamnesesDataSection from "@/components/DiagResult/AnamnesesDataSection";
import ExpressiveSpeechSection from "@/components/DiagResult/ExpressiveSpeechSection";
import ImpressiveSpeechSection from "@/components/DiagResult/ImpressiveSpeechSection";
import WrittenSpeechSection from "@/components/DiagResult/WrittenSpeechSection";
import ConclusionSections from "@/components/DiagResult/ConclusionSections";
import type { DiagData } from "@/types/diagData";

const DiagResult = () => {
  const { id } = useParams();
  const [diagData, setDiagData] = useState<DiagData | null>(null);

  useEffect(() => {
    const data = localStorage.getItem(`diag_${id}`);
    if (data) {
      setDiagData(JSON.parse(data));
    }
  }, [id]);

  if (!diagData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation hideBookButton={true} />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h1 className="text-3xl font-bold mb-8">Заключение не найдено</h1>
            <p>Диагностические данные не найдены.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation hideBookButton={true} />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold text-center mb-8">Логопедическое заключение</h1>
          
          <div className="space-y-6">
            <PersonalDataSection diagData={diagData} />
            <AnamnesesDataSection diagData={diagData} />
            <ImpressiveSpeechSection diagData={diagData} />
            <ExpressiveSpeechSection diagData={diagData} />
            <WrittenSpeechSection diagData={diagData} />
            <ConclusionSections diagData={diagData} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DiagResult;