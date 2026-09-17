import { useParams } from 'react-router-dom';
import QuestionnaireDetails from '@/components/questionnaire/QuestionnaireDetails';

/**
 * Постоянная страница просмотра заполненной анкеты — /anketa/:id.
 * Именно эту ссылку мы отдаём «Окну взаимодействия», по ней сотрудник
 * открывает ответы прямо из чата с клиентом.
 */
export default function QuestionnaireView() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen bg-white py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {id ? (
          <QuestionnaireDetails responseId={id} showHeader />
        ) : (
          <p className="text-center text-gray-600">Анкета не указана</p>
        )}
      </div>
    </div>
  );
}
