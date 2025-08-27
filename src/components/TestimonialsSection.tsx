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
    setActiveVideoIndex((prev) => {
      const next = prev + 1;
      return next >= videoTestimonials.length ? 0 : next;
    });
  };

  const prevVideo = () => {
    setActiveVideoIndex((prev) => {
      const previous = prev - 1;
      return previous < 0 ? videoTestimonials.length - 1 : previous;
    });
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

        {/* Видео-отзывы - горизонтальная карусель */}
        <div className="mb-20 relative">
          <div className="max-w-6xl mx-auto">
            {/* Контейнер с прокруткой */}
            <div className="relative">
              {/* Кнопки навигации */}
              <button
                onClick={prevVideo}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-xl rounded-full p-3 hover:bg-gray-50 transition-colors"
              >
                <Icon name="ChevronLeft" size={20} className="text-gray-600" />
              </button>
              
              <button
                onClick={nextVideo}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-xl rounded-full p-3 hover:bg-gray-50 transition-colors"
              >
                <Icon name="ChevronRight" size={20} className="text-gray-600" />
              </button>

              {/* Видео сетка */}
              <div 
                className="flex gap-6 overflow-x-hidden transition-transform duration-500 ease-in-out px-12"
                style={{
                  transform: `translateX(-${activeVideoIndex * (100 / Math.min(3, videoTestimonials.length))}%)`
                }}
              >
                {videoTestimonials.map((video, index) => (
                  <div 
                    key={video.id} 
                    className="flex-shrink-0 w-80 bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                  >
                    {/* Вертикальное видео в оригинальном формате */}
                    <div className="aspect-[9/16] bg-gray-900 relative group">
                      <video
                        ref={(el) => {
                          if (el) videoRefs.current[video.id] = el;
                        }}
                        className="w-full h-full object-contain bg-black"
                        onEnded={handleVideoEnded}
                        controls={playingVideoId === video.id}
                        playsInline
                        preload="metadata"
                      >
                        <source src={video.videoUrl} type="video/quicktime" />
                        <source src={video.videoUrl} type="video/mp4" />
                        Ваш браузер не поддерживает видео.
                      </video>
                      
                      {/* Кнопка воспроизведения */}
                      {playingVideoId !== video.id && (
                        <button
                          onClick={() => toggleVideoPlay(video.id)}
                          className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-40 transition-all duration-300"
                        >
                          <div className="bg-white bg-opacity-95 rounded-full p-4 hover:scale-110 transition-transform duration-200">
                            <Icon name="Play" size={32} className="text-green-600 ml-1" />
                          </div>
                        </button>
                      )}
                    </div>
                    
                    {/* Информация под видео */}
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-800 text-sm mb-2">
                        {video.name}
                      </h4>
                      <p className="text-gray-600 text-xs leading-relaxed">
                        {video.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Индикаторы точками */}
            <div className="flex justify-center space-x-2 mt-8">
              {videoTestimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveVideoIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    Math.floor(activeVideoIndex / 3) === Math.floor(index / 3) 
                      ? 'bg-green-600' 
                      : 'bg-gray-300 hover:bg-gray-400'
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