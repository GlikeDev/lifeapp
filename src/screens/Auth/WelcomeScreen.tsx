import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as AppleAuthentication from 'expo-apple-authentication';
import type { AuthStackParamList } from '../../types';
import { Colors, Typography, Spacing, Radius, Glass } from '../../constants/tokens';
import { supabase } from '../../lib/supabase';
import { useTranslation } from '../../i18n';

WebBrowser.maybeCompleteAuthSession();

const { height } = Dimensions.get('window');
type Nav = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen() {
  const nav = useNavigation<Nav>();
  const { t } = useTranslation();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingApple, setLoadingApple] = useState(false);

  async function handleGoogleSignIn() {
    setLoadingGoogle(true);
    try {
      const redirectUrl = Linking.createURL('auth/callback');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
      });
      if (error || !data.url) throw error ?? new Error('No URL');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      if (result.type === 'success') {
        const url = result.url;
        const params = new URLSearchParams(url.split('#')[1] ?? url.split('?')[1] ?? '');
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        }
      }
    } catch (e: any) {
      Alert.alert(t('scan.err.title'), e?.message ?? '');
    } finally {
      setLoadingGoogle(false);
    }
  }

  async function handleAppleSignIn() {
    setLoadingApple(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) throw new Error('No identity token');
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce: credential.authorizationCode ?? undefined,
      });
      if (error) throw error;
    } catch (e: any) {
      if (e?.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert(t('scan.err.title'), e?.message ?? '');
      }
    } finally {
      setLoadingApple(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />
      <View style={[styles.blob, styles.blob3]} />

      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>

          {/* Logo */}
          <View style={styles.logoArea}>
            <LinearGradient
              colors={[Colors.accentTeal, Colors.accentPurple]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.logoIcon}
            >
              <Text style={styles.logoIconText}>S</Text>
            </LinearGradient>
            <Text style={styles.logo}>SaveSmart</Text>
            <Text style={styles.tagline}>{t('welcome.tagline')}</Text>
          </View>

          {/* Features */}
          <View style={styles.features}>
            {[
              { icon: '📊', text: t('welcome.feat1') },
              { icon: '🤖', text: t('welcome.feat2') },
              { icon: '🥗', text: t('welcome.feat3') },
            ].map(f => (
              <View key={f.text} style={styles.featureRow}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>

          {/* Actions */}
          <View style={styles.actions}>

            {/* Google */}
            <TouchableOpacity style={styles.socialBtn} onPress={handleGoogleSignIn} activeOpacity={0.8} disabled={loadingGoogle}>
              {loadingGoogle ? <ActivityIndicator color={Colors.textPrimary} size="small" /> : (
                <>
                  <GoogleIcon />
                  <Text style={styles.socialBtnText}>{t('welcome.google')}</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Apple — iOS only, uses official Apple button per HIG guidelines */}
            {Platform.OS === 'ios' && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                cornerRadius={Radius.full}
                style={styles.appleAuthBtn}
                onPress={handleAppleSignIn}
              />
            )}

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('welcome.or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.btnPrimary} onPress={() => nav.navigate('Register')} activeOpacity={0.8}>
              <Text style={styles.btnPrimaryText}>{t('welcome.register')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnGhost} onPress={() => nav.navigate('Login')} activeOpacity={0.7}>
              <Text style={styles.btnGhostText}>{t('welcome.login')}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.legal}>{t('welcome.legal')}</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

function GoogleIcon() {
  return (
    <Text style={{ fontSize: 18, lineHeight: 22 }}>🌐</Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1 },
  content: { flex: 1, paddingHorizontal: Spacing.xl, justifyContent: 'space-between', paddingBottom: Spacing.xl, paddingTop: height * 0.06 },

  blob: { position: 'absolute', borderRadius: 999 },
  blob1: { width: 280, height: 280, backgroundColor: Colors.accentPurple + '18', top: -80, left: -80 },
  blob2: { width: 200, height: 200, backgroundColor: Colors.accentTeal + '12', top: 60, right: -60 },
  blob3: { width: 160, height: 160, backgroundColor: Colors.accentPurple + '10', bottom: 100, right: -40 },

  logoArea: { alignItems: 'center', gap: Spacing.md },
  logoIcon: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  logoIconText: { fontSize: 36, fontWeight: Typography.weightBold, color: Colors.bg },
  logo: { fontSize: 36, fontWeight: Typography.weightBold, color: Colors.textPrimary, letterSpacing: -1 },
  tagline: { fontSize: Typography.sizeSM, color: Colors.textSecondary, textAlign: 'center' },

  features: { gap: Spacing.md },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Glass.surface,
    borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Glass.border,
  },
  featureIcon: { fontSize: 20 },
  featureText: { fontSize: Typography.sizeSM, color: Colors.textSecondary, fontWeight: Typography.weightSemiBold },

  actions: { gap: Spacing.sm },

  socialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.md,
    backgroundColor: Glass.surface, borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Glass.border,
  },
  appleAuthBtn: { height: 50, width: '100%' },
  socialBtnText: { fontSize: Typography.sizeMD, color: Colors.textPrimary, fontWeight: Typography.weightSemiBold },

  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginVertical: Spacing.xs },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: Typography.sizeSM, color: Colors.textMuted },

  btnPrimary: { backgroundColor: Colors.accentTeal, borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center' },
  btnPrimaryText: { color: Colors.bg, fontSize: Typography.sizeMD, fontWeight: Typography.weightBold },

  btnGhost: { paddingVertical: Spacing.sm, alignItems: 'center' },
  btnGhostText: { color: Colors.textSecondary, fontSize: Typography.sizeSM },

  legal: { fontSize: Typography.sizeXS, color: Colors.textMuted, textAlign: 'center', lineHeight: 16 },
});
