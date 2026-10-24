import { ReactNode } from 'react';
import Icon from '@/components/ui/icon';

interface Props {
  num: number;
  title: string;
  icon: string;
  color: string;
  badge?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

/** Блок дашборда: номер, заголовок, счётчик и содержимое */
const DashSection = ({ num, title, icon, color, badge, actions, children }: Props) => (
  <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
    <div className="flex items-center gap-3 flex-wrap mb-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
        <Icon name={icon as 'Sun'} size={18} />
      </div>
      <h3 className="font-semibold text-gray-900">
        <span className="text-gray-400 mr-1.5">{num}.</span>
        {title}
      </h3>
      {badge}
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </div>
    {children}
  </section>
);

export default DashSection;
