import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/tokens';
import type { MainTabParamList, MoreStackParamList } from '../types';

import { DashboardScreen } from '../screens/Dashboard/DashboardScreen';
import { ScanScreen } from '../screens/Scan/ScanScreen';
import { SmartShopScreen } from '../screens/SmartShop/SmartShopScreen';
import { MoreMenuScreen } from '../screens/More/MoreMenuScreen';
import { GoalsScreen } from '../screens/Goals/GoalsScreen';
import { FridgeScreen } from '../screens/Fridge/FridgeScreen';
import { NutritionScreen } from '../screens/Nutrition/NutritionScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { AchievementsScreen } from '../screens/Achievements/AchievementsScreen';

// ─── More Stack (Goals, Fridge, Profile, Achievements) ───────────────────────
const MoreStack = createNativeStackNavigator<MoreStackParamList>();

function MoreNavigator() {
  return (
    <MoreStack.Navigator screenOptions={{ headerShown: false }}>
      <MoreStack.Screen name="MoreMenu"      component={MoreMenuScreen} />
      <MoreStack.Screen name="Goals"         component={GoalsScreen} />
      <MoreStack.Screen name="Fridge"        component={FridgeScreen} />
      <MoreStack.Screen name="Profile"       component={ProfileScreen} />
      <MoreStack.Screen name="Achievements"  component={AchievementsScreen} />
    </MoreStack.Navigator>
  );
}

// ─── Tab Navigator ────────────────────────────────────────────────────────────
const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_LABELS: Record<keyof MainTabParamList, string> = {
  Dashboard: 'Главная',
  Scan:      'Скан',
  Shop:      'Магазин',
  Nutrition: 'Нутри',
  More:      'Ещё',
};

const TAB_ICONS: Record<keyof MainTabParamList, string> = {
  Dashboard: '🏠',
  Scan:      '📷',
  Shop:      '🛒',
  Nutrition: '🥗',
  More:      '⋯',
};

export function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: Spacing.sm,
          paddingTop: Spacing.xs,
          height: 60,
        },
        tabBarLabel: ({ focused }) => (
          <Text style={{
            fontSize: Typography.sizeXS,
            color: focused ? Colors.accentTeal : Colors.textMuted,
            fontWeight: focused ? Typography.weightSemiBold : Typography.weightRegular,
          }}>
            {TAB_LABELS[route.name]}
          </Text>
        ),
        tabBarIcon: ({ focused }) => (
          <View style={{ marginBottom: -4 }}>
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
              {TAB_ICONS[route.name]}
            </Text>
          </View>
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Scan"      component={ScanScreen} />
      <Tab.Screen name="Shop"      component={SmartShopScreen} />
      <Tab.Screen name="Nutrition" component={NutritionScreen} />
      <Tab.Screen name="More"      component={MoreNavigator} />
    </Tab.Navigator>
  );
}
