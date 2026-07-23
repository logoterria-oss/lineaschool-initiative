import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import {
  Staff, StaffStatus, ROLE_LABELS, STATUS_LABELS, listStaff,
} from '@/lib/staffApi';

const STATUS_STYLE: Record<StaffStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  active: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-700',
};

const StaffListView = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    listStaff().then((list) => {
      setStaff(list);
      setLoading(false);
    });
  }, []);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? staff.filter((s) => s.full_name.toLowerCase().includes(q)) : staff;
  }, [staff, search]);

  if (loading) {
    return <div className="text-gray-600 py-10 text-center">Загрузка...</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по ФИО"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
        </div>
        <span className="text-sm text-gray-500">Всего: {list.length}</span>
      </div>

      <div className="space-y-2">
        {list.map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3 shadow-sm"
          >
            <div className="w-9 h-9 bg-amber-100 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
              {s.avatar_url ? (
                <img src={s.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Icon name="User" size={16} className="text-amber-600" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-900 truncate">{s.full_name}</div>
              <div className="text-xs text-gray-500 truncate">
                {s.job_title || ROLE_LABELS[s.role]} · {s.phone}
              </div>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_STYLE[s.status]}`}>
              {STATUS_LABELS[s.status]}
            </span>
          </div>
        ))}
        {list.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Icon name="Users" size={36} className="mx-auto mb-3" />
            <p>Сотрудников не найдено</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffListView;
