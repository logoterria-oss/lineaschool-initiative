import Icon from "@/components/ui/icon";
import Navigation from "@/components/Navigation";
import { sections } from "@/components/education/educationData";
import SectionContent from "@/components/education/SectionContent";

export default function EducationInfo() {
  return (
    <div className="min-h-screen bg-gradient-to-bl from-purple-50 via-white to-purple-50/30">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Сведения об образовательной организации
          </h1>
        </div>

        <div className="space-y-3">
          {sections.map((s, i) => (
            <details
              key={s.id}
              className="group bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
            >
              <summary className="list-none cursor-pointer select-none flex items-center gap-3 p-4 sm:p-5 hover:bg-purple-50/60 transition-colors">
                <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-purple-100 text-purple-700 font-semibold flex items-center justify-center text-sm">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm sm:text-base font-semibold text-gray-800">
                  {s.title}
                </span>
                <Icon
                  name="ChevronDown"
                  size={20}
                  className="text-gray-400 flex-shrink-0 transition-transform group-open:rotate-180"
                />
              </summary>
              <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-gray-100 text-gray-500 text-sm leading-relaxed">
                <SectionContent id={s.id} />
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
