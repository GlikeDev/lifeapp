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
import { Colors, Typography, Spacing, Radius, Glass } from '../../constants/tokens';
import { supabase } from '../../lib/supabase';
import { useTranslation } from '../../i18n';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
  const nav = useNavigation<Nav>();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert(t('login.errFields'));
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert(t('login.errTitle'), error.message);
    // On success RootNavigator auto-switches to Main via onAuthStateChange
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          indicatorStyle="white"
        >
          <TouchableOpacity style={styles.back} onPress={() => nav.goBack()}>
            <Text style={styles.backText}>{t('login.back')}</Text>
          </TouchableOpacity>

          <Text style={styles.title}>{t('login.title')}</Text>
          <Text style={styles.subtitle}>{t('login.sub')}</Text>

          <View style={styles.form}>
            <Text style={styles.label}>{t('login.email')}</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              spellCheck={false}
              returnKeyType="next"
              textContentType="emailAddress"
              selectionColor={Colors.accentTeal}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.label}>{t('login.password')}</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              textContentType="password"
              selectionColor={Colors.accentTeal}
              onSubmitEditing={handleLogin}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
            />

            <TouchableOpacity
              style={[styles.btnPrimary, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={Colors.bg} />
                : <Text style={styles.btnPrimaryText}>{t('login.btn')}</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.link}
              onPress={() => nav.navigate('Register')}
            >
              <Text style={styles.linkText}>{t('login.noAcc')}<Text style={styles.linkAccent}>{t('login.register')}</Text></Text>
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
  subtitle: { fontSize: Typography.sizeMD, color: Colors.textSecondary, marginTop: Spacing.xs, marginBottom: Spacing.xxxl },

  form: { gap: Spacing.xs },
  label: { fontSize: Typography.sizeSM, color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.md },
  input: {
    backgroundColor: Glass.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: Typography.sizeMD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Glass.border,
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
