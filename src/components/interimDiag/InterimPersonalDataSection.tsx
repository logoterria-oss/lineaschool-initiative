import { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

export interface InterimStudent {
  id: number;
  name: string;
  birthDate: string;
  grade: string;
  examDate: string | null;
}

export interface InterimPersonalData {
  childName: string;
  birthDate: string;
  age: string;
  grade: string;
}

interface Props {
  data: InterimPersonalData;
  onChange: (patch: Partial<InterimPersonalData>) => void;
}

const DIAG_STUDENTS_URL = 'https://functions.poehali.dev/ed7f6726-88a1-4ecb-b063-ed890e8bd5cd';

function calculateAge(birthDate: string): string {
  if (!birthDate) return '';
  const parts = birthDate.split(/[-./]/);
  if (parts.length !== 3) return '';
  let [year, month, day] = parts;
  if (year.length !== 4) {
    [day, month, year] = parts;
  }
  const birth = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  if (isNaN(birth.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age.toString() : '';
}

// Класс на момент промежуточной диагностики:
// класс из первичной + число наступивших с тех пор 1 сентября.
function calculateCurrentGrade(primaryGrade: string, examDate: string | null): string {
  const base = parseInt(primaryGrade);
  if (!base || !examDate) return primaryGrade || '';
  const exam = new Date(examDate);
  if (isNaN(exam.getTime())) return primaryGrade;
  const today = new Date();

  // Учебный год, к которому относилась первичная диагностика (год начала 1.09)
  const startYear = (d: Date) => (d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1);
  const yearsPassed = startYear(today) - startYear(exam);
  const grade = base + Math.max(0, yearsPassed);
  return grade > 11 ? '11' : grade.toString();
}

export default function InterimPersonalDataSection({ data, onChange }: Props) {
  const [students, setStudents] = useState<InterimStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(DIAG_STUDENTS_URL)
      .then((r) => r.json())
      .then((res) => {
        if (res?.success && Array.isArray(res.students)) {
          const filtered = res.students.filter((s: InterimStudent) => {
            const raw = (s.name || '').trim();
            const name = raw.toLowerCase();
            if (name.includes('тест')) return false;
            if (name.includes('проверк')) return false;
            if (name.includes('абраменко') && name.includes('виктория')) return false;
            // Отсекаем неполные ФИО (меньше трёх слов: должны быть фамилия, имя, отчество)
            const words = raw.split(/\s+/).filter((w) => /[а-яёa-z]/i.test(w));
            if (words.length < 3) return false;
            return true;
          });
          setStudents(filtered);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const matches = useMemo(() => {
    const q = data.childName.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => s.name.toLowerCase().includes(q));
  }, [students, data.childName]);

  const selectStudent = (s: InterimStudent) => {
    onChange({
      childName: s.name,
      birthDate: s.birthDate,
      age: calculateAge(s.birthDate),
      grade: calculateCurrentGrade(s.grade, s.examDate),
    });
    setOpen(false);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Персональные данные</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative" ref={boxRef}>
          <Label htmlFor="childName">
            ФИО ребёнка {loading && <span className="text-sm text-gray-500">(загрузка...)</span>}
          </Label>
          <div className="relative mt-1">
            <Icon
              name="Search"
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <Input
              id="childName"
              autoComplete="off"
              className="pl-9"
              placeholder="Начните вводить ФИО и выберите из списка"
              value={data.childName}
              onFocus={() => setOpen(true)}
              onChange={(e) => {
                onChange({ childName: e.target.value });
                setOpen(true);
              }}
            />
          </div>
          {open && matches.length > 0 && (
            <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
              {matches.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50"
                  onClick={() => selectStudent(s)}
                >
                  <span>{s.name}</span>
                  <span className="text-xs text-gray-400">
                    {s.grade ? `${s.grade} кл. (первичная)` : ''}
                  </span>
                </button>
              ))}
            </div>
          )}
          {open && !loading && matches.length === 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-500 shadow-lg">
              Ученик с первичной диагностикой не найден
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="birthDate">Дата рождения</Label>
          <Input
            id="birthDate"
            className="mt-1 bg-gray-50"
            readOnly
            placeholder="Подтянется из первичной"
            value={data.birthDate}
          />
        </div>

        <div>
          <Label htmlFor="age">Возраст</Label>
          <Input
            id="age"
            className="mt-1 bg-gray-50"
            readOnly
            placeholder="Рассчитается автоматически"
            value={data.age ? `${data.age} лет` : ''}
          />
        </div>

        <div>
          <Label htmlFor="grade">Класс</Label>
          <Input
            id="grade"
            className="mt-1 bg-gray-50"
            readOnly
            placeholder="Рассчитается автоматически"
            value={data.grade ? `${data.grade} класс` : ''}
          />
        </div>
      </div>
    </div>
  );
}