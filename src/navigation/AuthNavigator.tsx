import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../types';
import { GlassBackground } from '../components/GlassBackground';
import { Colors } from '../constants/tokens';

import { WelcomeScreen } from '../screens/Auth/WelcomeScreen';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { RegisterScreen } from '../screens/Auth/RegisterScreen';
import { OnboardingScreen } from '../screens/Auth/OnboardingScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <GlassBackground>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }}>
        <Stack.Screen name="Welcome"    component={WelcomeScreen} />
        <Stack.Screen name="Login"      component={LoginScreen} />
        <Stack.Screen name="Register"   component={RegisterScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      </Stack.Navigator>
    </GlassBackground>
  );
}
