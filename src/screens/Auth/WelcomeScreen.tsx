import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../types';
import { Colors, Typography, Spacing, Radius } from '../../constants/tokens';

const { width, height } = Dimensions.get('window');

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen() {
  const nav = useNavigation<Nav>();

  return (
    <View style={styles.container}>
      {/* Background blobs */}
      <View style={[styles.blob, styles.blobGreen]} />
      <View style={[styles.blob, styles.blobYellow]} />

      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoArea}>
            <Text style={styles.logo}>SaveSmart</Text>
            <View style={styles.logoDivider} />
            <Text style={styles.tagline}>Умный бюджет · Продукты · Нутриция</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatCard value="6" label="экранов" />
            <StatCard value="3" label="модуля" />
            <StatCard value="AI" label="в основе" color={Colors.accentPurple} />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => nav.navigate('Register')}
            >
              <Text style={styles.btnPrimaryText}>Начать бесплатно</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => nav.navigate('Login')}
            >
              <Text style={styles.btnSecondaryText}>Уже есть аккаунт</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function StatCard({ value, label, color = Colors.accentTeal }: { value: string; label: string; color?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
    paddingBottom: Spacing.xxxl,
    paddingTop: height * 0.12,
  },

  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.7,
  },
  blobGreen: {
    width: 220,
    height: 220,
    backgroundColor: '#39FF14',
    top: -60,
    left: -60,
  },
  blobYellow: {
    width: 160,
    height: 160,
    backgroundColor: '#D4A017',
    top: 40,
    right: -40,
    opacity: 0.5,
  },

  logoArea: { alignItems: 'center', marginTop: height * 0.08 },
  logo: {
    fontSize: 48,
    fontWeight: Typography.weightBold,
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  logoDivider: {
    width: 120,
    height: 2,
    backgroundColor: Colors.accentPurple,
    marginVertical: Spacing.md,
  },
  tagline: {
    fontSize: Typography.sizeSM,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'center',
  },
  statCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    minWidth: 90,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: Typography.sizeXL,
    fontWeight: Typography.weightBold,
    color: Colors.accentTeal,
  },
  statLabel: {
    fontSize: Typography.sizeXS,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  actions: { gap: Spacing.md },
  btnPrimary: {
    backgroundColor: Colors.accentTeal,
    borderRadius: Radius.full,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: Colors.bg,
    fontSize: Typography.sizeMD,
    fontWeight: Typography.weightBold,
  },
  btnSecondary: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnSecondaryText: {
    color: Colors.textSecondary,
    fontSize: Typography.sizeMD,
    fontWeight: Typography.weightSemiBold,
  },
});
