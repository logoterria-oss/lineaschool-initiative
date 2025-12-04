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
    phone: "",
    telegram: "",
  });
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Отправка данных в Telegram
    const message = `🎓 Новая запись на диагностику:\n\n👶 ФИО ребенка: ${formData.childName}\n🎂 Дата рождения ребенка: ${formData.childBirthDate}\n👤 ФИО родителя: ${formData.parentName}\n📱 Телефон: ${formData.phone}\n✈️ Telegram: ${formData.telegram}`;
    
    try {
      // Отправка в Telegram
      const telegramBotToken = '8320634391:AAGxRCQdt_K-L5QliSLX9vDJmqhLlubfpB8';
      const chatId = '1112267464';
      
      await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML'
        }),
      });
    } catch (error) {
      console.error('Ошибка отправки:', error);
    }
    
    onClose();
    setIsConfirmationOpen(true);
  };

  const handleInputChange = (field: string, value: string) => {
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
                value={formData.phone || '+7 '}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value);
                  handleInputChange("phone", formatted);
                }}
                onFocus={(e) => {
                  if (!formData.phone) {
                    handleInputChange("phone", "+7 ");
                  }
                }}
                placeholder="+7 (___) ___-__-__"
                required
                className="mt-1"
                maxLength={18}
              />
            </div>

            <div>
              <Label htmlFor="telegram" className="text-sm font-medium text-gray-700">
                Имя в Telegram *
              </Label>
              <Input
                id="telegram"
                type="text"
                value={formData.telegram || '@'}
                onChange={(e) => {
                  const formatted = formatTelegram(e.target.value);
                  handleInputChange("telegram", formatted);
                }}
                onFocus={(e) => {
                  if (!formData.telegram) {
                    handleInputChange("telegram", "@");
                  }
                }}
                placeholder="@username"
                required
                className="mt-1"
              />
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