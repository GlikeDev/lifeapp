import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MainTabParamList, MoreStackParamList } from '../types';
import { CurvedTabBar } from './CurvedTabBar';

import { DashboardScreen } from '../screens/Dashboard/DashboardScreen';
import { ScanScreen } from '../screens/Scan/ScanScreen';
import { SmartShopScreen } from '../screens/SmartShop/SmartShopScreen';
import { NutritionScreen } from '../screens/Nutrition/NutritionScreen';
import { MoreMenuScreen } from '../screens/More/MoreMenuScreen';
import { GoalsScreen } from '../screens/Goals/GoalsScreen';
import { FridgeScreen } from '../screens/Fridge/FridgeScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { AchievementsScreen } from '../screens/Achievements/AchievementsScreen';

const MoreStack = createNativeStackNavigator<MoreStackParamList>();

function MoreNavigator() {
  return (
    <MoreStack.Navigator screenOptions={{ headerShown: false }}>
      <MoreStack.Screen name="MoreMenu"     component={MoreMenuScreen} />
      <MoreStack.Screen name="Goals"        component={GoalsScreen} />
      <MoreStack.Screen name="Fridge"       component={FridgeScreen} />
      <MoreStack.Screen name="Profile"      component={ProfileScreen} />
      <MoreStack.Screen name="Achievements" component={AchievementsScreen} />
    </MoreStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CurvedTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Scan"      component={ScanScreen} />
      <Tab.Screen name="Shop"      component={SmartShopScreen} />
      <Tab.Screen name="Nutrition" component={NutritionScreen} />
      <Tab.Screen name="More"      component={MoreNavigator} />
    </Tab.Navigator>
  );
}
