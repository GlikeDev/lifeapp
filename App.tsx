import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';
import { useFonts } from 'expo-font';
import { RootNavigator } from './src/navigation/RootNavigator';
import { Colors } from './src/constants/tokens';

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
