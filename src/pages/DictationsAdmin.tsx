import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import ImageAnnotator from '@/components/ImageAnnotator';
import AnnotatedImageView, { AnnotatedImageViewRef } from '@/components/AnnotatedImageView';
import AdminHeader from '@/components/AdminHeader';

interface Dictation {
  id: number;
  telegram_user_id: number;
  telegram_username: string;
  child_name: string;
  photo_file_id: string;
  photo_url: string | null;
  annotated_image: string | null;
  markup_data: any | null;
  status: string;
  diagnostician_notes: string | null;
  created_at: string;
  checked_at: string | null;
  checked_by: string | null;
}

const DictationsAdmin = () => {
  const [dictations, setDictations] = useState<Dictation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDictation, setSelectedDictation] = useState<Dictation | null>(null);
  const [notes, setNotes] = useState('');
  const [showAnnotator, setShowAnnotator] = useState(false);
  const annotatedImageRef = useRef<AnnotatedImageViewRef>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = await fetch('https://functions.poehali.dev/94ceb881-6ad6-4eff-8d2c-2975261768a0');
        const data = await response.json();
        setDictations(data.dictations || []);
        
        const savedState = localStorage.getItem('annotator_state');
        if (savedState) {
          try {
            const state = JSON.parse(savedState);
            if (state.selectedDictationId && state.showAnnotator) {
              const details = await loadDictationDetails(state.selectedDictationId);
              if (details) {
                setSelectedDictation(details);
                setNotes(details.diagnostician_notes || '');
                setShowAnnotator(true);
              }
            }
          } catch (e) {
            console.error('Failed to restore annotator state:', e);
          }
        }
      } catch (error) {
        console.error('Error loading dictations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem('annotator_state', JSON.stringify({
      showAnnotator,
      selectedDictationId: selectedDictation?.id
    }));
  }, [showAnnotator, selectedDictation]);

  const loadDictations = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/94ceb881-6ad6-4eff-8d2c-2975261768a0');
      const data = await response.json();
      setDictations(data.dictations || []);
    } catch (error) {
      console.error('Error loading dictations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDictationDetails = async (id: number) => {
    try {
      const response = await fetch(`https://functions.poehali.dev/94ceb881-6ad6-4eff-8d2c-2975261768a0?id=${id}`);
      const data = await response.json();
      return data.dictation;
    } catch (error) {
      console.error('Error loading dictation details:', error);
      return null;
    }
  };

  const markAsChecked = async (id: number) => {
    try {
      const markupToSave = selectedDictation?.annotated_image || (selectedDictation?.markup_data ? JSON.stringify(selectedDictation.markup_data) : '');
      await fetch('https://functions.poehali.dev/94ceb881-6ad6-4eff-8d2c-2975261768a0', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_checked',
          id,
          notes,
          annotated_image: markupToSave
        })
      });
      await loadDictations();
      setSelectedDictation(null);
      setNotes('');
      setShowAnnotator(false);
      localStorage.removeItem('annotator_state');
    } catch (error) {
      console.error('Error marking dictation:', error);
    }
  };

  const handleSaveAnnotation = async (data: { markup: string, imageUrl: string, croppedImageUrl?: string }) => {
    if (!selectedDictation) return;
    
    console.log('handleSaveAnnotation called');
    
    try {
      const response = await fetch('https://functions.poehali.dev/94ceb881-6ad6-4eff-8d2c-2975261768a0', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_annotation',
          id: selectedDictation.id,
          markup_data: data.markup,
          annotated_image: data.imageUrl
        })
      });
      
      if (!response.ok) {
        throw new Error(`Save failed: ${response.status}`);
      }
      
      const saveResult = await response.json();
      console.log('Save successful:', saveResult);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const updatedDictation = await loadDictationDetails(selectedDictation.id);
      
      if (updatedDictation) {
        setSelectedDictation(updatedDictation);
        console.log('Dictation updated with markup');
      }
    } catch (error) {
      console.error('Error saving annotation:', error);
    }
  };



  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Ожидает</Badge>;
      case 'checked':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Проверено</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="p-4 md:p-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            <Icon name="FileText" className="inline mr-2" size={24} />
            Диктанты для проверки
          </h1>
          <Button onClick={loadDictations} variant="outline">
            <Icon name="RefreshCw" className="mr-2" size={16} />
            Обновить
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[350px_1fr] gap-4 md:gap-6">
          <div className="space-y-4">
            <h2 className="text-lg md:text-xl font-semibold mb-4">Список диктантов</h2>
            {dictations.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  Нет диктантов для проверки
                </CardContent>
              </Card>
            ) : (
              dictations.map((dictation) => (
                <Card
                  key={dictation.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedDictation?.id === dictation.id ? 'ring-2 ring-green-500' : ''
                  }`}
                  onClick={async () => {
                    const details = await loadDictationDetails(dictation.id);
                    if (details) {
                      setSelectedDictation(details);
                      setNotes(details.diagnostician_notes || '');
                    }
                    setShowAnnotator(false);
                  }}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{dictation.child_name}</CardTitle>
                      {getStatusBadge(dictation.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Icon name="User" className="mr-2" size={14} />
                        @{dictation.telegram_username || 'Неизвестно'}
                      </div>
                      <div className="flex items-center">
                        <Icon name="Calendar" className="mr-2" size={14} />
                        {new Date(dictation.created_at).toLocaleString('ru-RU')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div>
            {selectedDictation ? (
              <Card>
                <CardHeader>
                  <CardTitle>Проверка диктанта</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">ФИ ребёнка:</h3>
                    <p className="text-lg">{selectedDictation.child_name}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Фото диктанта:</h3>
                    {selectedDictation.photo_file_id ? (
                      showAnnotator ? (
                        <ImageAnnotator
                          imageUrl={`https://functions.poehali.dev/4851ee2e-1347-4e9e-bc62-d13f2066a8fc?file_id=${encodeURIComponent(selectedDictation.photo_file_id)}`}
                          onSave={handleSaveAnnotation}
                          savedMarkup={selectedDictation.markup_data ? JSON.stringify(selectedDictation.markup_data) : null}
                        />
                      ) : (
                        <div className="space-y-2">
                          <div className="bg-white rounded-lg border overflow-hidden">
                            <AnnotatedImageView
                              ref={annotatedImageRef}
                              imageUrl={`https://functions.poehali.dev/4851ee2e-1347-4e9e-bc62-d13f2066a8fc?file_id=${encodeURIComponent(selectedDictation.photo_file_id)}`}
                              markupData={selectedDictation.markup_data}
                              alt={`Диктант ${selectedDictation.child_name}`}
                              className="w-full h-auto"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowAnnotator(true)}
                              className="flex-1"
                            >
                              <Icon name="Pencil" className="mr-1" size={14} />
                              {selectedDictation.markup_data ? 'Редактировать проверку' : 'Разметить ошибки'}
                            </Button>
                            {selectedDictation.markup_data && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  annotatedImageRef.current?.downloadImage(`${selectedDictation.child_name}_проверка.png`);
                                }}
                                className="flex-1"
                              >
                                <Icon name="Download" className="mr-1" size={14} />
                                Скачать
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-500">
                        Фото недоступно
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Заметки диагноста:</h3>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Добавьте ваши заметки..."
                      rows={6}
                      className="w-full"
                    />
                  </div>

                  {selectedDictation.status === 'pending' && (
                    <Button
                      onClick={() => markAsChecked(selectedDictation.id)}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Icon name="Check" className="mr-2" size={16} />
                      Отметить как проверенное
                    </Button>
                  )}

                  {selectedDictation.status === 'checked' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center text-green-800">
                        <Icon name="CheckCircle" className="mr-2" size={16} />
                        <span className="font-semibold">Проверено</span>
                      </div>
                      {selectedDictation.checked_at && (
                        <p className="text-sm text-green-700 mt-1">
                          {new Date(selectedDictation.checked_at).toLocaleString('ru-RU')}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center text-gray-500">
                  <Icon name="FileText" className="mx-auto mb-4" size={48} />
                  <p>Выберите диктант из списка для проверки</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default DictationsAdmin;