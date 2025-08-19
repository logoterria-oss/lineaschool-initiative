import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Icon from "@/components/ui/icon";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConfirmationModal({ isOpen, onClose }: ConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Icon name="CheckCircle" size={32} className="text-green-600" />
          </div>
          <DialogTitle className="text-2xl font-bold text-green-600">
            Заявка отправлена!
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-base leading-relaxed">
            Спасибо за вашу заявку! Наш специалист свяжется с вами в ближайшее время для подтверждения записи и уточнения деталей.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-3 pt-4">
          <Button
            onClick={onClose}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3"
          >
            Понятно
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}