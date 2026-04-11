import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { FridgeItem } from '../types';

// ─── Configure how notifications appear when app is foregrounded ──────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ─── Request permissions ──────────────────────────────────────────────────────
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ─── Notification IDs ─────────────────────────────────────────────────────────
function notifId(itemId: string, type: '1d' | '3d'): string {
  return `fridge-${itemId}-${type}`;
}

// ─── Schedule notifications for a single fridge item ─────────────────────────
// Sends:
//   • 3 days before expiry — "через 3 дня"
//   • 1 day before expiry  — "завтра истекает"
export async function scheduleItemNotifications(item: FridgeItem): Promise<void> {
  const expires = new Date(item.expires_at);
  expires.setHours(9, 0, 0, 0); // 9:00 AM on expiry day

  const threeDay = new Date(expires);
  threeDay.setDate(threeDay.getDate() - 3);

  const oneDay = new Date(expires);
  oneDay.setDate(oneDay.getDate() - 1);

  const now = Date.now();

  // Cancel existing before rescheduling
  await cancelItemNotifications(item.id);

  if (threeDay.getTime() > now) {
    await Notifications.scheduleNotificationAsync({
      identifier: notifId(item.id, '3d'),
      content: {
        title: '🧊 Холодильник',
        body: `«${item.name}» истекает через 3 дня — используй скорее!`,
        data: { screen: 'Fridge', itemId: item.id },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: threeDay,
      },
    });
  }

  if (oneDay.getTime() > now) {
    await Notifications.scheduleNotificationAsync({
      identifier: notifId(item.id, '1d'),
      content: {
        title: '⚠️ Срок годности',
        body: `«${item.name}» истекает завтра!`,
        data: { screen: 'Fridge', itemId: item.id },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: oneDay,
      },
    });
  }
}

// ─── Cancel notifications for a removed item ─────────────────────────────────
export async function cancelItemNotifications(itemId: string): Promise<void> {
  await Promise.all([
    Notifications.cancelScheduledNotificationAsync(notifId(itemId, '3d')).catch(() => {}),
    Notifications.cancelScheduledNotificationAsync(notifId(itemId, '1d')).catch(() => {}),
  ]);
}

// ─── Reschedule all items (called on app start) ───────────────────────────────
export async function rescheduleAllFridgeNotifications(items: FridgeItem[]): Promise<void> {
  // Cancel all existing fridge notifications first
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const fridgeIds = scheduled
    .filter((n) => n.identifier.startsWith('fridge-'))
    .map((n) => n.identifier);

  await Promise.all(fridgeIds.map((id) =>
    Notifications.cancelScheduledNotificationAsync(id).catch(() => {})
  ));

  // Reschedule valid items only
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await Promise.all(
    items
      .filter((i) => new Date(i.expires_at) > today)
      .map((i) => scheduleItemNotifications(i))
  );
}
