import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Icon from "@/components/ui/icon";
import { Checkbox } from "@/components/ui/checkbox";
import ConfirmationModal from "@/components/ConfirmationModal";
import PrivacyModal from "@/components/PrivacyModal";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BookingModal({ isOpen, onClose }: BookingModalProps) {
  const [formData, setFormData] = useState({
    childName: "",
    childBirthDate: "",
    parentName: "",
    phone: "+7 ",
    telegram: "@",
    messengerTelegram: false,
    messengerMax: false,
  });
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [messengerError, setMessengerError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError("");
    setMessengerError("");
    
    try {
      const leadProcessorUrl = 'https://functions.poehali.dev/0d734a2e-55b4-41ff-a0f3-d85fb7c1e094';
      const cleanPhone = formData.phone.replace(/\D/g, '');
      const cleanTelegram = formData.telegram.replace('@', '').trim();
      
      if (cleanPhone.length < 11) {
        setPhoneError("Введите номер телефона полностью");
        return;
      }

      if (!formData.messengerTelegram && !formData.messengerMax) {
        setMessengerError("Выберите хотя бы один мессенджер");
        return;
      }
      
      const messengers: string[] = [];
      if (formData.messengerTelegram) messengers.push('Telegram');
      if (formData.messengerMax) messengers.push('Max');

      const payload = {
        childName: formData.childName,
        childBirthDate: formData.childBirthDate,
        parentName: formData.parentName,
        phone: cleanPhone,
        telegram: formData.messengerTelegram && cleanTelegram ? `@${cleanTelegram}` : '',
        messengers: messengers,
        email: '',
        date: '',
        time: ''
      };
      
      console.log('Отправка заявки:', JSON.stringify(payload));
      
      const response = await fetch(leadProcessorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const result = await response.json();
      console.log('Ответ сервера:', response.status, JSON.stringify(result));
    } catch (error) {
      console.error('Ошибка отправки заявки:', error);
    }
    
    onClose();
    setIsConfirmationOpen(true);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field === "messengerTelegram") {
      setFormData(prev => ({ ...prev, messengerTelegram: value === "true" || value === true }));
      return;
    }
    if (field === "messengerMax") {
      setFormData(prev => ({ ...prev, messengerMax: value === "true" || value === true }));
      return;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatBirthDate = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 4)}.${numbers.slice(4, 8)}`;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length === 0) return '+7 ';
    if (numbers.length <= 1) return '+7 ';
    if (numbers.length <= 4) return `+7 (${numbers.slice(1)}`;
    if (numbers.length <= 7) return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4)}`;
    if (numbers.length <= 9) return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7)}`;
    return `+7 (${numbers.slice(1, 4)}) ${numbers.slice(4, 7)}-${numbers.slice(7, 9)}-${numbers.slice(9, 11)}`;
  };

  const formatTelegram = (value: string) => {
    const cleaned = value.replace(/[^a-zA-Z0-9_]/g, '');
    return cleaned ? `@${cleaned}` : '@';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-green-600">
            Записаться на диагностику
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Заполните форму, и мы свяжемся с вами для уточнения деталей
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="childName" className="text-sm font-medium text-gray-700">
                ФИО ребенка *
              </Label>
              <Input
                id="childName"
                value={formData.childName}
                onChange={(e) => handleInputChange("childName", e.target.value)}
                placeholder="Иванов Иван Иванович"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="childBirthDate" className="text-sm font-medium text-gray-700">
                Дата рождения ребенка *
              </Label>
              <Input
                id="childBirthDate"
                type="text"
                value={formData.childBirthDate}
                onChange={(e) => {
                  const formatted = formatBirthDate(e.target.value);
                  handleInputChange("childBirthDate", formatted);
                }}
                placeholder="дд.мм.гггг"
                required
                className="mt-1"
                maxLength={10}
              />
            </div>

            <div className="text-sm text-gray-600 p-3 bg-green-50 rounded-lg">
              Мы бережно относимся к вашей приватности: данные используются только для организации диагностики и связи с вами 🙏🏻
            </div>

            <div>
              <Label htmlFor="parentName" className="text-sm font-medium text-gray-700">
                ФИО родителя *
              </Label>
              <Input
                id="parentName"
                value={formData.parentName}
                onChange={(e) => handleInputChange("parentName", e.target.value)}
                placeholder="Иванова Мария Петровна"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Номер телефона *
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value);
                  handleInputChange("phone", formatted);
                  if (phoneError) setPhoneError("");
                }}
                placeholder="+7 (___) ___-__-__"
                required
                className={`mt-1 ${phoneError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                maxLength={18}
              />
              {phoneError && (
                <p className="text-red-500 text-sm mt-1">{phoneError}</p>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Где с вами удобно связаться? *
              </Label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={formData.messengerTelegram}
                    onCheckedChange={(checked) =>
                      handleInputChange("messengerTelegram", checked as boolean ? "true" : "")
                    }
                  />
                  <span className="text-sm text-gray-700">Telegram</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={formData.messengerMax}
                    onCheckedChange={(checked) =>
                      handleInputChange("messengerMax", checked as boolean ? "true" : "")
                    }
                  />
                  <span className="text-sm text-gray-700">Max (VK Мессенджер)</span>
                </label>
              </div>
              {messengerError && (
                <p className="text-red-500 text-sm mt-1">{messengerError}</p>
              )}

              {formData.messengerTelegram && (
                <div className="mt-3">
                  <Label htmlFor="telegram" className="text-sm font-medium text-gray-700">
                    Имя в Telegram
                  </Label>
                  <Input
                    id="telegram"
                    type="text"
                    value={formData.telegram}
                    onChange={(e) => {
                      const formatted = formatTelegram(e.target.value);
                      handleInputChange("telegram", formatted);
                    }}
                    placeholder="@username"
                    className="mt-1"
                  />
                </div>
              )}
            </div>


          </div>

          <div className="flex flex-col space-y-3 pt-4">
            <Button
              type="submit"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3"
            >
              <Icon name="Calendar" size={20} className="mr-2" />
              Записаться
            </Button>
            
            <div className="text-xs text-gray-500 text-center">
              Нажимая на кнопку, вы даёте согласие на{" "}
              <button 
                type="button"
                onClick={() => setIsPrivacyOpen(true)}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                обработку персональных данных
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
      
      <ConfirmationModal 
        isOpen={isConfirmationOpen} 
        onClose={() => setIsConfirmationOpen(false)} 
      />
      
      <PrivacyModal 
        isOpen={isPrivacyOpen} 
        onClose={() => setIsPrivacyOpen(false)} 
      />
    </Dialog>
  );
}