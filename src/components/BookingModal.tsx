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
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
  });
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📤 Отправка заявки:', formData);
    
    try {
      const response = await fetch('https://functions.poehali.dev/0d734a2e-55b4-41ff-a0f3-d85fb7c1e094', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      console.log('✅ Ответ сервера:', response.status, await response.clone().text());
      
      if (!response.ok) {
        throw new Error('Ошибка отправки заявки');
      }
    } catch (error) {
      console.error('❌ Ошибка отправки заявки:', error);
    }
    
    onClose();
    setIsConfirmationOpen(true);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Как вас зовут? *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Ваше имя"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                E-mail *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="example@mail.com"
                required
                className="mt-1"
              />
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-3 p-3 bg-green-50 rounded-lg">
                Мы бережно относимся к вашей приватности: номер телефона нужен только для отправки ссылки на диагностику и важной информации о записи 🙏🏻
              </div>
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Номер телефона *
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+7 (___) ___-__-__"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="date" className="text-sm font-medium text-gray-700">
                Желаемые дата и время *
              </Label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <Input
                  id="date"
                  type="text"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  placeholder="__.__.2025"
                  required
                />
                <Input
                  id="time"
                  type="text"
                  value={formData.time}
                  onChange={(e) => handleInputChange("time", e.target.value)}
                  placeholder="__:__"
                  required
                />
              </div>
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