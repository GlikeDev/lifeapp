import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../types';
import { Colors, Typography, Spacing, Radius } from '../../constants/tokens';
import { supabase } from '../../lib/supabase';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export function RegisterScreen() {
  const nav = useNavigation<Nav>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name || !email || !password) {
      Alert.alert('Заполните все поля');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Пароль должен быть минимум 6 символов');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    setLoading(false);
    if (error) {
      Alert.alert('Ошибка регистрации', error.message);
      return;
    }
    // Trigger fires handle_new_user() → creates profile
    // Then go to onboarding
    nav.navigate('OnboardingProfile');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={styles.back} onPress={() => nav.goBack()}>
            <Text style={styles.backText}>← Назад</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Регистрация</Text>
          <Text style={styles.subtitle}>Создайте аккаунт SaveSmart</Text>

          {/* Progress dots */}
          <View style={styles.dots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Имя</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Марго"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="you@example.com"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.label}>Пароль</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Минимум 6 символов"
              placeholderTextColor={Colors.textMuted}
            />

            <TouchableOpacity
              style={[styles.btnPrimary, loading && styles.btnDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={Colors.bg} />
                : <Text style={styles.btnPrimaryText}>Далее →</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.link}
              onPress={() => nav.navigate('Login')}
            >
              <Text style={styles.linkText}>Уже есть аккаунт? <Text style={styles.linkAccent}>Войти</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { flexGrow: 1, padding: Spacing.xl, paddingBottom: 40 },

  back: { marginBottom: Spacing.xl },
  backText: { color: Colors.accentTeal, fontSize: Typography.sizeMD },

  title: { fontSize: 32, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.sizeMD, color: Colors.textSecondary, marginTop: Spacing.xs },

  dots: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg, marginBottom: Spacing.xxxl },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.accentTeal, width: 24 },

  form: { gap: Spacing.xs },
  label: { fontSize: Typography.sizeSM, color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.md },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: Typography.sizeMD,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  btnPrimary: {
    backgroundColor: Colors.accentTeal,
    borderRadius: Radius.full,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  btnDisabled: { opacity: 0.6 },
  btnPrimaryText: { color: Colors.bg, fontSize: Typography.sizeMD, fontWeight: Typography.weightBold },

  link: { alignItems: 'center', marginTop: Spacing.lg },
  linkText: { color: Colors.textSecondary, fontSize: Typography.sizeSM },
  linkAccent: { color: Colors.accentTeal, fontWeight: Typography.weightSemiBold },
});
