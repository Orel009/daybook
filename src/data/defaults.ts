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

// Temperature blanket: the day's high in one of ten bands, coldest to warmest.
const TEMPERATURE_C = ['Below −5°', '−5 to 0°', '1 to 5°', '6 to 10°', '11 to 15°', '16 to 20°', '21 to 25°', '26 to 30°', '31 to 35°', 'Above 35°'];
const TEMPERATURE_F = ['Below 23°', '23 to 32°', '33 to 41°', '42 to 50°', '51 to 59°', '60 to 68°', '69 to 77°', '78 to 86°', '87 to 95°', 'Above 95°'];
const BLANKET = ['blue', 'sky', 'teal', 'mint', 'green', 'lime', 'butter', 'orange', 'coral', 'red'];
const blanketColors = (bands: string[]) => Object.fromEntries(bands.map((b, i) => [b, BLANKET[i]]));

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
  { name: 'Language practice', emoji: '🗣️', color: 'teal', categoryId: 'productivity', valueType: 'duration', target: 15, schedule: { kind: 'daily' } },
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
  // weather and temperature: one answer a day, drawn as a year in pixels
  {
    name: 'Weather', emoji: '⛅', color: 'sky', categoryId: 'lifestyle', valueType: 'choice',
    choices: ['Sunny', 'Partly cloudy', 'Cloudy', 'Rain', 'Storm', 'Snow', 'Windy', 'Hot'],
    valueColors: { Sunny: 'butter', 'Partly cloudy': 'sky', Cloudy: 'grey', Rain: 'blue', Storm: 'plum', Snow: 'lilac', Windy: 'teal', Hot: 'orange' },
    visualizationId: 'pixels', schedule: { kind: 'daily' },
  },
  {
    name: 'Temperature (°C)', emoji: '🌡️', color: 'coral', categoryId: 'lifestyle', valueType: 'choice',
    choices: TEMPERATURE_C, valueColors: blanketColors(TEMPERATURE_C), visualizationId: 'pixels', schedule: { kind: 'daily' },
  },
  {
    name: 'Temperature (°F)', emoji: '🌡️', color: 'coral', categoryId: 'lifestyle', valueType: 'choice',
    choices: TEMPERATURE_F, valueColors: blanketColors(TEMPERATURE_F), visualizationId: 'pixels', schedule: { kind: 'daily' },
  },
  { name: 'Dreams', emoji: '💭', color: 'lilac', categoryId: 'sleep', valueType: 'text', schedule: { kind: 'daily' } },
  { name: 'Self-care', emoji: '🛁', color: 'rose', categoryId: 'mind', valueType: 'boolean', schedule: { kind: 'daily' } },
  { name: 'Series watched', emoji: '📺', color: 'plum', categoryId: 'lifestyle', valueType: 'number', unit: 'episodes', step: 1, schedule: { kind: 'daily' } },
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
