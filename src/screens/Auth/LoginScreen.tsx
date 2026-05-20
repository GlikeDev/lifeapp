import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlyphIcon } from '../../components/common';
import { Colors, Radius, fontMono } from '../../constants/tokens';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signIn() {
    if (!email || !password) { Alert.alert('Заполните все поля'); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) { Alert.alert('Ошибка входа', error.message); setLoading(false); return; }
    const profile = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
    setUser(profile.data ?? { id: data.user.id, email: data.user.email ?? '', full_name: '' } as any);
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <GlyphIcon name="arrow-left" size={16} color={Colors.cyan} />
            <Text style={styles.backLabel}>Назад</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Вход</Text>
          <Text style={styles.sub}>Умный бюджет · Продукты · Нутриция</Text>

          <Text style={styles.fieldLabel}>ЭЛЕКТРОННАЯ ПОЧТА</Text>
          <TextInput
            style={styles.input} value={email} onChangeText={setEmail}
            placeholder="alex@example.com" placeholderTextColor={Colors.t4}
            keyboardType="email-address" autoCapitalize="none"
          />

          <Text style={styles.fieldLabel}>ПАРОЛЬ</Text>
          <TextInput
            style={[styles.input, { marginBottom: 0 }]} value={password} onChangeText={setPassword}
            placeholder="••••••••" placeholderTextColor={Colors.t4}
            secureTextEntry
          />

          <View style={{ flex: 1, minHeight: 40 }} />

          <TouchableOpacity onPress={signIn} activeOpacity={0.85} disabled={loading}>
            <LinearGradient colors={[Colors.cyan, Colors.purple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
              <Text style={styles.btnLabel}>{loading ? 'Входим...' : 'Войти'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.switchText}>
            Нет аккаунта?{' '}
            <Text style={{ color: Colors.cyan }} onPress={() => navigation.navigate('Register')}>
              Регистрация
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 32 },
  backLabel: { fontSize: 13, color: Colors.cyan },
  title: { fontSize: 32, fontWeight: '800', color: Colors.t1, marginBottom: 6, letterSpacing: -0.8 },
  sub: { fontSize: 14, color: Colors.t2, marginBottom: 24 },
  fieldLabel: { fontFamily: fontMono, fontSize: 10, letterSpacing: 1.8, color: Colors.t3, textTransform: 'uppercase', marginBottom: 6 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: Colors.border2,
    borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: Colors.t1, marginBottom: 12,
  },
  btn: { paddingVertical: 16, borderRadius: Radius.full, alignItems: 'center', marginBottom: 16 },
  btnLabel: { fontSize: 15, fontWeight: '700', color: '#06070D' },
  switchText: { textAlign: 'center', fontSize: 12, color: Colors.t3 },
});
