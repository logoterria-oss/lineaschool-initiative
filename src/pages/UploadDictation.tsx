import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';

export default function UploadDictation() {
  const [parentName, setParentName] = useState('');
  const [childName, setChildName] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Файл слишком большой',
          description: 'Максимальный размер файла — 10 МБ',
          variant: 'destructive'
        });
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!parentName.trim() || !childName.trim()) {
      toast({
        title: 'Заполните все поля',
        description: 'Укажите ФИО родителя и ребёнка',
        variant: 'destructive'
      });
      return;
    }

    if (!imageFile) {
      toast({
        title: 'Добавьте фото диктанта',
        description: 'Выберите изображение для загрузки',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      
      reader.onload = async () => {
        const base64Image = reader.result as string;

        const response = await fetch('https://functions.poehali.dev/93d8070e-4f07-4586-97a9-9c2541aa0185', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            parent_name: parentName.trim(),
            child_name: childName.trim(),
            image: base64Image
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          toast({
            title: 'Диктант отправлен',
            description: 'Ваш диктант успешно загружен. Мы свяжемся с вами после проверки.'
          });

          setParentName('');
          setChildName('');
          setImageFile(null);
          setImagePreview(null);
        } else {
          throw new Error(data.error || 'Ошибка загрузки');
        }
      };

      reader.onerror = () => {
        throw new Error('Ошибка чтения файла');
      };
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Ошибка отправки',
        description: error instanceof Error ? error.message : 'Не удалось отправить диктант',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <Navigation />

      <main className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon name="Upload" size={32} className="text-white" />
              </div>
              <CardTitle className="text-3xl">Отправить диктант на проверку</CardTitle>
              <CardDescription className="text-base mt-2">
                Загрузите фото диктанта вашего ребёнка, и мы проверим его бесплатно
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="parentName">ФИО родителя</Label>
                  <Input
                    id="parentName"
                    type="text"
                    placeholder="Иванова Мария Петровна"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="childName">ФИ ребёнка</Label>
                  <Input
                    id="childName"
                    type="text"
                    placeholder="Иванов Иван"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Фото диктанта</Label>
                  <div className="flex flex-col gap-4">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={isLoading}
                      className="cursor-pointer"
                    />
                    {imagePreview && (
                      <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
                        <img 
                          src={imagePreview} 
                          alt="Предпросмотр диктанта" 
                          className="w-full h-auto"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                          disabled={isLoading}
                        >
                          <Icon name="X" size={20} />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Поддерживаются форматы: JPG, PNG. Максимальный размер: 10 МБ
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                      Отправка...
                    </>
                  ) : (
                    <>
                      <Icon name="Send" size={20} className="mr-2" />
                      Отправить диктант
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Icon name="Info" size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold mb-1">Что дальше?</p>
                    <p>После отправки диктант попадёт к нашим специалистам. Мы проверим работу и свяжемся с вами для обсуждения результатов.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}