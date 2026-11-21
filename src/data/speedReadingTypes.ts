export type SpeedReadingKind = 'tale' | 'story' | 'poem' | 'fable' | 'folk';

export interface SpeedReadingQuestion {
  q: string;
  options: string[];
  correct: number;
  after: number;
  why: string;
  quote: string;
}

export interface SpeedReadingText {
  id: string;
  author: string;
  title: string;
  kind: SpeedReadingKind;
  kindLabel: string;
  note: string;
  grade?: 2 | 3;
  poem?: boolean;
  source?: string;
  sourceLabel?: string;
  blocks: string[];
  questions: SpeedReadingQuestion[];
}

export interface SpeedReadingPassage extends SpeedReadingText {
  wordCount: number;
}
