import { Platform, PlatformIOSStatic } from 'react-native';

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

// iOS version helpers
const iosVersion = isIOS
  ? parseInt(String((Platform as PlatformIOSStatic).Version), 10)
  : 0;

export const isIOS15Plus = iosVersion >= 15;
export const isIOS16Plus = iosVersion >= 16;

// Keyboard behavior: 'padding' on iOS, undefined on Android
export const keyboardBehavior = isIOS ? ('padding' as const) : undefined;

// ScrollView indicator style for dark-background screens
export const scrollIndicatorStyle = isIOS ? ('white' as const) : (undefined as any);

// Haptic feedback on iOS only
export async function triggerSelectionHaptic() {
  if (!isIOS) return;
  const Haptics = await import('expo-haptics');
  Haptics.selectionAsync();
}

export async function triggerImpactHaptic(style: 'light' | 'medium' | 'heavy' = 'light') {
  if (!isIOS) return;
  const Haptics = await import('expo-haptics');
  const map = {
    light:  Haptics.ImpactFeedbackStyle.Light,
    medium: Haptics.ImpactFeedbackStyle.Medium,
    heavy:  Haptics.ImpactFeedbackStyle.Heavy,
  };
  Haptics.impactAsync(map[style]);
}

export async function triggerSuccessHaptic() {
  if (!isIOS) return;
  const Haptics = await import('expo-haptics');
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}
