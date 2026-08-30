import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import PaymentModal from '@/components/pricing2026/PaymentModal';
import { usePayment } from '@/components/pricing2026/usePayment';
import { formatPrice, getPromoDeadline } from '@/components/pricing2026/data';
import PayOptionCard from '@/components/pay/PayOptionCard';
import { getPayOffer } from '@/components/pay/offers';

/**
 * Страница оплаты одной услуги. Родитель приходит по прямой ссылке,
 * выбирает срок абонемента (если вариантов несколько) и оплачивает.
 */
export default function PayOfferPage() {
  const { slug } = useParams();
  const offer = getPayOffer(slug);
  const [selected, setSelected] = useState(0);
  const payment = usePayment();

  useEffect(() => {
    if (!offer) return;
    document.title = `Оплата — ${offer.title} | ЛинэяСкул`;

    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex, nofollow';
    document.head.appendChild(robots);
    return () => robots.remove();
  }, [offer]);

  if (!offer) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navigation />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Страница оплаты не найдена</h1>
          <p className="text-gray-600 mb-6">Проверьте ссылку или посмотрите все тарифы</p>
          <Link to="/price_2026-2027">
            <Button className="bg-green-500 hover:bg-green-600 text-white">
              Перейти к тарифам
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const option = offer.options[selected];
  const isChoice = offer.options.length > 1;
  const isPromo = Boolean(option.oldPrice);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="pt-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
          <div className="text-center mb-10">
            <span className="inline-block bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
              Оплата занятий
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{offer.title}</h1>
            {offer.subtitle && (
              <p className="text-base font-semibold text-blue-600 mb-3">{offer.subtitle}</p>
            )}
            {offer.description && (
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">{offer.description}</p>
            )}

            {isPromo && (
              <p className="mt-4 inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-sm font-semibold">
                🔥 Акция до {getPromoDeadline()}
              </p>
            )}
          </div>

          {offer.indications && offer.indications.length > 0 && (
            <div className="max-w-2xl mx-auto mb-10 bg-gray-50 rounded-xl p-5">
              <p className="text-sm font-semibold text-gray-500 mb-2">Кому подходит:</p>
              <ul className="space-y-1.5">
                {offer.indications.map((line) => (
                  <li key={line} className="flex gap-2 text-sm text-gray-700">
                    <Icon
                      name="Check"
                      size={14}
                      className="text-green-500 flex-shrink-0 mt-0.5"
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isChoice && (
            <p className="text-center text-sm font-semibold text-gray-500 mb-4">
              {offer.chooseLabel ?? 'Выберите вариант'}
            </p>
          )}

          <div
            className={`grid gap-6 ${
              isChoice ? 'md:grid-cols-3' : 'max-w-md mx-auto'
            }`}
          >
            {offer.options.map((item, index) => (
              <PayOptionCard
                key={item.title}
                option={item}
                isSelected={index === selected}
                selectable={isChoice}
                onSelect={() => setSelected(index)}
              />
            ))}
          </div>

          <div className="mt-10 max-w-md mx-auto text-center">
            <div className="mb-4 text-gray-600">
              К оплате:{' '}
              <span className="text-2xl font-bold text-gray-900">
                {formatPrice(option.totalPrice)}
              </span>
            </div>

            <Button
              size="lg"
              className="w-full bg-green-500 hover:bg-green-600 text-white text-base py-6"
              onClick={() =>
                payment.open({
                  title: isChoice
                    ? `${offer.paymentTitle ?? offer.title} — ${option.title}`
                    : offer.paymentTitle ?? offer.title,
                  price: option.totalPrice,
                })
              }
            >
              <Icon name="CreditCard" className="mr-2" size={20} />
              Перейти к оплате
            </Button>

            <p className="mt-4 text-xs text-gray-500">
              Оплата картой через защищённый платёжный сервис. Нажимая кнопку, вы принимаете{' '}
              <Link to="/oferta_2025" className="text-blue-600 underline">
                условия оферты
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />

      <PaymentModal
        target={payment.target}
        lastName={payment.lastName}
        firstName={payment.firstName}
        isNameValid={payment.isNameValid}
        isSubmitting={payment.isSubmitting}
        onLastNameChange={payment.setLastName}
        onFirstNameChange={payment.setFirstName}
        onClose={payment.close}
        onSubmit={payment.submit}
      />
    </div>
  );
}