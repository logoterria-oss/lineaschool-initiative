import { LessonForm } from './supervisionChecklist';

export const BASE_RATE = 300;

export interface RateTier {
  min: number;
  bonus: number;
  rate: number;
}

// Пороги среднего балла супервизии → надбавка к часу и итоговая ставка
export const RATE_TIERS: Record<LessonForm, RateTier[]> = {
  group: [
    { min: 24, bonus: 100, rate: 400 },
    { min: 29, bonus: 200, rate: 500 },
    { min: 33, bonus: 350, rate: 650 },
  ],
  individual: [
    { min: 30, bonus: 100, rate: 400 },
    { min: 35, bonus: 200, rate: 500 },
    { min: 41, bonus: 350, rate: 650 },
  ],
};

export interface RateResult {
  bonus: number;
  rate: number;
  // Следующий уровень: сколько баллов не хватает и какая ставка будет
  next: { needed: number; rate: number } | null;
}

export function rateFromScore(form: LessonForm, avg: number): RateResult {
  const tiers = RATE_TIERS[form];
  let idx = -1;
  for (let i = 0; i < tiers.length; i++) {
    if (avg >= tiers[i].min) idx = i;
  }
  const current = idx >= 0 ? tiers[idx] : { bonus: 0, rate: BASE_RATE };
  const next = tiers[idx + 1] ?? null;
  return {
    bonus: current.bonus,
    rate: current.rate,
    next: next ? { needed: Math.round((next.min - avg) * 10) / 10, rate: next.rate } : null,
  };
}

export const fmtRate = (v: number) => `${v} ₽/час`;
