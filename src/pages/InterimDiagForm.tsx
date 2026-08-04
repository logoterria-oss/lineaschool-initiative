import { useState } from 'react';
import Footer from '@/components/Footer';
import DiagFormNavigation from '@/components/diag/DiagFormNavigation';
import InterimPersonalDataSection, {
  InterimPersonalData,
  InterimStudent,
} from '@/components/interimDiag/InterimPersonalDataSection';
import InterimImpairedProcessesSection from '@/components/interimDiag/InterimImpairedProcessesSection';
import InterimPrimaryConclusionSection from '@/components/interimDiag/InterimPrimaryConclusionSection';
import InterimReadingWritingSection from '@/components/interimDiag/InterimReadingWritingSection';
import { buildPrimaryConclusion } from '@/components/interimDiag/primaryConclusion';
import {
  computeImpairedFromPrimary,
  computeBaselineLevels,
  EMPTY_IMPAIRED_STATE,
  ImpairedProcessKey,
  ImpairedProcessesState,
  ProcessLevel,
  ProcessLevelsState,
} from '@/components/interimDiag/impairedProcesses';
import {
  EMPTY_RW_STATE,
  ReadingWritingBaseline,
  ReadingWritingState,
  baselineFromPrimary,
  collectPrimaryErrorTypes,
  errorQualityHint,
} from '@/components/interimDiag/readingWriting';

export default function InterimDiagForm() {
  const [personal, setPersonal] = useState<InterimPersonalData>({
    childName: '',
    birthDate: '',
    age: '',
    grade: '',
  });

  const [impaired, setImpaired] = useState<ImpairedProcessesState>({ ...EMPTY_IMPAIRED_STATE });
  const [baseline, setBaseline] = useState<ProcessLevelsState>({});
  const [levels, setLevels] = useState<ProcessLevelsState>({});
  const [primaryData, setPrimaryData] = useState<InterimStudent['primary']>(undefined);
  const [autoFilled, setAutoFilled] = useState(false);
  const [primaryConclusion, setPrimaryConclusion] = useState('');
  const [studentSelected, setStudentSelected] = useState(false);

  const [rwBaseline, setRwBaseline] = useState<ReadingWritingBaseline>({
    readingSpeed: '',
    readingComprehension: '',
    dysgraphicErrors: '',
    dysorthographicErrors: '',
    totalErrors: '',
  });
  const [rw, setRw] = useState<ReadingWritingState>({ ...EMPTY_RW_STATE });

  const patchPersonal = (patch: Partial<InterimPersonalData>) =>
    setPersonal((prev) => ({ ...prev, ...patch }));

  const handleSelectStudent = (student: InterimStudent) => {
    const nextImpaired = computeImpairedFromPrimary(student.primary);
    const nextBaseline = computeBaselineLevels(student.primary, nextImpaired);
    setImpaired(nextImpaired);
    setBaseline(nextBaseline);
    // По умолчанию «стало» = «было», логопед меняет вручную
    setLevels({ ...nextBaseline });
    setPrimaryData(student.primary);
    setAutoFilled(true);
    setPrimaryConclusion(buildPrimaryConclusion(student.primary));
    setStudentSelected(true);
    setRwBaseline(baselineFromPrimary(student.primary));
    setRw({ ...EMPTY_RW_STATE, errorTypes: collectPrimaryErrorTypes(student.primary) });
  };

  const patchRw = (patch: Partial<ReadingWritingState>) =>
    setRw((prev) => ({ ...prev, ...patch }));

  const rwHint = errorQualityHint(rwBaseline, rw);

  const handleImpairedChange = (key: ImpairedProcessKey, checked: boolean) => {
    setImpaired((prev) => ({ ...prev, [key]: checked }));
    if (checked) {
      // Дозаполняем «было» и «стало» для процесса, включённого вручную
      const single = computeBaselineLevels(primaryData, { ...EMPTY_IMPAIRED_STATE, [key]: true });
      const lvl = single[key] || 'не соответствует возрастной норме';
      setBaseline((prev) => ({ ...prev, [key]: prev[key] || lvl }));
      setLevels((prev) => ({ ...prev, [key]: prev[key] || lvl }));
    }
  };

  const handleLevelChange = (key: ImpairedProcessKey, level: ProcessLevel) =>
    setLevels((prev) => ({ ...prev, [key]: level }));

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
            <InterimPersonalDataSection
              data={personal}
              onChange={patchPersonal}
              onSelectStudent={handleSelectStudent}
            />
            <InterimPrimaryConclusionSection
              conclusion={primaryConclusion}
              selected={studentSelected}
              hint={rwHint}
            />
            <InterimImpairedProcessesSection
              value={impaired}
              baseline={baseline}
              levels={levels}
              onChange={handleImpairedChange}
              onLevelChange={handleLevelChange}
              autoFilled={autoFilled}
            />
            <InterimReadingWritingSection
              baseline={rwBaseline}
              value={rw}
              onChange={patchRw}
              selected={studentSelected}
            />
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}