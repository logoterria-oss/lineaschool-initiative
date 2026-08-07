import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Footer from '@/components/Footer';
import DiagFormNavigation from '@/components/diag/DiagFormNavigation';
import InterimProcessesView from '@/components/interimConclusion/InterimProcessesView';
import InterimReadingWritingView from '@/components/interimConclusion/InterimReadingWritingView';
import InterimErrorTypesView from '@/components/interimConclusion/InterimErrorTypesView';
import InterimSamplesView from '@/components/interimConclusion/InterimSamplesView';
import { fmtDate } from '@/components/interimConclusion/ConclusionChain';
import { calculateAge, ageWithUnit } from '@/components/interimDiag/age';

const API = 'https://functions.poehali.dev/ccdf6e9e-8ab6-450b-a327-e0afd0a8a31c';

export default function InterimDiagConclusion() {
  const { id } = useParams();
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setError('Не указан номер заключения');
      setLoading(false);
      return;
    }
    fetch(`${API}?id=${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && d.form_data) {
          // У ранних записей дата осмотра лежит вне снимка формы
          setData({ ...d.form_data, _examDate: d.date_of_examination });
        } else setError('Заключение не найдено');
      })
      .catch(() => setError('Не удалось загрузить заключение'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (data?.childName) {
      const dateStr = new Date().toLocaleDateString('ru-RU').replace(/\./g, '-');
      document.title = `${data.childName} - промежуточная диагностика - ${dateStr}`;
    }
  }, [data]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-gray-500">Загрузка заключения…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="mb-3 text-2xl font-semibold text-gray-900">Ошибка</h2>
          <p className="mb-6 text-gray-600">{error || 'Данные отсутствуют'}</p>
          <a
            href="/interim_diag_form"
            className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground"
          >
            К форме диагностики
          </a>
        </div>
      </div>
    );
  }

  const rw = data.interimReadingWriting || {};
  const history = data.interimHistory || [];
  const todayDate = data.interimDate || data._examDate || null;
  const primaryDate = data.primaryDate || null;
  // Возраст на дату диагностики. Если в форме его не заполнили —
  // считаем сами из даты рождения, чтобы в заключении не было прочерка
  const age = data.age || calculateAge(data.birthDate, todayDate);

  return (
    <div className="min-h-screen bg-white">
      <DiagFormNavigation />

      <main className="flex-1 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="no-print mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-gray-900">
              Заключение по промежуточной диагностике
            </h1>
            <p className="mb-4 text-lg text-gray-600">№ {id}</p>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
            >
              Скачать PDF
            </button>
          </div>

          <div className="print-page space-y-8 rounded-lg border border-gray-200 bg-white p-8">
            <div className="mb-2 hidden print:block">
              <img
                src="https://cdn.poehali.dev/projects/a085bb84-fdb7-4eab-976d-509a5a45c40e/bucket/602a60ff-336d-4e7c-a660-f1e187ebc3cd.png"
                alt="ЛинэяСкул"
                className="h-16 object-contain"
              />
            </div>
            <div className="mb-6 hidden text-center print:block">
              <h1 className="mb-1 text-2xl font-bold text-gray-900">
                Заключение по промежуточной диагностике
              </h1>
              <p className="text-base text-gray-600">№ {id}</p>
            </div>

            <section>
              <h2 className="mb-3 text-lg font-bold text-gray-900">Сведения о ребёнке</h2>
              {/* ФИО — на всю первую строку,
                  дата рождения, возраст и класс — на второй */}
              <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                <div className="sm:col-span-3">
                  <dt className="text-gray-500">ФИО</dt>
                  <dd className="font-medium text-gray-900">{data.childName || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Дата рождения</dt>
                  <dd className="font-medium text-gray-900">{fmtDate(data.birthDate) || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Возраст</dt>
                  <dd className="font-medium text-gray-900">{ageWithUnit(age) || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Класс</dt>
                  <dd className="font-medium text-gray-900">{data.grade || '—'}</dd>
                </div>
              </dl>
            </section>

            {data.conclusion && (
              <section>
                <h2 className="mb-3 text-lg font-bold text-gray-900">
                  Заключение первичной диагностики
                </h2>
                <p className="whitespace-pre-wrap text-sm text-gray-700">{data.conclusion}</p>
              </section>
            )}

            <InterimProcessesView
              impaired={data.interimImpaired || {}}
              baseline={data.interimBaseline || {}}
              levels={data.interimLevels || {}}
              history={history}
              primaryDate={primaryDate}
              todayDate={todayDate}
            />

            <InterimReadingWritingView
              baseline={data.interimRwBaseline || {}}
              rw={rw}
              history={history}
              primaryDate={primaryDate}
              todayDate={todayDate}
            />

            <InterimErrorTypesView
              readingErrorTypes={rw.readingErrorTypes || []}
              errorTypes={rw.errorTypes || []}
              orthoErrorTypes={rw.orthoErrorTypes || []}
            />

            <InterimSamplesView samples={rw.writingSamples || []} date={todayDate} />

            {(data.teacherRecommendations || data.parentRecommendations) && (
              <section>
                <h2 className="mb-3 text-lg font-bold text-gray-900">Рекомендации</h2>
                {data.teacherRecommendations && (
                  <div className="mb-3">
                    <h3 className="mb-1 text-base font-semibold text-gray-800">Педагогам</h3>
                    <p className="whitespace-pre-wrap text-sm text-gray-700">
                      {data.teacherRecommendations}
                    </p>
                  </div>
                )}
                {data.parentRecommendations && (
                  <div>
                    <h3 className="mb-1 text-base font-semibold text-gray-800">Родителям</h3>
                    <p className="whitespace-pre-wrap text-sm text-gray-700">
                      {data.parentRecommendations}
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* Дата диагностики и подпись — в конце, как в первичном заключении */}
            <section className="border-t border-gray-200 pt-4">
              <div className="flex items-end justify-between text-sm text-gray-700">
                <div>
                  <span className="font-semibold">Дата диагностики:</span>{' '}
                  <span className="text-gray-900">{fmtDate(todayDate) || '—'}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">Учитель-логопед:</div>
                  <div className="mt-2 text-gray-900">{data.logopedist || '—'}</div>
                  <div className="mt-6 w-48 border-b border-gray-400"></div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}