import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, NavigationContainerRef, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';
import { requestNotificationPermissions, rescheduleAllFridgeNotifications } from '../lib/notifications';
import type { Session } from '@supabase/supabase-js';
import type { RootStackParamList } from '../types';
import { Colors } from '../constants/tokens';
import { useAuthStore } from '../store/useAuthStore';
import { useBudgetStore } from '../store/useBudgetStore';

import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { OnboardingScreen } from '../screens/Auth/OnboardingScreen';
import { FinanceDetailScreen } from '../screens/Dashboard/FinanceDetailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background:   Colors.bg,
    card:         Colors.bg,
    text:         '#FFFFFF',
    border:       'rgba(255,255,255,0.08)',
    primary:      '#22D3EE',
    notification: '#22D3EE',
  },
};

export function RootNavigator() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { setUser, user } = useAuthStore();
  const { setMonthlyBudget } = useBudgetStore();
  const navRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) {
      const { data: { user } } = await supabase.auth.getUser();
      setUser({ ...data, email: user?.email ?? '' });
      setMonthlyBudget(data.monthly_budget ?? 0);
    }
  }

  useEffect(() => {
    // Auth init
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) loadProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        loadProfile(session.user.id);
        // Reschedule fridge notifications on sign-in
        supabase
          .from('fridge_items')
          .select('*')
          .eq('user_id', session.user.id)
          .then(({ data }) => {
            if (data) rescheduleAllFridgeNotifications(data as any).catch(() => {});
          });
      }
    });

    // Request notification permissions
    requestNotificationPermissions().catch(() => {});

    // Handle tap on notification → navigate to Fridge
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const screen = response.notification.request.content.data?.screen;
      if (screen === 'Fridge' && navRef.current) {
        navRef.current.navigate('Main' as any);
        // Small delay to ensure Main navigator is mounted
        setTimeout(() => {
          (navRef.current as any)?.navigate('More', { screen: 'Fridge' });
        }, 300);
      }
    });

    return () => {
      subscription.unsubscribe();
      responseSub.remove();
    };
  }, []);

  const needsOnboarding = session && user && !user.onboarding_done;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.accentTeal} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navRef} theme={AppTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
        {!session ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : needsOnboarding ? (
          <Stack.Screen name="Auth" component={OnboardingScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainNavigator} />
        )}
        <Stack.Screen
          name="FinanceDetail"
          component={FinanceDetailScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
