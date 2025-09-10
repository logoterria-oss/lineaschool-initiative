import { DiagData } from '@/types/DiagData';

interface RecommendationsViewProps {
  diagData: DiagData;
}

export default function RecommendationsView({ diagData }: RecommendationsViewProps) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">
        Рекомендации и направления работы
      </h2>
      <div className="space-y-4 text-sm">
        {diagData.recommendations && diagData.recommendations.length > 0 && (
          <div>
            <strong>Рекомендации:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1 ml-4">
              {diagData.recommendations.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ol>
          </div>
        )}
        
        {diagData.workDirections && diagData.workDirections.length > 0 && (
          <div>
            <strong>Направления работы:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1 ml-4">
              {diagData.workDirections.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </section>
  );
}