import { useState, useRef } from 'react';
import Icon from '@/components/ui/icon';

export default function TestimonialsSection() {
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(0);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [playingVideoId, setPlayingVideoId] = useState<number | null>(null);
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement }>({});

  // Вертикальные видео-отзывы из папки public
  const videoTestimonials = [
    {
      id: 1,
      name: "Анна, мама Миши (5 лет)",
      description: "За 3 месяца сын заговорил четко",
      videoUrl: "/IMG_1141 (1) (1).mov",
    },
    {
      id: 2,
      name: "Елена, мама Софии (4 года)",
      description: "Проблемы с Р полностью решены",
      videoUrl: "/IMG_1143 (1).mov",
    },
    {
      id: 3,
      name: "Михаил, папа Артема (6 лет)",
      description: "Подготовились к школе за 2 месяца",
      videoUrl: "/IMG_1144 (1).mov",
    },
    {
      id: 4,
      name: "Светлана, мама Кати (5 лет)",
      description: "Дочка стала говорить увереннее",
      videoUrl: "/IMG_1145 (1).mov",
    },
    {
      id: 5,
      name: "Максим, папа Алисы (4 года)",
      description: "Дочка начала четко говорить",
      videoUrl: "/IMG_1146 (1).mov",
    },
    {
      id: 6,
      name: "Ирина, мама Данила (6 лет)",
      description: "Готовы к школе на 100%",
      videoUrl: "/IMG_1147 (1).mov",
    }
  ];

  // Текстовые отзывы с фотографиями
  const textTestimonials = [
    {
      id: 1,
      name: "Марина К.",
      text: "Прекрасный логопед! За 2 месяца мой сын начал говорить намного четче. Очень довольны результатом!",
      photo: "/api/placeholder/300/400",
      rating: 5
    },
    {
      id: 2,
      name: "Александр П.",
      text: "Занятия очень интересные, ребенок с удовольствием учится. Видим прогресс каждую неделю.",
      photo: "/api/placeholder/300/400",
      rating: 5
    },
    {
      id: 3,
      name: "Ольга С.",
      text: "Отличная методика! Дочка наконец-то стала произносить сложные звуки. Спасибо большое!",
      photo: "/api/placeholder/300/400",
      rating: 5
    },
    {
      id: 4,
      name: "Дмитрий М.",
      text: "Профессиональный подход, индивидуальная программа. Рекомендую всем родителям!",
      photo: "/api/placeholder/300/400",
      rating: 5
    },
    {
      id: 5,
      name: "Екатерина Л.",
      text: "За полгода занятий сын научился правильно произносить все звуки. Результат превзошел ожидания!",
      photo: "/api/placeholder/300/400",
      rating: 5
    }
  ];

  const nextTestimonial = () => {
    setActiveTestimonialIndex((prev) => (prev + 1) % textTestimonials.length);
  };

  const prevTestimonial = () => {
    setActiveTestimonialIndex((prev) => (prev - 1 + textTestimonials.length) % textTestimonials.length);
  };

  const nextVideo = () => {
    setActiveVideoIndex((prev) => (prev + 1) % videoTestimonials.length);
  };

  const prevVideo = () => {
    setActiveVideoIndex((prev) => (prev - 1 + videoTestimonials.length) % videoTestimonials.length);
  };

  const toggleVideoPlay = (videoId: number) => {
    const video = videoRefs.current[videoId];
    if (!video) return;
    
    if (playingVideoId === videoId) {
      video.pause();
      setPlayingVideoId(null);
    } else {
      // Остановить все остальные видео
      Object.values(videoRefs.current).forEach(v => v.pause());
      video.play();
      setPlayingVideoId(videoId);
    }
  };

  const handleVideoEnded = () => {
    setPlayingVideoId(null);
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Посмотрите, что говорят дети и родители, которые уже выбрали <span className="text-green-600">LineaSchool</span> для онлайн-занятий
          </h2>
        </div>

        {/* Видео-отзывы - карусель */}
        <div className="mb-20 relative">
          <div className="max-w-4xl mx-auto">
            {/* Главное видео */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
              <div className="aspect-[9/16] md:aspect-video bg-gray-900 relative">
                <video
                  ref={(el) => {
                    if (el) videoRefs.current[videoTestimonials[activeVideoIndex].id] = el;
                  }}
                  className="w-full h-full object-cover"
                  onEnded={handleVideoEnded}
                  controls={playingVideoId === videoTestimonials[activeVideoIndex].id}
                  poster=""
                >
                  <source src={videoTestimonials[activeVideoIndex].videoUrl} type="video/quicktime" />
                  <source src={videoTestimonials[activeVideoIndex].videoUrl} type="video/mp4" />
                  Ваш браузер не поддерживает видео.
                </video>
                
                {/* Кнопка воспроизведения */}
                {playingVideoId !== videoTestimonials[activeVideoIndex].id && (
                  <button
                    onClick={() => toggleVideoPlay(videoTestimonials[activeVideoIndex].id)}
                    className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center hover:bg-opacity-50 transition-all duration-300"
                  >
                    <div className="bg-white bg-opacity-95 rounded-full p-6 hover:scale-110 transition-transform duration-200">
                      <Icon name="Play" size={48} className="text-green-600 ml-2" />
                    </div>
                  </button>
                )}
                
                {/* Информация о видео */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                  <h4 className="text-white font-semibold text-lg mb-1">
                    {videoTestimonials[activeVideoIndex].name}
                  </h4>
                  <p className="text-white/90 text-sm">
                    {videoTestimonials[activeVideoIndex].description}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Навигация */}
            <button
              onClick={prevVideo}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white shadow-xl rounded-full p-4 hover:bg-gray-50 transition-colors z-10"
            >
              <Icon name="ChevronLeft" size={24} className="text-gray-600" />
            </button>
            
            <button
              onClick={nextVideo}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white shadow-xl rounded-full p-4 hover:bg-gray-50 transition-colors z-10"
            >
              <Icon name="ChevronRight" size={24} className="text-gray-600" />
            </button>
            
            {/* Миниатюры видео */}
            <div className="flex justify-center space-x-4 overflow-x-auto pb-4">
              {videoTestimonials.map((video, index) => (
                <button
                  key={video.id}
                  onClick={() => setActiveVideoIndex(index)}
                  className={`flex-shrink-0 w-20 h-28 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                    activeVideoIndex === index 
                      ? 'border-green-600 scale-105' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <video
                    className="w-full h-full object-cover pointer-events-none"
                    muted
                  >
                    <source src={video.videoUrl} type="video/quicktime" />
                    <source src={video.videoUrl} type="video/mp4" />
                  </video>
                  {/* Индикатор активного видео */}
                  {activeVideoIndex === index && (
                    <div className="absolute inset-0 bg-green-600/20 flex items-center justify-center">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            {/* Индикаторы точками */}
            <div className="flex justify-center space-x-3 mt-6">
              {videoTestimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveVideoIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    activeVideoIndex === index ? 'bg-green-600' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Текстовые отзывы с фото */}
        <div>
          <h3 className="text-2xl font-bold text-center text-gray-800 mb-12">
            Еще больше реальных отзывов
          </h3>
          
          <div className="relative max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="md:flex">
                {/* Фотография */}
                <div className="md:w-2/5">
                  <img
                    src={textTestimonials[activeTestimonialIndex].photo}
                    alt={textTestimonials[activeTestimonialIndex].name}
                    className="w-full h-80 md:h-full object-cover"
                  />
                </div>
                
                {/* Контент отзыва */}
                <div className="md:w-3/5 p-8 md:p-12 flex flex-col justify-center">
                  {/* Звездочки */}
                  <div className="flex mb-6">
                    {[...Array(textTestimonials[activeTestimonialIndex].rating)].map((_, i) => (
                      <Icon key={i} name="Star" size={24} className="text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  {/* Текст отзыва */}
                  <blockquote className="text-gray-700 text-lg md:text-xl leading-relaxed mb-8">
                    "{textTestimonials[activeTestimonialIndex].text}"
                  </blockquote>
                  
                  {/* Автор */}
                  <div>
                    <p className="font-bold text-gray-800 text-lg">
                      {textTestimonials[activeTestimonialIndex].name}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Навигация */}
            <button
              onClick={prevTestimonial}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full p-3 hover:bg-gray-50 transition-colors z-10"
            >
              <Icon name="ChevronLeft" size={24} className="text-gray-600" />
            </button>
            
            <button
              onClick={nextTestimonial}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full p-3 hover:bg-gray-50 transition-colors z-10"
            >
              <Icon name="ChevronRight" size={24} className="text-gray-600" />
            </button>

            {/* Индикаторы точками */}
            <div className="flex justify-center space-x-3 mt-8">
              {textTestimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonialIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    activeTestimonialIndex === index ? 'bg-green-600' : 'bg-gray-300'
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