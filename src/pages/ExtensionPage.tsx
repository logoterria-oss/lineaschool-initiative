import SEOHead from "@/components/SEOHead";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Icon from "@/components/ui/icon";

export default function ExtensionPage() {
  const handleDownload = () => {
    window.open('https://chromewebstore.google.com/detail/opendyslexic-шрифт-для-ди/pcgookkdmlcbdabeiciiibgpojmledfe', '_blank');
  };

  return (
    <>
      <SEOHead
        title="Расширение для Chrome - Помощник для дислексиков | LineaSchool"
        description="Бесплатное расширение для Chrome, которое делает чтение в интернете комфортнее для людей с дислексией. Специальный шрифт, настройка интервалов и цветов."
        keywords="дислексия, расширение chrome, шрифт для дислексии, OpenDyslexic, помощник чтения"
        canonicalUrl="https://lineaschool.ru/extension"
      />
      
      <div className="min-h-screen bg-white">
        <Navigation />
        
        <main className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Шрифт OpenDyslexic на русском
(by LineaSchool)</h1>
            <p className="text-xl text-gray-600">Бесплатный помощник для людей с дислексией </p>
          </div>

          <Card className="mb-8 border-2 border-green-500">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Установить расширение</CardTitle>
              <CardDescription>
                Доступно в официальном магазине Chrome Web Store
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button 
                size="lg" 
                onClick={handleDownload}
                className="bg-green-600 hover:bg-green-700 text-lg px-8 py-6"
              >
                <Icon name="Download" className="mr-2" size={24} />
                Установить из Chrome Web Store
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-8 mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Sparkles" className="text-green-600" />
                  Возможности расширения
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <Icon name="Check" className="text-green-600 mt-1 flex-shrink-0" size={20} />
                    <span>Специальный шрифт OpenDyslexic для комфортного чтения</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="Check" className="text-green-600 mt-1 flex-shrink-0" size={20} />
                    <span>Увеличенный межстрочный интервал и расстояние между буквами</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="Check" className="text-green-600 mt-1 flex-shrink-0" size={20} />
                    <span>Увеличенный размер шрифта на любой странице</span>
                  </li>

                  <li className="flex items-start gap-2">
                    <Icon name="Check" className="text-green-600 mt-1 flex-shrink-0" size={20} />
                    <span>Работает на всех сайтах автоматически</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Settings" className="text-green-600" />
                  Как установить расширение
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4 text-gray-700">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">1</span>
                    <div>
                      <strong>Нажмите кнопку выше</strong>
                      <p className="text-gray-600 mt-1">Откроется страница расширения в Chrome Web Store</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">2</span>
                    <div>
                      <strong>Нажмите "Установить"</strong>
                      <p className="text-gray-600 mt-1">Подтвердите установку во всплывающем окне</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">3</span>
                    <div>
                      <strong>Готово!</strong>
                      <p className="text-gray-600 mt-1">Расширение установлено. Нажмите на иконку расширения в браузере для настройки</p>
                    </div>
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="HelpCircle" className="text-green-600" />
                  Часто задаваемые вопросы
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Расширение бесплатное?</h3>
                    <p className="text-gray-600">Да, расширение полностью бесплатное и без рекламы.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Работает ли на других браузерах?</h3>
                    <p className="text-gray-600">Да, расширение работает на всех браузерах на базе Chromium: Chrome, Edge, Brave, Opera и других.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Работает ли на мобильных устройствах?</h3>
                    <p className="text-gray-600">К сожалению, расширения для Chrome не поддерживаются на мобильных браузерах iOS и Android.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Как отключить расширение на конкретном сайте?</h3>
                    <p className="text-gray-600">В настройках расширения (правый верхний угол браузера) можно отключить его для текущего сайта или полностью.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}