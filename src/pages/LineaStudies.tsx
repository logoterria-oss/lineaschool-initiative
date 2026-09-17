import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import NavigationWithoutBooking from "@/components/NavigationWithoutBooking";
import LineaStudiesLogo from "@/components/LineaStudiesLogo";

export default function LineaStudies() {
  return (
    <div className="min-h-screen bg-gradient-to-bl from-green-50 via-white to-green-50/30">
      <NavigationWithoutBooking />
      <div className="flex flex-col items-center justify-center px-4 text-center py-20">
        {/* Крупная эмблема с названием — как в шапке, только большого размера */}
        <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-7 mb-6">
          <LineaStudiesLogo variant="hero" />
          <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-green-600">
            ЛинэяСтадис
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
          Научно-исследовательский центр
        </h1>
        <p className="text-lg text-gray-600 max-w-xl mb-8">
          Страница находится в разработке. Скоро здесь появится информация о наших
          исследованиях и проектах.
        </p>
        <Button
          size="lg"
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg"
          onClick={() => (window.location.href = "/")}
        >
          <Icon name="ArrowLeft" size={18} className="mr-2" />
          Вернуться на главную
        </Button>
      </div>
    </div>
  );
}