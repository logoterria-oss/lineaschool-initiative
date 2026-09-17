import { useState, useEffect } from 'react';
import AdminHeader from '@/components/AdminHeader';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import QuestionnaireDetails from '@/components/questionnaire/QuestionnaireDetails';

interface QuestionnaireResponse {
  id: number;
  child_name: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  birth_date: string;
  grade: string;
  city?: string;
  created_at: string;
}

export default function QuestionnaireResponses() {
  const [responses, setResponses] = useState<QuestionnaireResponse[]>([]);
  const [filteredResponses, setFilteredResponses] = useState<QuestionnaireResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResponse, setSelectedResponse] = useState<number | null>(null);

  useEffect(() => {
    fetchResponses();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = responses.filter(r => 
        r.child_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.parent_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredResponses(filtered);
    } else {
      setFilteredResponses(responses);
    }
  }, [searchQuery, responses]);

  const fetchResponses = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/65751635-528e-4830-bc09-e0b9c5344580?all=true');
      if (response.ok) {
        const data = await response.json();
        setResponses(data);
        setFilteredResponses(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки анкет:', error);
    } finally {
      setIsLoading(false);
    }
  };



  const viewDetails = (id: number) => {
    setSelectedResponse(selectedResponse === id ? null : id);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Icon name="Loader2" className="animate-spin h-8 w-8 mx-auto mb-2 text-blue-600" />
          <p className="text-gray-600">Загрузка анкет...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <AdminHeader />

      <main className="flex-1 py-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Анкеты родителей</h1>
            <Button onClick={fetchResponses} variant="outline">
              <Icon name="RefreshCw" size={18} className="mr-2" />
              Обновить
            </Button>
          </div>

          <div className="mb-6">
            <Input
              placeholder="Поиск по ФИО ребенка или родителя..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>

          {filteredResponses.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Icon name="FileText" size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">
                {searchQuery ? 'Анкеты не найдены' : 'Пока нет заполненных анкет'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredResponses.map((response) => (
                <div key={response.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {response.child_name}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                          <div>
                            <Icon name="User" size={16} className="inline mr-2" />
                            Родитель: {response.parent_name}
                          </div>
                          <div>
                            <Icon name="Calendar" size={16} className="inline mr-2" />
                            Дата рождения: {response.birth_date}
                          </div>
                          <div>
                            <Icon name="GraduationCap" size={16} className="inline mr-2" />
                            Класс: {response.grade}
                          </div>
                          {response.city && (
                            <div>
                              <Icon name="MapPin" size={16} className="inline mr-2" />
                              {response.city}
                            </div>
                          )}
                          <div>
                            <Icon name="Clock" size={16} className="inline mr-2" />
                            Заполнена: {formatDate(response.created_at)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button asChild variant="outline" size="sm" title="Постоянная ссылка на анкету">
                          <a href={`/anketa/${response.id}`} target="_blank" rel="noreferrer">
                            <Icon name="ExternalLink" size={18} />
                          </a>
                        </Button>
                        <Button
                          onClick={() => viewDetails(response.id)}
                          variant="outline"
                          size="sm"
                        >
                          <Icon name={selectedResponse === response.id ? "ChevronUp" : "ChevronDown"} size={18} />
                        </Button>
                      </div>
                    </div>

                    {selectedResponse === response.id && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <QuestionnaireDetails responseId={response.id} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}