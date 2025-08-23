

export default function AboutSection() {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">О LineaSchool</h2>
            <div className="space-y-4 text-lg text-gray-700">
              <p>
                LineaSchool — это команда преданных своему делу специалистов, которые стремятся оказывать индивидуальную поддержку детям с дислексией и дисграфией.
              </p>
              <p>
                Наш уникальный подход сочетает в себе традиционные логопедические и современные нейропсихологические методики, обеспечивая комплексную коррекцию нарушений процессов чтения и письма.
              </p>
              <p>
                Мы понимаем, что каждый ребёнок уникален, поэтому разрабатываем персональные программы коррекции, учитывающие индивидуальные особенности и потребности.
              </p>
            </div>
            

          </div>
          
          <div className="relative">
            <img 
              src="https://cdn.poehali.dev/files/2e76ff38-759a-4d5c-8e01-21bdfd8bb70f.JPG" 
              alt="Преподаватель с детьми"
              className="w-full h-auto rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}