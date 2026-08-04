import { useState } from 'react';
import Footer from '@/components/Footer';
import DiagFormNavigation from '@/components/diag/DiagFormNavigation';
import InterimPersonalDataSection, {
  InterimPersonalData,
} from '@/components/interimDiag/InterimPersonalDataSection';

export default function InterimDiagForm() {
  const [personal, setPersonal] = useState<InterimPersonalData>({
    childName: '',
    birthDate: '',
    age: '',
    grade: '',
  });

  const patchPersonal = (patch: Partial<InterimPersonalData>) =>
    setPersonal((prev) => ({ ...prev, ...patch }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Дальнейшие разделы и сохранение добавим позже
  };

  return (
    <div className="min-h-screen bg-white">
      <DiagFormNavigation />

      <main className="flex-1 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Промежуточная диагностика
          </h1>

          <form className="space-y-8" onSubmit={onSubmit}>
            <InterimPersonalDataSection data={personal} onChange={patchPersonal} />
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
