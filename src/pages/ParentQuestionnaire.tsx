import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DiagFormNavigation from "@/components/diag/DiagFormNavigation";
import Footer from "@/components/Footer";
import PageContactInfo from "@/components/questionnaire/PageContactInfo";
import PageChildInfo from "@/components/questionnaire/PageChildInfo";
import PageAnamnesisInfo from "@/components/questionnaire/PageAnamnesisInfo";
import { FormData } from "@/components/questionnaire/types";

export default function ParentQuestionnaire() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    city: "",
    childName: "",
    birthDate: "",
    grade: "",
    educationType: "",
    aoopRequired: "",
    aoopVariant: "",
    schoolStartAge: "",
    kindergarten: "",
    prenatalDevelopment: "",
    earlyDevelopment: "",
    neurologicalDisorders: "",
    hearingVisionDisorders: "",
    chronicDiseases: "",
    speechEnvironment: "",
    previousSpecialists: [],
    speechTherapistConclusion: "",
    speechTherapistCurrent: false,
    neuropsychologistConclusion: "",
    neuropsychologistCurrent: false,
    defectologistConclusion: "",
    defectologistCurrent: false,
    otherSpecialistName: "",
    otherSpecialistCurrent: false,
    dominantHand: ""
  });

  const [prenatalNoFeatures, setPrenatalNoFeaturesRaw] = useState(false);
  const [earlyDevNoFeatures, setEarlyDevNoFeaturesRaw] = useState(false);
  const [neurologicalNone, setNeurologicalNoneRaw] = useState(false);
  const [hearingVisionNone, setHearingVisionNoneRaw] = useState(false);
  const [chronicNone, setChronicNoneRaw] = useState(false);
  const [speechEnvNone, setSpeechEnvNoneRaw] = useState(false);

  const setPrenatalNoFeatures = (v: boolean) => { setPrenatalNoFeaturesRaw(v); if (v) setErrors(p => p.filter(e => e !== 'prenatalDevelopment')); };
  const setEarlyDevNoFeatures = (v: boolean) => { setEarlyDevNoFeaturesRaw(v); if (v) setErrors(p => p.filter(e => e !== 'earlyDevelopment')); };
  const setNeurologicalNone = (v: boolean) => { setNeurologicalNoneRaw(v); if (v) setErrors(p => p.filter(e => e !== 'neurologicalDisorders')); };
  const setHearingVisionNone = (v: boolean) => { setHearingVisionNoneRaw(v); if (v) setErrors(p => p.filter(e => e !== 'hearingVisionDisorders')); };
  const setChronicNone = (v: boolean) => { setChronicNoneRaw(v); if (v) setErrors(p => p.filter(e => e !== 'chronicDiseases')); };
  const setSpeechEnvNone = (v: boolean) => { setSpeechEnvNoneRaw(v); if (v) setErrors(p => p.filter(e => e !== 'speechEnvironment')); };
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string | string[] | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => prev.filter(e => e !== field));
  };

  const [errors, setErrors] = useState<string[]>([]);

  const getPageErrors = (page: number): string[] => {
    const errs: string[] = [];
    if (page === 1) {
      if (!formData.parentName.trim()) errs.push('parentName');
      if (!formData.parentPhone.trim()) errs.push('parentPhone');
      if (!formData.parentEmail.trim()) errs.push('parentEmail');
      if (!formData.city.trim()) errs.push('city');
    }
    if (page === 2) {
      if (!formData.childName.trim()) errs.push('childName');
      if (!formData.birthDate.trim()) errs.push('birthDate');
      if (!formData.grade) errs.push('grade');
      if (!formData.educationType) errs.push('educationType');
      if (!formData.aoopRequired) errs.push('aoopRequired');
      if (!formData.schoolStartAge) errs.push('schoolStartAge');
      if (!formData.kindergarten) errs.push('kindergarten');
    }
    if (page === 3) {
      if (!prenatalNoFeatures && !formData.prenatalDevelopment.trim()) errs.push('prenatalDevelopment');
      if (!earlyDevNoFeatures && !formData.earlyDevelopment.trim()) errs.push('earlyDevelopment');
      if (!neurologicalNone && !formData.neurologicalDisorders.trim()) errs.push('neurologicalDisorders');
      if (!hearingVisionNone && !formData.hearingVisionDisorders.trim()) errs.push('hearingVisionDisorders');
      if (!chronicNone && !formData.chronicDiseases.trim()) errs.push('chronicDiseases');
      if (!speechEnvNone && !formData.speechEnvironment.trim()) errs.push('speechEnvironment');
      if (formData.previousSpecialists.length === 0) errs.push('previousSpecialists');
      if (!formData.dominantHand) errs.push('dominantHand');
    }
    return errs;
  };

  const handleNext = () => {
    const errs = getPageErrors(currentPage);
    if (errs.length > 0) {
      setErrors(errs);
      // Scroll to first error
      setTimeout(() => {
        const el = document.querySelector('[data-error="true"]');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }
    setErrors([]);
    setCurrentPage(prev => prev + 1);
  };

  const handleCheckboxChange = (field: string, value: string, checked: boolean) => {
    const currentValues = formData[field as keyof FormData] as string[];
    if (checked) {
      handleInputChange(field, [...currentValues, value]);
    } else {
      handleInputChange(field, currentValues.filter(item => item !== value));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('https://functions.poehali.dev/65751635-528e-4830-bc09-e0b9c5344580', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, prenatalNoFeatures, earlyDevNoFeatures, neurologicalNone, hearingVisionNone, chronicNone, speechEnvNone })
      });

      if (response.ok) {
        alert('Анкета успешно отправлена! Спасибо!');
        navigate('/');
      } else {
        alert('Ошибка при отправке анкеты. Попробуйте еще раз.');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка при отправке анкеты. Попробуйте еще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <DiagFormNavigation />

      <main className="flex-1 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Анкета для родителей
            </h1>
            <p className="text-gray-600">
              Заполните данные о ребёнке для диагностики
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-8">
            {currentPage === 1 && (
              <PageContactInfo formData={formData} handleInputChange={handleInputChange} errors={errors} />
            )}

            {currentPage === 2 && (
              <PageChildInfo formData={formData} handleInputChange={handleInputChange} errors={errors} />
            )}

            {currentPage === 3 && (
              <PageAnamnesisInfo
                formData={formData}
                handleInputChange={handleInputChange}
                handleCheckboxChange={handleCheckboxChange}
                prenatalNoFeatures={prenatalNoFeatures}
                setPrenatalNoFeatures={setPrenatalNoFeatures}
                earlyDevNoFeatures={earlyDevNoFeatures}
                setEarlyDevNoFeatures={setEarlyDevNoFeatures}
                neurologicalNone={neurologicalNone}
                setNeurologicalNone={setNeurologicalNone}
                hearingVisionNone={hearingVisionNone}
                setHearingVisionNone={setHearingVisionNone}
                chronicNone={chronicNone}
                setChronicNone={setChronicNone}
                speechEnvNone={speechEnvNone}
                setSpeechEnvNone={setSpeechEnvNone}
                privacyConsent={privacyConsent}
                setPrivacyConsent={setPrivacyConsent}
                errors={errors}
              />
            )}

            {/* Навигация между страницами */}
            <div className="mt-8 flex justify-between">
              {currentPage > 1 && (
                <button
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Назад
                </button>
              )}

              {currentPage < 3 ? (
                <button
                  onClick={handleNext}
                  className="ml-auto px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                >
                  Далее
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !privacyConsent}
                  className="ml-auto px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Отправка..." : "Отправить"}
                </button>
              )}
            </div>

            {/* Индикатор страниц */}
            <div className="mt-6 flex justify-center gap-2">
              {[1, 2, 3].map(page => (
                <div
                  key={page}
                  className={`h-2 w-8 rounded-full ${
                    page === currentPage ? "bg-green-600" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}