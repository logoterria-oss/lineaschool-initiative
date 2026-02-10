import { DiagData } from '@/types/DiagData';

interface ConclusionViewProps {
  diagData: DiagData;
}

export default function ConclusionView({ diagData }: ConclusionViewProps) {
  const generateConclusion = () => {
    try {
      const conclusionParts = [];
      
      if (diagData.speechDisorders && Array.isArray(diagData.speechDisorders) && diagData.speechDisorders.length > 0) {
        const speechText = diagData.speechDisorders.map(disorder => {
          if (disorder === "нарушения звукопроизношения" && diagData.soundProductionType) {
            return `${disorder} (${diagData.soundProductionType})`;
          }
          if (disorder === "нарушения языкового анализа и синтеза" && diagData.languageAnalysisType) {
            return `${disorder} (${diagData.languageAnalysisType})`;
          }
          return disorder;
        }).join(', ');
        conclusionParts.push(speechText);
      }
      
      if (diagData.dyslexiaTypes && Array.isArray(diagData.dyslexiaTypes) && diagData.dyslexiaTypes.length > 0) {
        conclusionParts.push(diagData.dyslexiaTypes.join(', '));
      }
      
      if (diagData.dysgraphiaTypes && Array.isArray(diagData.dysgraphiaTypes) && diagData.dysgraphiaTypes.length > 0) {
        conclusionParts.push(diagData.dysgraphiaTypes.join(', '));
      }
      
      if (diagData.brainSyndromes && Array.isArray(diagData.brainSyndromes) && diagData.brainSyndromes.length > 0) {
        conclusionParts.push(diagData.brainSyndromes.join(', '));
      }
      
      return conclusionParts.length > 0 
        ? conclusionParts.join('. ') + '.'
        : 'Заключение не сформировано.';
    } catch (error) {
      console.error('Ошибка формирования заключения:', error);
      return 'Ошибка при формировании заключения.';
    }
  };

  return (
    <section>
      <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">
        Заключение
      </h2>
      <div className="text-sm leading-relaxed">
        {generateConclusion()}
      </div>
    </section>
  );
}