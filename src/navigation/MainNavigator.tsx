import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MainTabParamList, MoreStackParamList } from '../types';
import { CurvedTabBar } from './CurvedTabBar';
import { GlassBackground } from '../components/GlassBackground';
import { Colors } from '../constants/tokens';

import { DashboardScreen } from '../screens/Dashboard/DashboardScreen';
import { ScanScreen } from '../screens/Scan/ScanScreen';
import { SmartShopScreen } from '../screens/SmartShop/SmartShopScreen';
import { NutritionScreen } from '../screens/Nutrition/NutritionScreen';
import { MoreMenuScreen } from '../screens/More/MoreMenuScreen';
import { GoalsScreen } from '../screens/Goals/GoalsScreen';
import { FridgeScreen } from '../screens/Fridge/FridgeScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { AchievementsScreen } from '../screens/Achievements/AchievementsScreen';
import { SubscriptionsScreen } from '../screens/Subscriptions/SubscriptionsScreen';
import { DebtsScreen } from '../screens/Debts/DebtsScreen';

const MoreStack = createNativeStackNavigator<MoreStackParamList>();

function MoreNavigator() {
  return (
    <MoreStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }}>
      <MoreStack.Screen name="MoreMenu"      component={MoreMenuScreen} />
      <MoreStack.Screen name="SmartShop"     component={SmartShopScreen} />
      <MoreStack.Screen name="Goals"         component={GoalsScreen} />
      <MoreStack.Screen name="Profile"       component={ProfileScreen} />
      <MoreStack.Screen name="Achievements"  component={AchievementsScreen} />
      <MoreStack.Screen name="Subscriptions" component={SubscriptionsScreen} />
      <MoreStack.Screen name="Debts"         component={DebtsScreen} />
      <MoreStack.Screen name="Fridge"        component={FridgeScreen} />
    </MoreStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainNavigator() {
  return (
    <GlassBackground>
      <Tab.Navigator
        tabBar={props => <CurvedTabBar {...props} />}
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }}
        initialRouteName="Dashboard"
      >
        <Tab.Screen name="Scan"      component={ScanScreen} />
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Nutrition" component={NutritionScreen} />
        <Tab.Screen name="More"      component={MoreNavigator} />
      </Tab.Navigator>
    </GlassBackground>
  );
}
