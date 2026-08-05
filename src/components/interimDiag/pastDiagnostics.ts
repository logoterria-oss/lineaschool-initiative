import { ProcessLevelsState } from './impairedProcesses';

export const API = 'https://functions.poehali.dev/12cd04f4-07fb-4fe5-a260-e3c9955e0ae7';

export interface PastEntry {
  id: number;
  diagType: 'primary' | 'interim';
  date: string | null;
  readingSpeed: string;
  readingComprehension: string;
  dysgraphicErrors: string;
  dysorthographicErrors: string;
  totalErrors: string;
  readingChar: string;
  levels: ProcessLevelsState;
}

export const EMPTY: Omit<PastEntry, 'id'> = {
  diagType: 'interim',
  date: '',
  readingSpeed: '',
  readingComprehension: '',
  dysgraphicErrors: '',
  dysorthographicErrors: '',
  totalErrors: '',
  readingChar: '',
  levels: {},
};
