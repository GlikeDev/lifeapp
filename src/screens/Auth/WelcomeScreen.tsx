import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard, GlyphIcon } from '../../components/common';
import { Colors, Radius, fontMono } from '../../constants/tokens';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={styles.blobTop} />
        <View style={styles.blobBot} />
      </View>

      <View style={styles.content}>
        <View style={{ marginTop: 32 }}>
          <Text style={styles.mono}>SaveSmart · v1.0</Text>
          <Text style={styles.wordmark}>
            Save{'\n'}<Text style={{ color: Colors.cyan }}>Smart</Text>.
          </Text>
          <Text style={styles.tagline}>Умный бюджет · Продукты · Нутриция</Text>
        </View>

        <View style={styles.tileGrid}>
          <CapTile icon="bolt"      value="AI"   sub="в основе"    color={Colors.magenta} />
          <CapTile icon="star"      value="48"   sub="ачивок"      color={Colors.cyan}    />
          <CapTile icon="cart"      value="3M+"  sub="продуктов"   color={Colors.cyan}    />
          <CapTile icon="fire"      value="92"   sub="день стрика" color={Colors.gold}    />
        </View>

        <View style={styles.ctas}>
          <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.85}>
            <LinearGradient colors={[Colors.cyan, Colors.purple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
              <Text style={styles.btnLabel}>Начать бесплатно</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.btnGhost} activeOpacity={0.85}>
            <Text style={styles.btnGhostLabel}>Уже есть аккаунт</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function CapTile({ icon, value, sub, color }: { icon: any; value: string; sub: string; color: string }) {
  return (
    <GlassCard style={styles.tile}>
      <GlyphIcon name={icon} size={20} color={color} />
      <Text style={[styles.tileValue, { color: Colors.t1 }]}>{value}</Text>
      <Text style={styles.tileSub}>{sub}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { flex: 1, paddingHorizontal: 24, paddingBottom: 48, justifyContent: 'space-between' },
  blobTop: {
    position: 'absolute', width: 380, height: 380, borderRadius: 190,
    backgroundColor: Colors.cyan + 'B2', top: -120, left: -120, opacity: 0.2,
  },
  blobBot: {
    position: 'absolute', width: 320, height: 320, borderRadius: 160,
    backgroundColor: Colors.magenta + 'B2', bottom: -100, right: -80, opacity: 0.18,
  },
  mono: { fontFamily: fontMono, fontSize: 10, letterSpacing: 2, color: Colors.t3, textTransform: 'uppercase', marginBottom: 14 },
  wordmark: { fontSize: 56, fontWeight: '800', letterSpacing: -2, lineHeight: 60, color: Colors.t1, marginBottom: 16 },
  tagline: { color: Colors.t2, fontSize: 15, lineHeight: 22 },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '47%', padding: 14, gap: 4 },
  tileValue: { fontSize: 24, fontWeight: '700', marginTop: 4 },
  tileSub: { fontSize: 11, color: Colors.t3 },
  ctas: { gap: 10 },
  btn: { paddingVertical: 16, borderRadius: Radius.full, alignItems: 'center' },
  btnLabel: { fontSize: 15, fontWeight: '700', color: '#06070D' },
  btnGhost: {
    paddingVertical: 15, borderRadius: Radius.full, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: Colors.border2,
  },
  btnGhostLabel: { fontSize: 15, fontWeight: '600', color: Colors.t1 },
});
