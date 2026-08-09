import { useState } from 'react';

const SAVE_LEAD_URL = 'https://functions.poehali.dev/99e752b7-e754-4be4-8fe8-1b666731a12c';
const PAYMENT_INIT_URL = 'https://functions.poehali.dev/9f468e7d-1f22-4bde-8030-cd12879879e5';

export type PaymentTarget = {
  /** Что оплачивают — попадёт в чек и в заявку */
  title: string;
  /** Сумма в рублях */
  price: number;
};

export function usePayment() {
  const [target, setTarget] = useState<PaymentTarget | null>(null);
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clientName = `${lastName.trim()} ${firstName.trim()}`.trim();
  const isNameValid = lastName.trim().length >= 2 && firstName.trim().length >= 2;

  const open = (payment: PaymentTarget) => setTarget(payment);

  const close = () => {
    setTarget(null);
    setLastName('');
    setFirstName('');
  };

  const submit = async () => {
    if (!isNameValid || !target || isSubmitting) return;
    setIsSubmitting(true);

    const amount = target.price * 100;
    const orderId = `ORDER_${Date.now()}`;

    try {
      await fetch(SAVE_LEAD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: clientName,
          plan: target.title,
          amount: target.price,
          order_id: orderId,
        }),
      });

      const response = await fetch(PAYMENT_INIT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          order: orderId,
          description: target.title,
          receipt: {
            Email: 'info@lineaschool.ru',
            Taxation: 'usn_income',
            FfdVersion: '1.2',
            Items: [
              {
                Name: target.title,
                Price: amount,
                Quantity: 1,
                Amount: amount,
                Tax: 'none',
                PaymentMethod: 'full_prepayment',
                PaymentObject: 'service',
                MeasurementUnit: 'pc',
              },
            ],
          },
        }),
      });

      const result = await response.json();
      if (result.PaymentURL) {
        window.location.href = result.PaymentURL;
      } else {
        alert(`Ошибка: ${result.error || 'Не удалось создать платёж'}`);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Ошибка при создании платежа. Попробуйте позже.');
      setIsSubmitting(false);
    }
  };

  return {
    target,
    lastName,
    firstName,
    isNameValid,
    isSubmitting,
    setLastName,
    setFirstName,
    open,
    close,
    submit,
  };
}
