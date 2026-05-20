import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';
import { useFonts } from 'expo-font';
import { RootNavigator } from './src/navigation/RootNavigator';
import { Colors } from './src/constants/tokens';
import {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakSlider,
  TweakToggle,
  TweakRadio,
  TweakColor,
} from './src/components/TweaksPanel';

const TWEAK_DEFAULTS = {
  blurIntensity: 95,
  surfaceOpacity: 5,
  borderOpacity: 13,
  fontSize: 15,
  fontWeight: 'regular' as const,
  primary: '#00D4C8',
  background: '#0A0A14',
  radius: 'lg' as const,
  showBorders: true,
  showShadows: true,
};

function DevTweaksPanel() {
  const [t, set] = useTweaks(TWEAK_DEFAULTS);
  return (
    <TweaksPanel title="Design Tweaks">
      <TweakSection label="Glass Surface" />
      <TweakSlider label="Blur intensity" value={t.blurIntensity} min={40} max={120} unit="%" onChange={v => set('blurIntensity', v)} />
      <TweakSlider label="Surface opacity" value={t.surfaceOpacity} min={1} max={30} unit="%" onChange={v => set('surfaceOpacity', v)} />
      <TweakSlider label="Border opacity" value={t.borderOpacity} min={5} max={40} unit="%" onChange={v => set('borderOpacity', v)} />

      <TweakSection label="Typography" />
      <TweakSlider label="Base font size" value={t.fontSize} min={12} max={20} unit="px" onChange={v => set('fontSize', v)} />
      <TweakRadio label="Weight" value={t.fontWeight} options={['light', 'regular', 'bold']} onChange={v => set('fontWeight', v)} />

      <TweakSection label="Accent" />
      <TweakColor
        label="Primary"
        value={t.primary}
        options={['#00D4C8', '#7B6CF6', '#FF6B9D', '#39D98A', '#F5A623', '#4A90E2']}
        onChange={v => set('primary', v)}
      />
      <TweakColor
        label="Background"
        value={t.background}
        options={['#0A0A14', '#0D0D1A', '#0F0F20', '#111128', '#13131E', '#080810']}
        onChange={v => set('background', v)}
      />

      <TweakSection label="Layout" />
      <TweakRadio label="Radius" value={t.radius} options={['sm', 'md', 'lg', 'xl']} onChange={v => set('radius', v)} />
      <TweakToggle label="Show borders" value={t.showBorders} onChange={v => set('showBorders', v)} />
      <TweakToggle label="Show shadows" value={t.showShadows} onChange={v => set('showShadows', v)} />
    </TweaksPanel>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'Sora-Regular':   require('./assets/fonts/Sora-Regular.ttf'),
    'Sora-SemiBold':  require('./assets/fonts/Sora-SemiBold.ttf'),
    'Sora-Bold':      require('./assets/fonts/Sora-Bold.ttf'),
    'Onest-Regular':  require('./assets/fonts/Onest-Regular.ttf'),
    'Onest-Medium':   require('./assets/fonts/Onest-Medium.ttf'),
    'Onest-SemiBold': require('./assets/fonts/Onest-SemiBold.ttf'),
    'Onest-Bold':     require('./assets/fonts/Onest-Bold.ttf'),
  });

  if (!fontsLoaded) return <View style={styles.root} />;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={Colors.bg} translucent />
        <RootNavigator />
        {__DEV__ && <DevTweaksPanel />}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
});
