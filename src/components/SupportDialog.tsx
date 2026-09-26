import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { getStaffToken } from '@/lib/staffApi';
import func2url from '../../backend/func2url.json';

const SUPPORT_URL = (func2url as Record<string, string>)['support-ticket'];

const MAX_SHOTS = 5;
const MAX_SIZE = 8 * 1024 * 1024;

type Urgency = 'urgent' | 'medium' | 'low';

const URGENCY_OPTIONS: { value: Urgency; label: string; activeClass: string }[] = [
  { value: 'urgent', label: 'Срочно!', activeClass: 'bg-red-600 hover:bg-red-700 text-white border-red-600' },
  { value: 'medium', label: 'Средне срочно', activeClass: 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500' },
  { value: 'low', label: 'Не срочно', activeClass: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600' },
];

interface SupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SupportDialog = ({ open, onOpenChange }: SupportDialogProps) => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [urgency, setUrgency] = useState<Urgency>('medium');
  const [note, setNote] = useState('');
  const [shots, setShots] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const reset = () => {
    setUrgency('medium');
    setNote('');
    setShots([]);
  };

  const readAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const free = MAX_SHOTS - shots.length;
    if (free <= 0) {
      toast({ title: 'Максимум 5 скриншотов', variant: 'destructive' });
      return;
    }
    const picked = Array.from(files).slice(0, free);
    const tooBig = picked.filter((f) => f.size > MAX_SIZE);
    if (tooBig.length) {
      toast({ title: 'Файл больше 8 МБ', description: tooBig.map((f) => f.name).join(', '), variant: 'destructive' });
    }
    const valid = picked.filter((f) => f.size <= MAX_SIZE && f.type.startsWith('image/'));
    const urls = await Promise.all(valid.map(readAsDataUrl));
    setShots((prev) => [...prev, ...urls].slice(0, MAX_SHOTS));
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeShot = (index: number) => {
    setShots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!note.trim()) {
      toast({ title: 'Опишите вашу проблему', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const token = getStaffToken();
      if (token) headers['X-Auth-Token'] = token;

      const res = await fetch(SUPPORT_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          urgency,
          note: note.trim(),
          shots,
          author_fallback: sessionStorage.getItem('staff_name') || '',
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (data.ok) {
        toast({ title: 'Обращение отправлено' });
        reset();
        onOpenChange(false);
      } else {
        toast({
          title: 'Не удалось отправить',
          description: data.message || 'Попробуйте ещё раз',
          variant: 'destructive',
        });
      }
    } catch {
      toast({ title: 'Ошибка сети', description: 'Проверьте соединение', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!sending) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="LifeBuoy" size={20} className="text-blue-600" />
            Техподдержка
          </DialogTitle>
          <DialogDescription>
            Опишите проблему — обращение придёт команде разработки.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Срочность</p>
            <div className="flex flex-wrap gap-2">
              {URGENCY_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setUrgency(opt.value)}
                  className={urgency === opt.value ? opt.activeClass : ''}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              Проблема <span className="text-red-500">*</span>
            </p>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Опишите вашу проблему"
              rows={5}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Скриншоты</p>
              <span className="text-xs text-gray-400">{shots.length} / {MAX_SHOTS}</span>
            </div>

            {shots.length > 0 && (
              <div className="grid grid-cols-5 gap-2">
                {shots.map((src, i) => (
                  <div key={i} className="relative group aspect-square">
                    <img
                      src={src}
                      alt={`Скриншот ${i + 1}`}
                      className="w-full h-full object-cover rounded-md border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeShot(i)}
                      aria-label="Удалить скриншот"
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center shadow hover:bg-red-600 transition-colors"
                    >
                      <Icon name="X" size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={shots.length >= MAX_SHOTS}
              onClick={() => fileRef.current?.click()}
              className="w-full border-dashed"
            >
              <Icon name="ImagePlus" size={16} className="mr-2" />
              Добавить скриншот
            </Button>
            <p className="text-xs text-gray-400">До 5 картинок, каждая не больше 8 МБ.</p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={sending || !note.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {sending ? (
              <>
                <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                Отправляем...
              </>
            ) : (
              <>
                <Icon name="Send" size={16} className="mr-2" />
                Отправить
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SupportDialog;
