import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface PaymentLead {
  id: number;
  name: string;
  plan: string;
  amount: number;
  order_id: string;
  created_at: string;
}

export default function PaymentLeadsPage() {
  const [leads, setLeads] = useState<PaymentLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/63eeb76f-c729-4aa3-a483-7f5b321bc4c2');
      const data = await response.json();
      setLeads(data.leads || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Заявки на оплату</h1>
          <p className="text-gray-600 mt-2">Всего заявок: {leads.length}</p>
        </div>

        <div className="grid gap-4">
          {leads.map((lead) => (
            <Card key={lead.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center mb-3">
                    <Icon name="User" size={20} className="text-green-500 mr-2" />
                    <span className="text-xl font-semibold text-gray-900">{lead.name}</span>
                  </div>
                  <div className="mb-2">
                    <span className="text-sm text-gray-500">Тариф:</span>
                    <div className="font-medium text-gray-900">{lead.plan}</div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(lead.created_at)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    ID: {lead.order_id}
                  </div>
                </div>

                <div className="text-right">
                  <div className="mb-2">
                    <span className="text-2xl font-bold text-green-600">
                      {lead.amount.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {leads.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Пока нет заявок на оплату
            </div>
          )}
        </div>
      </div>
    </div>
  );
}