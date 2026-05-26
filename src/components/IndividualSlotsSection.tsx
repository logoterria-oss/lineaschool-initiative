import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const S20_URL = "https://functions.poehali.dev/6d9e6094-fd18-47ec-b45f-ad3ee4ba7cc2";

interface Slot {
  date: string;
  weekday: number;
  weekday_name: string;
  time_from: string;
  time_to: string;
  teacher_id: number;
  teacher_name: string;
}

interface DayGroup {
  weekday: number;
  weekday_name: string;
  slots: Slot[];
}

// Короткие имена педагогов для отображения
const TEACHER_SHORT: Record<number, string> = {
  2: "Анастасия",
  18: "Анна",
  11: "Валерия",
  4: "Дарья",
};

const TEACHER_COLOR: Record<number, string> = {
  2: "bg-purple-100 text-purple-700 border-purple-200",
  18: "bg-teal-100 text-teal-700 border-teal-200",
  11: "bg-green-100 text-green-700 border-green-200",
  4: "bg-orange-100 text-orange-700 border-orange-200",
};

export default function IndividualSlotsSection() {
  const [days, setDays] = useState<DayGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${S20_URL}?mode=free_slots`)
      .then((r) => r.json())
      .then((data) => {
        setDays(data.slots_by_weekday || []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  if (error) return null;

  return (
    <section id="individual" className="py-16 md:py-24 bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="text-center mb-10 md:mb-14">
          <span className="inline-block bg-green-100 text-green-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Индивидуальные занятия
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Свободные окна для записи
          </h2>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Актуальное расписание наших специалистов — выберите удобный день и время
          </p>
        </div>

        {/* Легенда педагогов */}
        {!loading && days.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {Object.entries(TEACHER_SHORT).map(([id, name]) => (
              <span
                key={id}
                className={`text-xs font-medium px-3 py-1 rounded-full border ${TEACHER_COLOR[Number(id)]}`}
              >
                {name}
              </span>
            ))}
          </div>
        )}

        {/* Загрузка */}
        {loading && (
          <div className="text-center py-16 text-gray-400">
            <Icon name="Loader2" size={32} className="animate-spin mx-auto mb-3 text-green-500" />
            <p>Загружаем актуальное расписание…</p>
          </div>
        )}

        {/* Слоты по дням недели */}
        {!loading && days.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {days.map((day) => {
              // Группируем слоты по времени, объединяя педагогов
              const byTime: Record<string, Slot[]> = {};
              day.slots.forEach((s) => {
                const key = `${s.time_from}–${s.time_to}`;
                if (!byTime[key]) byTime[key] = [];
                byTime[key].push(s);
              });

              return (
                <div
                  key={day.weekday}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  {/* Шапка дня */}
                  <div className="bg-green-600 px-5 py-3 flex items-center gap-2">
                    <Icon name="Calendar" size={16} className="text-green-100" />
                    <span className="font-semibold text-white">{day.weekday_name}</span>
                    <span className="ml-auto text-green-200 text-xs">
                      {Object.keys(byTime).length} окон
                    </span>
                  </div>

                  {/* Список слотов */}
                  <div className="p-4 space-y-2">
                    {Object.entries(byTime)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([timeKey, slots]) => (
                        <div
                          key={timeKey}
                          className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2"
                        >
                          <span className="font-mono font-semibold text-gray-800 text-sm">
                            {timeKey}
                          </span>
                          <div className="flex flex-wrap gap-1 justify-end">
                            {slots.map((s) => (
                              <span
                                key={s.teacher_id}
                                className={`text-xs font-medium px-2 py-0.5 rounded-full border ${TEACHER_COLOR[s.teacher_id] || "bg-gray-100 text-gray-600 border-gray-200"}`}
                              >
                                {TEACHER_SHORT[s.teacher_id] || s.teacher_name.split(" ")[0]}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Нет слотов */}
        {!loading && days.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Icon name="CalendarOff" size={40} className="mx-auto mb-3" />
            <p>Свободных окон пока нет. Напишите нам — подберём время.</p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-10 text-center">
          <p className="text-gray-600 mb-4">
            Нашли подходящее время? Запишитесь прямо сейчас
          </p>
          <a
            href="https://wa.me/79236251611"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-7 py-3 rounded-xl transition-colors shadow-md"
          >
            <Icon name="MessageCircle" size={20} />
            Записаться в WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
