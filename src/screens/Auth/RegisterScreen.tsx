import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlyphIcon } from '../../components/common';
import { Colors, Radius } from '../../constants/tokens';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { setUser } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signUp() {
    if (!name || !email || !password) { Alert.alert('Заполните все поля'); return; }
    if (password.length < 6) { Alert.alert('Пароль должен быть не менее 6 символов'); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    if (error) { Alert.alert('Ошибка', error.message); setLoading(false); return; }
    if (data.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, email: email.trim(), full_name: name.trim() });
      setUser({ id: data.user.id, email: email.trim(), full_name: name.trim() } as any);
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <GlyphIcon name="arrow-left" size={16} color={Colors.cyan} />
            <Text style={styles.backLabel}>Назад</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Регистрация</Text>
          <Text style={styles.sub}>Создайте аккаунт за минуту</Text>

          {[
            { label: 'ИМЯ', val: name, set: setName, ph: 'Алекс Иванов', secure: false, type: 'default' as const },
            { label: 'EMAIL', val: email, set: setEmail, ph: 'alex@example.com', secure: false, type: 'email-address' as const },
            { label: 'ПАРОЛЬ', val: password, set: setPassword, ph: '••••••••', secure: true, type: 'default' as const },
          ].map(f => (
            <View key={f.label}>
              <Text style={styles.fieldLabel}>{f.label}</Text>
              <TextInput
                style={styles.input} value={f.val} onChangeText={f.set}
                placeholder={f.ph} placeholderTextColor={Colors.t4}
                secureTextEntry={f.secure} keyboardType={f.type}
                autoCapitalize={f.type === 'email-address' ? 'none' : 'words'}
              />
            </View>
          ))}

          <View style={{ flex: 1, minHeight: 40 }} />

          <TouchableOpacity onPress={signUp} activeOpacity={0.85} disabled={loading}>
            <LinearGradient colors={[Colors.cyan, Colors.purple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
              <Text style={styles.btnLabel}>{loading ? 'Создаём...' : 'Создать аккаунт'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.switchText}>
            Уже есть аккаунт?{' '}
            <Text style={{ color: Colors.cyan }} onPress={() => navigation.navigate('Login')}>
              Войти
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
  fieldLabel: { fontFamily: 'monospace', fontSize: 10, letterSpacing: 1.8, color: Colors.t3, textTransform: 'uppercase', marginBottom: 6 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: Colors.border2,
    borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: Colors.t1, marginBottom: 12,
  },
  btn: { paddingVertical: 16, borderRadius: Radius.full, alignItems: 'center', marginBottom: 16 },
  btnLabel: { fontSize: 15, fontWeight: '700', color: '#06070D' },
  switchText: { textAlign: 'center', fontSize: 12, color: Colors.t3 },
});
