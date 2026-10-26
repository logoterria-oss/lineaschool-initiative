import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import {
  S20_URL,
  GroupsWeekResponse,
  RawLesson,
  RawTeacher,
  Customer,
  MAX_GROUP_SIZE,
  fmtDate,
  getMonday,
  addDays,
  buildGroupRowsFromLessons,
  findAgeGroupRule,
  ageFitsRule,
} from './types';
import { Booking, GroupLimit, bookingHoldsSlot, fetchBookings, fetchGroupLimits } from '@/lib/bookingsApi';
import GroupLimitsDialog from './GroupLimitsDialog';
import GroupsToolbar from './groups/GroupsToolbar';
import GroupsLegend from './groups/GroupsLegend';
import GroupsWeekGrid from './groups/GroupsWeekGrid';

const GroupsTab = () => {
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [groupsData, setGroupsData] = useState<GroupsWeekResponse | null>(null);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState('');
  const [groupsAutoJumped, setGroupsAutoJumped] = useState(false);
  const [customers, setCustomers] = useState<Record<number, Customer>>({});
  const [groupBookings, setGroupBookings] = useState<Booking[]>([]);
  const [limits, setLimits] = useState<GroupLimit[]>([]);
  const [limitsOpen, setLimitsOpen] = useState(false);
  // Возраст ребёнка для подбора групп (null — показываем все)
  const [childAge, setChildAge] = useState<number | null>(null);
  const ageFits = (day: number, time: string, teacherId: number) => {
    if (childAge == null) return true;
    const rule = findAgeGroupRule(day, time, teacherId);
    return !!rule && ageFitsRule(rule, childAge);
  };

  const loadLimits = async () => setLimits(await fetchGroupLimits());

  // Временный потолок группы на дату занятия (null — ограничения нет)
  const limitFor = (day: number, time: string, teacherId: number, groupId: number | null | undefined, date: string) =>
    limits.find(
      (l) =>
        l.weekday === day &&
        l.timeFrom === time &&
        l.teacherId === teacherId &&
        (l.groupId == null || l.groupId === groupId) &&
        l.dateFrom <= date &&
        date <= l.dateTo,
    ) || null;

  const loadGroups = async (autoJump = false) => {
    setGroupsLoading(true);
    setGroupsError('');
    try {
      let df = fmtDate(weekStart);
      let dt = fmtDate(addDays(weekStart, 6));

      // первое открытие — спросим у бэкенда ближайшую неделю с групповыми уроками
      if (autoJump) {
        try {
          const nresp = await fetch(`${S20_URL}?mode=next_group_week&date_from=${df}`);
          const ndata = await nresp.json();
          if (ndata?.date_from && ndata?.date_to) {
            df = ndata.date_from;
            dt = ndata.date_to;
            const newMonday = new Date(`${df}T00:00:00`);
            if (newMonday.getTime() !== weekStart.getTime()) {
              setWeekStart(newMonday);
              setGroupsLoading(false);
              return; // useEffect перезапустит loadGroups уже без autoJump
            }
          }
        } catch {
          // не критично — продолжим с текущей недели
        }
      }

      const resp = await fetch(`${S20_URL}?mode=lessons&date_from=${df}&date_to=${dt}`);
      const data = await resp.json();
      if (data.error) throw new Error(data.error);

      // Бэкенд возвращает {lessons:[...]} — собираем таблицу на фронте
      const lessons: RawLesson[] = Array.isArray(data.lessons) ? data.lessons : [];

      // Подтягиваем фамилии педагогов отдельным запросом (mode=teachers, если есть)
      let teachers: RawTeacher[] = [];
      try {
        const tresp = await fetch(`${S20_URL}?mode=teachers`);
        const tdata = await tresp.json();
        if (Array.isArray(tdata.teachers)) teachers = tdata.teachers;
        else if (Array.isArray(tdata.items)) teachers = tdata.items;
      } catch {
        // не критично — покажем teacher_id
      }

      const rows = buildGroupRowsFromLessons(lessons, teachers, weekStart);

      setGroupsData({
        max_size: MAX_GROUP_SIZE,
        date_from: df,
        date_to: dt,
        rows,
      });
    } catch {
      setGroupsError('Не удалось загрузить группы');
      setGroupsData(null);
    } finally {
      setGroupsLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const resp = await fetch(`${S20_URL}?mode=customers`);
      const data = await resp.json();
      const items: Customer[] = Array.isArray(data.customers) ? data.customers : [];
      const map: Record<number, Customer> = {};
      for (const c of items) {
        if (c && c.id != null) map[c.id] = c;
      }
      setCustomers(map);
    } catch {
      // не критично — покажем id вместо имён
    }
  };

  useEffect(() => {
    // при первом открытии вкладки «Группы» — ищем ближайшую неделю с уроками
    const needAutoJump = !groupsAutoJumped;
    if (needAutoJump) setGroupsAutoJumped(true);
    loadGroups(needAutoJump);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  // Брони: детей ещё нет в CRM, но места они уже занимают
  const loadGroupBookings = async () => {
    try {
      const { bookings } = await fetchBookings('all', true);
      const flat: Booking[] = [];
      for (const b of bookings) {
        for (const l of b.lessons?.length ? b.lessons : [b]) {
          const active = bookingHoldsSlot({ status: b.status, date: l.date });
          // inCrm — ребёнка уже завели в группу, он и так есть в списке
          if (l.lessonType === 'groups' && active && !l.inCrm) {
            flat.push({ ...l, childName: l.childName || b.childName });
          }
        }
      }
      setGroupBookings(flat);
    } catch {
      // не критично — покажем только состав из CRM
    }
  };

  useEffect(() => {
    loadCustomers();
    loadGroupBookings();
    loadLimits();
  }, []);

  return (
    <>
      {/* Навигация по неделе */}
      <GroupsToolbar
        weekStart={weekStart}
        onWeekChange={setWeekStart}
        childAge={childAge}
        onChildAgeChange={setChildAge}
        limitsCount={limits.length}
        limitsDisabled={!groupsData?.rows.length}
        onOpenLimits={() => setLimitsOpen(true)}
        onRefresh={() => {
          loadGroups();
          loadLimits();
        }}
      />

      <GroupLimitsDialog
        open={limitsOpen}
        onClose={() => setLimitsOpen(false)}
        rows={groupsData?.rows || []}
        limits={limits}
        onChanged={loadLimits}
      />

      {groupsLoading && (
        <div className="text-center py-12 text-gray-500">
          <Icon name="Loader2" size={32} className="animate-spin mx-auto mb-3" />
          Загрузка из S20…
        </div>
      )}
      {groupsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-4">
          {groupsError}
        </div>
      )}
      {!groupsLoading && !groupsError && groupsData && groupsData.rows.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Icon name="CalendarOff" size={36} className="mx-auto mb-3" />
          На этой неделе нет групповых занятий
        </div>
      )}

      {!groupsLoading && !groupsError && groupsData && groupsData.rows.length > 0 && (
        <>
          <GroupsLegend maxSize={groupsData.max_size} />
          <GroupsWeekGrid
            groupsData={groupsData}
            weekStart={weekStart}
            customers={customers}
            groupBookings={groupBookings}
            limitFor={limitFor}
            ageFits={ageFits}
          />
        </>
      )}
    </>
  );
};

export default GroupsTab;
