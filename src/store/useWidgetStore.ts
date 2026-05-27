import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type WidgetId = 'quicklinks' | 'categories' | 'goals' | 'subscriptions' | 'fridge' | 'analysis';

export interface DashWidget { id: WidgetId; visible: boolean }

export const WIDGET_META: Record<WidgetId, { label: string; emoji: string }> = {
  quicklinks:    { label: 'Быстрые ссылки', emoji: '⚡' },
  categories:    { label: 'Категории',      emoji: '📊' },
  goals:         { label: 'Мои цели',       emoji: '🎯' },
  subscriptions: { label: 'Подписки',       emoji: '💳' },
  fridge:        { label: 'Холодильник',    emoji: '🧊' },
  analysis:      { label: 'Анализ и советы',emoji: '🔬' },
};

const DEFAULT_WIDGETS: DashWidget[] = [
  { id: 'quicklinks',    visible: true },
  { id: 'categories',   visible: true },
  { id: 'goals',        visible: true },
  { id: 'subscriptions',visible: true },
  { id: 'fridge',       visible: true },
  { id: 'analysis',     visible: true },
];

interface WidgetStore {
  widgets: DashWidget[];
  toggleWidget: (id: WidgetId) => void;
  moveWidget:   (id: WidgetId, dir: 'up' | 'down') => void;
}

export const useWidgetStore = create<WidgetStore>()(
  persist(
    (set) => ({
      widgets: DEFAULT_WIDGETS,
      toggleWidget: (id) => set(s => ({
        widgets: s.widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w),
      })),
      moveWidget: (id, dir) => set(s => {
        const idx = s.widgets.findIndex(w => w.id === id);
        if (idx === -1) return s;
        const arr = [...s.widgets];
        const swap = dir === 'up' ? idx - 1 : idx + 1;
        if (swap < 0 || swap >= arr.length) return s;
        [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
        return { widgets: arr };
      }),
    }),
    { name: 'widget-store-v2', storage: createJSONStorage(() => AsyncStorage) }
  )
);
