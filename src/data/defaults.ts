import type { Category, Schedule, Settings, TrackerDefinition, ValueType } from '../domain/types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'health', name: 'Health and fitness', emoji: '🏃' },
  { id: 'mind', name: 'Mental wellness', emoji: '🌿' },
  { id: 'nutrition', name: 'Nutrition', emoji: '🥗' },
  { id: 'sleep', name: 'Sleep', emoji: '🌙' },
  { id: 'productivity', name: 'Productivity', emoji: '📚' },
  { id: 'lifestyle', name: 'Lifestyle', emoji: '🧴' },
  { id: 'finance', name: 'Finance', emoji: '💰' },
].map((c) => ({ ...c, builtIn: true, updatedAt: '' }));

export const DEFAULT_SETTINGS: Settings = {
  theme: 'scrapbook',
  ownerName: '',
  weekStartsOn: 0,
  dashboard: [
    { id: 'w-today', type: 'today', size: 'full' },
    { id: 'w-week', type: 'week', size: 'half' },
    { id: 'w-streaks', type: 'streaks', size: 'half' },
    { id: 'w-note', type: 'note', size: 'full' },
  ],
  updatedAt: '',
};

// Starting points offered on empty screens. These are plain data that prefill
// the tracker form – nothing in the app depends on any particular habit.
export interface TrackerPreset {
  name: string;
  emoji: string;
  color: string;
  categoryId: string;
  valueType: ValueType;
  unit?: string;
  step?: number;
  ratingMax?: 5 | 10;
  choices?: string[];
  valueColors?: Record<string, string>;
  visualizationId?: string;
  target?: number;
  schedule: Schedule;
}

export const PRESETS: TrackerPreset[] = [
  { name: 'Workout', emoji: '🏃', color: 'coral', categoryId: 'health', valueType: 'boolean', schedule: { kind: 'weekdays', days: [1, 3, 5] } },
  { name: 'Water', emoji: '💧', color: 'sky', categoryId: 'health', valueType: 'number', unit: 'glasses', step: 1, target: 8, schedule: { kind: 'daily' } },
  { name: 'Sleep', emoji: '🌙', color: 'lilac', categoryId: 'sleep', valueType: 'timeRange', target: 480, schedule: { kind: 'daily' } },
  {
    name: 'Mood', emoji: '🌤️', color: 'butter', categoryId: 'mind', valueType: 'choice',
    choices: ['Happy', 'Calm', 'Tired', 'Sad', 'Stressed'],
    valueColors: { Happy: 'rose', Calm: 'mint', Tired: 'butter', Sad: 'blue', Stressed: 'coral' },
    visualizationId: 'pixels', schedule: { kind: 'daily' },
  },
  { name: 'Reading', emoji: '📖', color: 'sage', categoryId: 'productivity', valueType: 'duration', target: 20, schedule: { kind: 'daily' } },
  { name: 'Gratitude', emoji: '🌸', color: 'rose', categoryId: 'mind', valueType: 'text', schedule: { kind: 'daily' } },
  { name: 'Skincare', emoji: '🧴', color: 'peach', categoryId: 'lifestyle', valueType: 'boolean', schedule: { kind: 'daily' } },
  { name: 'Savings', emoji: '💰', color: 'mint', categoryId: 'finance', valueType: 'number', schedule: { kind: 'perMonth', times: 1 } },
  // sports, one tracker each
  { name: 'Running', emoji: '🏃', color: 'orange', categoryId: 'health', valueType: 'number', unit: 'km', schedule: { kind: 'perWeek', times: 3 } },
  { name: 'Tennis', emoji: '🎾', color: 'lime', categoryId: 'health', valueType: 'duration', schedule: { kind: 'perWeek', times: 2 } },
  { name: 'Cycling', emoji: '🚴', color: 'teal', categoryId: 'health', valueType: 'number', unit: 'km', schedule: { kind: 'perWeek', times: 2 } },
  { name: 'Swimming', emoji: '🏊', color: 'blue', categoryId: 'health', valueType: 'number', unit: 'laps', schedule: { kind: 'perWeek', times: 2 } },
  { name: 'Yoga', emoji: '🧘', color: 'lilac', categoryId: 'health', valueType: 'duration', target: 20, schedule: { kind: 'perWeek', times: 3 } },
  { name: 'Stretching', emoji: '🤸', color: 'mint', categoryId: 'health', valueType: 'boolean', schedule: { kind: 'daily' } },
  { name: 'Strength training', emoji: '🏋️', color: 'coral', categoryId: 'health', valueType: 'boolean', schedule: { kind: 'weekdays', days: [2, 4, 6] } },
  { name: 'Walking', emoji: '🚶', color: 'sage', categoryId: 'health', valueType: 'number', unit: 'steps', step: 1000, target: 8000, schedule: { kind: 'daily' } },
];

export const EMOJI_CHOICES = [
  '🏃', '🚶', '🚴', '🧘', '🏋️', '🎾', '🏊', '🤸', '💧', '🥗', '🍎', '☕', '🍳', '🌙', '⏰', '🌤️', '🌿', '🌸', '🪴',
  '📖', '✍️', '📚', '🎨', '🎵', '🧶', '📷', '🧴', '🦷', '💊', '🧹', '🐶', '💰', '🛍️', '💌', '⭐',
];

export const NOTE_MESSAGES = [
  'Small steps still move you forward.',
  'You showed up today. That counts.',
  'Rest is part of the plan.',
  'One page at a time.',
  'Be as kind to yourself as you are to everyone else.',
  'Done is lovely. Perfect is optional.',
  'Today is a good day to begin again.',
];

export type TrackerDraft = Omit<TrackerDefinition, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder' | 'archived'>;

export const draftFromPreset = (p?: TrackerPreset): TrackerDraft => ({
  name: p?.name ?? '',
  emoji: p?.emoji ?? '⭐',
  color: p?.color ?? 'rose',
  categoryId: p?.categoryId ?? 'health',
  valueType: p?.valueType ?? 'boolean',
  unit: p?.unit,
  step: p?.step,
  ratingMax: p?.ratingMax ?? 5,
  choices: p?.choices,
  valueColors: p?.valueColors,
  target: p?.target,
  schedule: p?.schedule ?? { kind: 'daily' },
  visualizationId: p?.visualizationId ?? 'calendar',
  visualizationConfig: {},
});
