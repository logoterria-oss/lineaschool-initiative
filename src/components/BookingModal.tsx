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

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BookingModal({ isOpen, onClose }: BookingModalProps) {
  const [formData, setFormData] = useState({
    childName: "",
    childAge: "",
    parentName: "",
    phone: "",
    email: "",
    serviceType: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Здесь будет логика отправки формы
    console.log("Форма отправлена:", formData);
    onClose();
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
              <Label htmlFor="childName" className="text-sm font-medium text-gray-700">
                Имя ребёнка *
              </Label>
              <Input
                id="childName"
                value={formData.childName}
                onChange={(e) => handleInputChange("childName", e.target.value)}
                placeholder="Введите имя ребёнка"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="childAge" className="text-sm font-medium text-gray-700">
                Возраст ребёнка *
              </Label>
              <Select onValueChange={(value) => handleInputChange("childAge", value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Выберите возраст" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 лет</SelectItem>
                  <SelectItem value="8">8 лет</SelectItem>
                  <SelectItem value="9">9 лет</SelectItem>
                  <SelectItem value="10">10 лет</SelectItem>
                  <SelectItem value="11">11 лет</SelectItem>
                  <SelectItem value="12">12 лет</SelectItem>
                  <SelectItem value="13">13 лет</SelectItem>
                  <SelectItem value="14">14 лет</SelectItem>
                  <SelectItem value="15">15 лет</SelectItem>
                  <SelectItem value="16">16 лет</SelectItem>
                  <SelectItem value="17">17 лет</SelectItem>
                  <SelectItem value="18">18 лет</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="parentName" className="text-sm font-medium text-gray-700">
                Имя родителя *
              </Label>
              <Input
                id="parentName"
                value={formData.parentName}
                onChange={(e) => handleInputChange("parentName", e.target.value)}
                placeholder="Ваше имя"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Телефон *
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
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="your@email.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="serviceType" className="text-sm font-medium text-gray-700">
                Интересующая услуга
              </Label>
              <Select onValueChange={(value) => handleInputChange("serviceType", value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Выберите услугу" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diagnosis">Диагностика</SelectItem>
                  <SelectItem value="individual">Индивидуальные занятия</SelectItem>
                  <SelectItem value="group">Групповые занятия</SelectItem>
                  <SelectItem value="consultation">Консультация</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                Дополнительная информация
              </Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => handleInputChange("message", e.target.value)}
                placeholder="Расскажите о трудностях ребёнка или задайте вопрос"
                className="mt-1 min-h-[80px]"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-3 pt-4">
            <Button
              type="submit"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3"
            >
              <Icon name="Calendar" size={20} className="mr-2" />
              Записаться на диагностику
            </Button>
            
            <div className="text-xs text-gray-500 text-center">
              Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}