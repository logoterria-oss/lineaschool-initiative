import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import NavigationWithoutBooking from "@/components/NavigationWithoutBooking";

export default function LineaStudies() {
  return (
    <div className="min-h-screen bg-gradient-to-bl from-green-50 via-white to-green-50/30">
      <NavigationWithoutBooking />
      <div className="flex flex-col items-center justify-center px-4 text-center py-20">
        <div className="w-20 h-20 bg-green-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
          <Icon name="FlaskConical" size={40} className="text-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
          Научно-исследовательский центр ЛинэяСтадис
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
