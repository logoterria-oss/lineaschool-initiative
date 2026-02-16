import Icon from "@/components/ui/icon";

export default function DiagFormNavigation() {
  return (
    <nav className="bg-white shadow-sm border-b border-green-100 sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-24">
          <a href="/" className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center">
              <Icon name="BookOpen" size={32} className="text-white" />
            </div>
            <span className="text-4xl font-bold text-green-600">ЛинэяСкул</span>
          </a>
          <div className="text-lg text-gray-600">
            Форма диагностики
          </div>
        </div>
      </div>
    </nav>
  );
}