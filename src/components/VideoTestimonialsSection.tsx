import { useState } from 'react';
import Icon from '@/components/ui/icon';

export default function VideoTestimonialsSection() {
  const [activeVideoTab, setActiveVideoTab] = useState(0);
  const [activeImageSlide, setActiveImageSlide] = useState(0);

  // Видео-отзывы
  const videoTestimonials = [
    {
      id: 1,
      title: "Анна, мама Миши (5 лет)",
      description: "За 3 месяца сын заговорил четко",
      videoUrl: "/IMG_1141 (1) (1).mov",
      poster: "https://cdn.poehali.dev/projects/a085bb84-fdb7-4eab-976d-509a5a45c40e/files/ebe5b421-b2a5-4085-a8ba-af05f320bc14.jpg"
    },
    {
      id: 2,
      title: "Елена, мама Софии (4 года)",
      description: "Проблемы с Р полностью решены",
      videoUrl: "/IMG_1143 (1).mov",
      poster: "https://cdn.poehali.dev/projects/a085bb84-fdb7-4eab-976d-509a5a45c40e/files/38a6c23a-f99e-42cf-aabe-29640a8dbf18.jpg"
    },
    {
      id: 3,
      title: "Михаил, папа Артема (6 лет)",
      description: "Логопед помог подготовиться к школе",
      videoUrl: "/IMG_1144 (1).mov",
      poster: "https://cdn.poehali.dev/projects/a085bb84-fdb7-4eab-976d-509a5a45c40e/files/a194ca8d-b0e1-4cff-ba9e-50cd144015e1.jpg"
    }
  ];

  // Текстовые отзывы с изображениями
  const imageTestimonials = [
    {
      id: 1,
      name: "Марина К.",
      text: "Прекрасный логопед! За 2 месяца мой сын начал говорить намного четче. Очень довольны результатом!",
      image: "/api/placeholder/400/300",
      rating: 5
    },
    {
      id: 2,
      name: "Александр П.",
      text: "Занятия очень интересные, ребенок с удовольствием учится. Видим прогресс каждую неделю.",
      image: "/api/placeholder/400/300",
      rating: 5
    },
    {
      id: 3,
      name: "Ольга С.",
      text: "Отличная методика! Дочка наконец-то стала произносить сложные звуки. Спасибо большое!",
      image: "/api/placeholder/400/300",
      rating: 5
    },
    {
      id: 4,
      name: "Дмитрий М.",
      text: "Профессиональный подход, индивидуальная программа. Рекомендую всем родителям!",
      image: "/api/placeholder/400/300",
      rating: 5
    }
  ];

  const nextImageSlide = () => {
    setActiveImageSlide((prev) => (prev + 1) % imageTestimonials.length);
  };

  const prevImageSlide = () => {
    setActiveImageSlide((prev) => (prev - 1 + imageTestimonials.length) % imageTestimonials.length);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Отзывы наших клиентов
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Реальные истории родителей о том, как наши логопеды помогли их детям заговорить четко и красиво
          </p>
        </div>

        {/* Видео-отзывы */}
        <div className="mb-20">
          <h3 className="text-2xl font-bold text-center text-gray-800 mb-8">
            Видео-отзывы
          </h3>
          
          {/* Табы для выбора видео */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {videoTestimonials.map((video, index) => (
              <button
                key={video.id}
                onClick={() => setActiveVideoTab(index)}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeVideoTab === index
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-green-50 border border-gray-200'
                }`}
              >
                {video.title}
              </button>
            ))}
          </div>

          {/* Активное видео */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="aspect-video bg-black">
                <video
                  key={videoTestimonials[activeVideoTab].videoUrl}
                  width="100%"
                  height="100%"
                  controls
                  preload="metadata"
                  className="w-full h-full object-contain"
                  poster={videoTestimonials[activeVideoTab].poster}
                  src={videoTestimonials[activeVideoTab].videoUrl}
                >
                  Ваш браузер не поддерживает видео
                </video>
              </div>
              <div className="p-6">
                <h4 className="text-xl font-bold text-gray-800 mb-2">
                  {videoTestimonials[activeVideoTab].title}
                </h4>
                <p className="text-gray-600">
                  {videoTestimonials[activeVideoTab].description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Текстовые отзывы с каруселью */}
        <div>
          <h3 className="text-2xl font-bold text-center text-gray-800 mb-8">
            Письменные отзывы
          </h3>
          
          <div className="relative max-w-4xl mx-auto">
            {/* Карусель */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="md:flex">
                {/* Изображение */}
                <div className="md:w-1/2">
                  <img
                    src={imageTestimonials[activeImageSlide].image}
                    alt="Отзыв"
                    className="w-full h-64 md:h-full object-cover"
                  />
                </div>
                
                {/* Контент отзыва */}
                <div className="md:w-1/2 p-8 flex flex-col justify-center">
                  {/* Звездочки */}
                  <div className="flex mb-4">
                    {[...Array(imageTestimonials[activeImageSlide].rating)].map((_, i) => (
                      <Icon key={i} name="Star" size={20} className="text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  {/* Текст отзыва */}
                  <blockquote className="text-gray-700 text-lg leading-relaxed mb-6">
                    "{imageTestimonials[activeImageSlide].text}"
                  </blockquote>
                  
                  {/* Автор */}
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">
                      {imageTestimonials[activeImageSlide].name}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Навигация */}
            <button
              onClick={prevImageSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full p-3 hover:bg-gray-50 transition-colors"
            >
              <Icon name="ChevronLeft" size={24} className="text-gray-600" />
            </button>
            
            <button
              onClick={nextImageSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full p-3 hover:bg-gray-50 transition-colors"
            >
              <Icon name="ChevronRight" size={24} className="text-gray-600" />
            </button>

            {/* Индикаторы */}
            <div className="flex justify-center space-x-2 mt-6">
              {imageTestimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImageSlide(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    activeImageSlide === index ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}