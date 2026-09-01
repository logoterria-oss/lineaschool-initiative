import { MAX_GROUP_SIZE, fmtRu, addDays } from './types';
import { ScheduleType, WEEKDAY_FULL } from './pdfExportUtils';
import { IndStableDay, GroupStableDay } from './useScheduleData';

interface ExportPdfPreviewProps {
  printRef: React.RefObject<HTMLDivElement>;
  logoData: string;
  startDate: Date;
  type: ScheduleType;
  isOnce?: boolean;
  indStableDays: IndStableDay[];
  groupStableDays: GroupStableDay[];
  weekdayOf: (dayOffset: number) => number;
  fmtFrom: (d: Date) => string;
}

const ExportPdfPreview = ({
  printRef,
  logoData,
  startDate,
  type,
  isOnce = false,
  indStableDays,
  groupStableDays,
  weekdayOf,
  fmtFrom,
}: ExportPdfPreviewProps) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div ref={printRef} className="bg-white p-6" style={{ width: 720 }}>
        <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #e5e7eb' }}>
          {logoData && (
            <img
              src={logoData}
              alt="ЛинэяСкул"
              style={{ height: 84, objectFit: 'contain' }}
            />
          )}
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
          {isOnce ? 'Свободные слоты для разового переноса' : 'Свободные слоты для записи'}
        </h1>
        <p style={{ fontSize: 20, color: '#4b5563', marginBottom: 12 }}>
          {isOnce ? 'Даты: ' : 'Начало занятий: '}
          {fmtRu(startDate)} – {fmtRu(addDays(startDate, 6))}
        </p>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: 6,
            padding: '6px 10px',
            marginBottom: 16,
            fontSize: 14,
            lineHeight: 1,
            fontWeight: 700,
            color: '#92400e',
          }}
        >
          ⏰ Время указано по Москве (МСК, UTC+3)
        </div>

        {/* Индивидуальные */}
        {(type === 'individual' || type === 'both') && (
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 23, fontWeight: 700, color: '#0f766e', marginBottom: 8 }}>
              Индивидуальные занятия
            </h2>
            {indStableDays.length === 0 ? (
              <p style={{ fontSize: 18, color: '#9ca3af' }}>Свободных слотов нет</p>
            ) : (
              indStableDays.map((day) => (
                <div key={day.dayOffset} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#374151' }}>
                    {WEEKDAY_FULL[weekdayOf(day.dayOffset)]}
                    {isOnce && (
                      <span style={{ fontWeight: 400, color: '#6b7280' }}>
                        {' '}
                        {fmtRu(addDays(startDate, day.dayOffset))}
                      </span>
                    )}
                  </div>
                  {day.items.map((item) => (
                    <div key={item.time} style={{ fontSize: 18, color: '#4b5563', paddingLeft: 12 }}>
                      {item.time.slice(0, 5)} —{' '}
                      {item.teachers.map((t, i) => (
                        <span key={i}>
                          {i > 0 && ', '}
                          {t.name}
                          {t.fromDate && (
                            <span style={{ color: '#b45309', fontWeight: 600 }}> ({fmtFrom(t.fromDate)})</span>
                          )}
                          {t.substituteName && (
                            <span style={{ color: '#b45309', fontWeight: 600 }}>
                              {' '}
                              — до{' '}
                              {t.substituteUntil
                                ? fmtRu(new Date(`${t.substituteUntil}T00:00:00`))
                                : ''}{' '}
                              заменяет {t.substituteName}
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        )}

        {/* Групповые */}
        {(type === 'groups' || type === 'both') && (
          <div>
            <h2 style={{ fontSize: 23, fontWeight: 700, color: '#0f766e', marginBottom: 8 }}>Групповые занятия</h2>
            {groupStableDays.length === 0 ? (
              <p style={{ fontSize: 18, color: '#9ca3af' }}>Свободных мест нет</p>
            ) : (
              groupStableDays.map((day) => (
                <div key={day.dayOffset} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#374151' }}>
                    {WEEKDAY_FULL[weekdayOf(day.dayOffset)]}
                    {isOnce && (
                      <span style={{ fontWeight: 400, color: '#6b7280' }}>
                        {' '}
                        {fmtRu(addDays(startDate, day.dayOffset))}
                      </span>
                    )}
                  </div>
                  {day.items.map((x, i) => (
                    <div key={i} style={{ fontSize: 18, color: '#4b5563', paddingLeft: 12 }}>
                      {x.time} — {x.teacher} (свободно {x.free} из {MAX_GROUP_SIZE})
                      {x.ageLabel && (
                        <span style={{ color: '#0f766e', fontWeight: 600, fontSize: 14 }}> — {x.ageLabel}</span>
                      )}
                      {x.fromDate && (
                        <span style={{ color: '#b45309', fontWeight: 600 }}> ({fmtFrom(x.fromDate)})</span>
                      )}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportPdfPreview;