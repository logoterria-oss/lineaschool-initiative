import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Icon from "@/components/ui/icon";
import { INTERACTION_API_URL } from "@/lib/interactionUrl";

export const CONTACT_TELEGRAM = "https://t.me/linea_school";
export const CONTACT_MAX = "https://max.ru/+79169822876";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ContactChoiceDialog({ open, onClose }: Props) {
  // Сообщаем окну взаимодействия: с сайта ушли в мессенджер задать вопрос.
  // Первое входящее оттуда получит пометку «Вопрос с сайта».
  const notify = (channel: "max" | "telegram") => {
    const body = JSON.stringify({ channel });
    const url = `${INTERACTION_API_URL}?action=site-question`;
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
        return;
      }
    } catch {
      // молча — переход в мессенджер важнее
    }
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  };

  const go = (url: string, channel: "max" | "telegram") => {
    notify(channel);
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Куда вам удобнее написать?</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 pt-2">
          <button
            type="button"
            onClick={() => go(CONTACT_MAX, "max")}
            className="group flex items-center gap-4 rounded-2xl border border-green-100 bg-white p-4 text-left transition-all duration-300 hover:border-green-300 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 shadow-md transition-transform duration-300 group-hover:scale-110">
              <Icon name="MessageCircle" size={22} className="text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">Max</div>
              <div className="text-sm text-gray-600">+7 (916) 982-28-76</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => go(CONTACT_TELEGRAM, "telegram")}
            className="group flex items-center gap-4 rounded-2xl border border-green-100 bg-white p-4 text-left transition-all duration-300 hover:border-green-300 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 shadow-md transition-transform duration-300 group-hover:scale-110">
              <Icon name="Send" size={22} className="text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">Telegram</div>
              <div className="text-sm text-gray-600">@linea_school</div>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}