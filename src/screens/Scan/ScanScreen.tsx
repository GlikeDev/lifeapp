import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, FlatList,
  TextInput, Animated, KeyboardAvoidingView, Platform, Modal,
  ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { MainTabParamList } from '../../types';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors, Typography, Spacing, Radius, Layout, Glass } from '../../constants/tokens';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { useBudgetStore } from '../../store/useBudgetStore';
import { formatCurrency } from '../../utils/format';
import type { Transaction } from '../../types';
import { CoachMark, TipStep } from '../../components/CoachMark';
import { useCoachMark } from '../../hooks/useCoachMark';
import { useTranslation } from '../../i18n';
import { GradientGlyphIcon } from '../../components/common/GlyphIcon';
import type { GradientGlyphName } from '../../components/common/GlyphIcon';

// SCAN_TIPS built dynamically inside component using t()

const { width: SW, height: SH } = Dimensions.get('window');
const VF_W = Math.round(SW * 0.76);
const VF_H = Math.round(VF_W * 0.62);
const VF_TOP = (SH - VF_H) / 2 - 60;

type Mode = 'hub' | 'camera' | 'manual' | 'pdf' | 'success';
type TxType = 'expense' | 'income';

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function IcoCamera({ c = '#fff', n = 24 }: { c?: string; n?: number }) {
  return (
    <Svg width={n} height={n} viewBox="0 0 24 24" fill="none">
      <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke={c} strokeWidth={1.8} strokeLinejoin="round"/>
      <Circle cx="12" cy="13" r="4" stroke={c} strokeWidth={1.8}/>
    </Svg>
  );
}

function IcoDoc({ c = '#fff', n = 24 }: { c?: string; n?: number }) {
  return (
    <Svg width={n} height={n} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={c} strokeWidth={1.8} strokeLinejoin="round"/>
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={c} strokeWidth={1.8} strokeLinecap="round"/>
    </Svg>
  );
}

function IcoEdit({ c = '#fff', n = 24 }: { c?: string; n?: number }) {
  return (
    <Svg width={n} height={n} viewBox="0 0 24 24" fill="none">
      <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function IcoCheck({ c = '#fff', n = 24 }: { c?: string; n?: number }) {
  return (
    <Svg width={n} height={n} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={c} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function IcoLeft({ c = '#fff', n = 24 }: { c?: string; n?: number }) {
  return (
    <Svg width={n} height={n} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function IcoRight({ c = '#fff', n = 24 }: { c?: string; n?: number }) {
  return (
    <Svg width={n} height={n} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function IcoBarcode({ c = '#fff', n = 24 }: { c?: string; n?: number }) {
  return (
    <Svg width={n} height={n} viewBox="0 0 24 24" fill="none">
      <Path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" stroke={c} strokeWidth={1.8} strokeLinecap="round"/>
      <Path d="M7 8v8M10 8v8M13 8v8M16 8v8" stroke={c} strokeWidth={1.8} strokeLinecap="round"/>
    </Svg>
  );
}

function IcoDown({ c = '#fff', n = 18 }: { c?: string; n?: number }) {
  return (
    <Svg width={n} height={n} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M19 12l-7 7-7-7" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function IcoUp({ c = '#fff', n = 18 }: { c?: string; n?: number }) {
  return (
    <Svg width={n} height={n} viewBox="0 0 24 24" fill="none">
      <Path d="M12 19V5M5 12l7-7 7 7" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

type CatDef = { key: string; tKey: string; color: string; glyph: GradientGlyphName };

const EXPENSE_CATS: CatDef[] = [
  { key: 'food',          tKey: 'cat.food',          color: Colors.categoryFood,      glyph: 'grad-salad'      },
  { key: 'cafe',          tKey: 'cat.cafe',          color: '#F97316',                glyph: 'grad-coffee'     },
  { key: 'restaurant',    tKey: 'cat.restaurant',    color: '#FB923C',                glyph: 'grad-pizza'      },
  { key: 'transport',     tKey: 'cat.transport',     color: Colors.categoryTransport, glyph: 'grad-taxi'       },
  { key: 'auto',          tKey: 'cat.auto',          color: '#94A3B8',                glyph: 'grad-car'        },
  { key: 'home',          tKey: 'cat.home',          color: Colors.categoryHome,      glyph: 'grad-bolt'       },
  { key: 'health',        tKey: 'cat.health',        color: Colors.accentTeal,        glyph: 'grad-salad'      },
  { key: 'pharmacy',      tKey: 'cat.pharmacy',      color: '#34D399',                glyph: 'grad-coins'      },
  { key: 'entertainment', tKey: 'cat.entertainment', color: Colors.pink,              glyph: 'grad-confetti'   },
  { key: 'shopping',      tKey: 'cat.shopping',      color: '#F5554A',                glyph: 'grad-cart'       },
  { key: 'clothing',      tKey: 'cat.clothing',      color: '#A78BFA',                glyph: 'grad-sparkle'    },
  { key: 'education',     tKey: 'cat.education',     color: '#60A5FA',                glyph: 'grad-graduation' },
  { key: 'sport',         tKey: 'cat.sport',         color: '#39D98A',                glyph: 'grad-dumbbell'   },
  { key: 'beauty',        tKey: 'cat.beauty',        color: '#FF6B9D',                glyph: 'grad-ring'       },
  { key: 'travel',        tKey: 'cat.travel',        color: '#38BDF8',                glyph: 'grad-beach'      },
  { key: 'subscriptions', tKey: 'cat.subscriptions', color: Colors.accentPurple,      glyph: 'grad-phone'      },
  { key: 'pets',          tKey: 'cat.pets',          color: '#FBBF24',                glyph: 'grad-sparkle'    },
  { key: 'kids',          tKey: 'cat.kids',          color: '#FCA5A5',                glyph: 'grad-confetti'   },
  { key: 'gifts',         tKey: 'cat.gifts',         color: '#F472B6',                glyph: 'grad-star'       },
  { key: 'alcohol',       tKey: 'cat.alcohol',       color: '#C084FC',                glyph: 'grad-coffee'     },
  { key: 'other',         tKey: 'cat.other',         color: Colors.textMuted,         glyph: 'grad-sparkle'    },
];

const INCOME_CATS: CatDef[] = [
  { key: 'salary',     tKey: 'cat.salary',     color: Colors.success,      glyph: 'grad-coins'   },
  { key: 'freelance',  tKey: 'cat.freelance',  color: Colors.accentPurple, glyph: 'grad-bolt'    },
  { key: 'business',   tKey: 'cat.business',   color: '#FAAD14',           glyph: 'grad-coins'   },
  { key: 'investment', tKey: 'cat.investment', color: '#39D98A',           glyph: 'grad-bolt'    },
  { key: 'rental',     tKey: 'cat.rental',     color: '#60A5FA',           glyph: 'grad-coins'   },
  { key: 'bonus',      tKey: 'cat.bonus',      color: '#FF6B9D',           glyph: 'grad-star'    },
  { key: 'transfer',   tKey: 'cat.transfer',   color: Colors.accentTeal,   glyph: 'grad-coins'   },
  { key: 'gift',       tKey: 'cat.gift',       color: Colors.pink,         glyph: 'grad-star'    },
  { key: 'cashback',   tKey: 'cat.cashback',   color: Colors.categoryHome, glyph: 'grad-bolt'    },
  { key: 'pension',    tKey: 'cat.pension',    color: '#94A3B8',           glyph: 'grad-coins'   },
  { key: 'refund',     tKey: 'cat.refund',     color: '#34D399',           glyph: 'grad-bolt'    },
  { key: 'other',      tKey: 'cat.other',      color: Colors.textMuted,    glyph: 'grad-sparkle' },
];

const ALL_CATS = [...EXPENSE_CATS, ...INCOME_CATS];

const MOCK_PDF = [
  { id: '1', amount: 1240,  label: 'Пятёрочка',    type: 'expense' as TxType, cat: 'food' },
  { id: '2', amount: 350,   label: 'Яндекс.Такси', type: 'expense' as TxType, cat: 'transport' },
  { id: '3', amount: 45000, label: 'ООО Компания',  type: 'income'  as TxType, cat: 'salary' },
  { id: '4', amount: 2890,  label: 'OZON',          type: 'expense' as TxType, cat: 'shopping' },
  { id: '5', amount: 580,   label: 'Аптека 36.6',   type: 'expense' as TxType, cat: 'health' },
  { id: '6', amount: 1500,  label: 'Нетфликс',      type: 'expense' as TxType, cat: 'entertainment' },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ScanScreen() {
  const { user } = useAuthStore();
  const { addTransaction } = useBudgetStore();
  const insets = useSafeAreaInsets();
  const currency = user?.currency ?? 'EUR';
  const { visible: tipsVisible, complete: tipsDone } = useCoachMark('scan');
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<MainTabParamList, 'Scan'>>();

  const { t } = useTranslation();

  const SCAN_TIPS: TipStep[] = [
    { icon: '📱', title: t('scan.tip0.title'), body: t('scan.tip0.body') },
    { icon: '📸', title: t('scan.tip1.title'), body: t('scan.tip1.body') },
    { icon: '🏦', title: t('scan.tip2.title'), body: t('scan.tip2.body') },
    { icon: '✏️', title: t('scan.tip3.title'), body: t('scan.tip3.body') },
  ];

  const initType = (route.params as any)?.txType ?? 'expense';
  const initMode = (route.params as any)?.mode ?? 'hub';

  const [mode, setMode]             = useState<Mode>(initMode);
  const [permission, reqPerm]       = useCameraPermissions();
  const [txType, setTxType]         = useState<TxType>(initType);
  const [amount, setAmount]         = useState('');
  const [category, setCategory]     = useState('food');
  const [note, setNote]             = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [saving, setSaving]         = useState(false);
  const [showNote, setShowNote]     = useState(false);
  const [catSheetOpen, setCatSheetOpen] = useState(false);

  // PDF
  const [pdfName, setPdfName]       = useState<string | null>(null);
  const [pdfParsing, setPdfParsing] = useState(false);
  const [pdfItems, setPdfItems]     = useState<typeof MOCK_PDF>([]);
  const [selected, setSelected]     = useState<Set<string>>(new Set());

  // Success
  const [lastAmt, setLastAmt]       = useState(0);
  const [lastCat, setLastCat]       = useState('');
  const [lastType, setLastType]     = useState<TxType>('expense');

  // Animations
  const hubAnim     = useRef(new Animated.Value(0)).current;
  const scanAnim    = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const p = (route.params as any);
    if (p?.mode === 'manual') {
      setTxType(p.txType ?? 'expense');
      setCategory(p.txType === 'income' ? 'salary' : 'food');
      setMode('manual');
    }
  }, [route.params]);

  useEffect(() => {
    if (mode === 'hub') {
      hubAnim.setValue(0);
      Animated.timing(hubAnim, { toValue: 1, duration: 380, useNativeDriver: true }).start();
    }
    if (mode === 'camera') {
      scanAnim.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
          Animated.timing(scanAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
        ])
      ).start();
    }
    if (mode === 'success') {
      successAnim.setValue(0);
      Animated.spring(successAnim, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }).start();
    }
  }, [mode]);

  function switchType(t: TxType) {
    setTxType(t);
    setCategory(t === 'expense' ? 'food' : 'salary');
    Haptics.selectionAsync();
  }

  async function openCamera() {
    if (!permission?.granted) {
      const r = await reqPerm();
      if (!r.granted) { Alert.alert(t('scan.noCam'), t('scan.noCamDesc')); return; }
    }
    setMode('camera');
  }

  async function pickGallery() {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (!r.canceled) {
      setAmount('1450');
      setCategory('food');
      setTxType('expense');
      setMode('manual');
    }
  }

  function captureAndParse() {
    setAmount('890');
    setCategory('food');
    setTxType('expense');
    setMode('manual');
  }

  async function pickPDF() {
    // Pick any file via ImagePicker (Android shows file manager if mediaTypes includes other)
    // We simulate parsing after selection for a polished UX
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'livePhotos'] as any,
      quality: 1,
    });
    // Simulate PDF selection regardless of result (demo mode for bank statement parsing)
    const fakeName = r.canceled
      ? 'statement_' + new Date().toISOString().slice(0, 10) + '.pdf'
      : (r.assets?.[0]?.fileName ?? 'bank_statement.pdf');
    setPdfName(fakeName.replace(/\.(jpg|jpeg|png|heic)$/i, '.pdf'));
    setPdfParsing(true);
    setPdfItems([]);
    setTimeout(() => {
      setPdfParsing(false);
      setPdfItems(MOCK_PDF);
      setSelected(new Set(MOCK_PDF.map(i => i.id)));
    }, 2400);
  }

  async function handleSave() {
    const num = parseFloat(amount.replace(/\s/g, '').replace(',', '.'));
    if (!user || isNaN(num) || num <= 0) { Alert.alert(t('scan.err.title'), t('scan.err.amount')); return; }
    setSaving(true);
    const storedAmt = txType === 'income' ? -num : num;
    try {
      const { data, error } = await supabase.from('transactions').insert({
        user_id: user.id,
        amount: storedAmt,
        category: category as any,
        store: txType === 'income' ? 'Доход' : 'Не указан',
        note: note || null,
        date: selectedDate.toISOString().slice(0, 10),
      }).select().single();
      if (error) throw error;
      addTransaction(data as Transaction);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setLastAmt(num); setLastCat(category); setLastType(txType);
      setAmount(''); setNote(''); setSelectedDate(new Date()); setShowNote(false);
      setMode('success');
    } catch (e: any) { Alert.alert(t('scan.err.title'), e.message); }
    finally { setSaving(false); }
  }

  async function handleImportPDF() {
    if (!user || selected.size === 0) return;
    setSaving(true);
    const items = pdfItems.filter(i => selected.has(i.id));
    const today = new Date().toISOString().slice(0, 10);
    try {
      for (const item of items) {
        await supabase.from('transactions').insert({
          user_id: user.id,
          amount: item.type === 'income' ? -item.amount : item.amount,
          category: item.cat as any,
          store: item.label,
          date: today,
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(t('scan.importDone'), t('scan.importMsg', { count: items.length }));
      setPdfName(null); setPdfItems([]); setSelected(new Set());
      setMode('hub');
    } catch (e: any) { Alert.alert(t('scan.err.title'), e.message); }
    finally { setSaving(false); }
  }

  const cats = txType === 'expense' ? EXPENSE_CATS : INCOME_CATS;
  const cardStyle = {
    opacity: hubAnim,
    transform: [{ translateY: hubAnim.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }],
  };

  // ── HUB ──────────────────────────────────────────────────────────────────────
  if (mode === 'hub') {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <ScrollView contentContainerStyle={s.hubPad} showsVerticalScrollIndicator={false}>

          <Animated.View style={cardStyle}>
            <Text style={s.hubTitle}>{t('scan.title')}</Text>
            <Text style={s.hubSub}>{t('scan.sub')}</Text>
          </Animated.View>

          {/* Top 2 cards */}
          <Animated.View style={[s.row2, cardStyle]}>
            <TouchableOpacity style={s.halfCard} onPress={openCamera} activeOpacity={0.82}>
              <LinearGradient colors={['#7B6CF6', '#5243D1']} style={s.halfGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={s.cardIcon}>
                  <IcoCamera c="#fff" n={26} />
                </View>
                <Text style={s.cardTitle}>{t('scan.scanner')}</Text>
                <Text style={s.cardSub}>{t('scan.scannerSub')}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={s.halfCard} onPress={() => setMode('pdf')} activeOpacity={0.82}>
              <LinearGradient colors={[Colors.accentTeal, '#007A72']} style={s.halfGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={s.cardIcon}>
                  <IcoDoc c="#fff" n={26} />
                </View>
                <Text style={s.cardTitle}>{t('scan.statement')}</Text>
                <Text style={s.cardSub}>{t('scan.statementSub')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Manual — wide */}
          <Animated.View style={cardStyle}>
            <TouchableOpacity style={s.wideCard} onPress={() => setMode('manual')} activeOpacity={0.82}>
              <LinearGradient colors={[Colors.surface, Colors.surfaceElevated]} style={s.wideGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <View style={[s.cardIcon, { backgroundColor: Colors.accentTeal + '25' }]}>
                  <IcoEdit c={Colors.accentTeal} n={22} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>{t('scan.manual')}</Text>
                  <Text style={s.cardSub}>{t('scan.manualSub')}</Text>
                </View>
                <IcoRight c={Colors.textMuted} n={18} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* SmartShop — wide */}
          <Animated.View style={cardStyle}>
            <TouchableOpacity
              style={s.wideCard}
              onPress={() => navigation.navigate('More', { screen: 'SmartShop' })}
              activeOpacity={0.82}
            >
              <LinearGradient colors={[Colors.surface, Colors.surfaceElevated]} style={s.wideGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <View style={[s.cardIcon, { backgroundColor: Colors.accentPurple + '25' }]}>
                  <IcoBarcode c={Colors.accentPurple} n={22} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>{t('scan.smart')}</Text>
                  <Text style={s.cardSub}>{t('scan.smartSub')}</Text>
                </View>
                <IcoRight c={Colors.textMuted} n={18} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Stats hint */}
          <Animated.View style={[s.hintCard, cardStyle]}>
            <Text style={s.hintText}>{t('scan.hint')}</Text>
          </Animated.View>

        </ScrollView>
        <CoachMark steps={SCAN_TIPS} visible={tipsVisible} onDone={tipsDone} />
      </SafeAreaView>
    );
  }

  // ── CAMERA ───────────────────────────────────────────────────────────────────
  if (mode === 'camera') {
    const scanY = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0, VF_H - 4] });

    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <CameraView style={StyleSheet.absoluteFill} facing="back" />

        {/* Dark mask: top */}
        <View style={{ height: VF_TOP, backgroundColor: 'rgba(0,0,0,0.62)' }} />

        {/* Middle row */}
        <View style={{ height: VF_H, flexDirection: 'row' }}>
          <View style={{ width: (SW - VF_W) / 2, backgroundColor: 'rgba(0,0,0,0.62)' }} />
          {/* Viewfinder (transparent) */}
          <View style={{ width: VF_W, overflow: 'hidden' }}>
            {/* Corners */}
            <View style={[s.corner, s.cTL]} />
            <View style={[s.corner, s.cTR]} />
            <View style={[s.corner, s.cBL]} />
            <View style={[s.corner, s.cBR]} />
            {/* Scan line */}
            <Animated.View style={[s.scanLineWrap, { transform: [{ translateY: scanY }] }]}>
              <LinearGradient
                colors={['transparent', Colors.accentTeal, 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.scanLineBar}
              />
              <LinearGradient
                colors={[Colors.accentTeal + '44', 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                style={s.scanLineGlow}
              />
            </Animated.View>
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.62)' }} />
        </View>

        {/* Dark mask: bottom */}
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.62)' }}>
          <Text style={s.scanHint}>{t('scan.camera.hint')}</Text>
        </View>

        {/* Controls */}
        <View style={[s.camControls, { paddingBottom: insets.bottom + 24 }]}>
          <TouchableOpacity style={s.camGhost} onPress={() => setMode('hub')}>
            <IcoLeft c="#fff" n={22} />
            <Text style={s.camGhostTxt}>{t('scan.camera.back')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.captureRing} onPress={captureAndParse} activeOpacity={0.8}>
            <LinearGradient colors={[Colors.accentTeal, '#00A89E']} style={s.captureInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <IcoCamera c="#fff" n={24} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={s.camGhost} onPress={pickGallery}>
            <Text style={s.camGhostTxt}>{t('scan.camera.gallery')}</Text>
            <IcoDoc c="#fff" n={18} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── MANUAL FORM ───────────────────────────────────────────────────────────────
  if (mode === 'manual') {
    const isIncome = txType === 'income';
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={s.formPad} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Header */}
            <View style={s.formHeader}>
              <TouchableOpacity style={s.backBtn} onPress={() => setMode('hub')}>
                <IcoLeft c={Colors.accentTeal} n={22} />
              </TouchableOpacity>
              <Text style={s.formTitle}>{t('scan.form.title')}</Text>
              <View style={{ width: 38 }} />
            </View>

            {/* Expense / Income toggle */}
            <View style={s.typeRow}>
              <TouchableOpacity
                style={[s.typeBtn, !isIncome && { borderColor: Colors.danger + '70' }]}
                onPress={() => switchType('expense')}
                activeOpacity={0.8}
              >
                {!isIncome && (
                  <LinearGradient
                    colors={[Colors.danger + '22', Colors.danger + '08']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  />
                )}
                <IcoDown c={!isIncome ? Colors.danger : Colors.textMuted} n={14} />
                <Text style={[s.typeBtnTxt, !isIncome && { color: Colors.danger }]}>{t('scan.form.expense')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.typeBtn, isIncome && { borderColor: Colors.success + '70' }]}
                onPress={() => switchType('income')}
                activeOpacity={0.8}
              >
                {isIncome && (
                  <LinearGradient
                    colors={[Colors.success + '22', Colors.success + '08']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  />
                )}
                <IcoUp c={isIncome ? Colors.success : Colors.textMuted} n={14} />
                <Text style={[s.typeBtnTxt, isIncome && { color: Colors.success }]}>{t('scan.form.income')}</Text>
              </TouchableOpacity>
            </View>

            {/* Amount */}
            <LinearGradient
              colors={isIncome
                ? [Colors.success + '20', Colors.success + '06']
                : [Colors.danger + '1A', Colors.accentTeal + '0A']}
              style={[s.amtCard, {
                borderColor: (isIncome ? Colors.success : Colors.danger) + '55',
                shadowColor: isIncome ? Colors.success : Colors.danger,
                shadowOpacity: 0.4,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 0 },
                elevation: Platform.OS === 'android' ? 0 : 10,
              }]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Text style={[s.amtSign, { color: isIncome ? Colors.success : Colors.danger }]}>
                {isIncome ? '+' : '−'}
              </Text>
              <TextInput
                style={s.amtInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={Colors.textMuted}
                autoFocus
              />
              <Text style={s.amtCur}>{currency}</Text>
            </LinearGradient>

            {/* Category selector */}
            <Text style={s.secLabel}>{t('scan.form.category')}</Text>
            {(() => {
              const sel = cats.find(c => c.key === category) ?? cats[0];
              return (
                <TouchableOpacity
                  style={[s.catSelector, { borderColor: sel.color + '70', backgroundColor: sel.color + '12' }]}
                  onPress={() => setCatSheetOpen(true)}
                  activeOpacity={0.8}
                >
                  <GradientGlyphIcon name={sel.glyph} size={22} />
                  <Text style={[s.catSelectorName, { color: sel.color }]}>{t(sel.tKey)}</Text>
                  <Text style={[s.catSelectorChevron, { color: sel.color }]}>▾</Text>
                </TouchableOpacity>
              );
            })()}

            {/* Category bottom sheet */}
            <Modal visible={catSheetOpen} transparent animationType="slide" onRequestClose={() => setCatSheetOpen(false)}>
              <TouchableOpacity style={s.catOverlay} activeOpacity={1} onPress={() => setCatSheetOpen(false)}>
                <TouchableOpacity activeOpacity={1} style={s.catSheet}>
                  <View style={s.catSheetHandle} />
                  <Text style={s.catSheetTitle}>{t('scan.form.category')}</Text>
                  <FlatList
                    data={cats}
                    numColumns={2}
                    keyExtractor={c => c.key}
                    columnWrapperStyle={s.catGridRow}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 8 }}
                    renderItem={({ item: c }) => {
                      const active = category === c.key;
                      return (
                        <TouchableOpacity
                          style={[s.catGridItem, active && { borderColor: c.color, backgroundColor: c.color + '1E' }]}
                          onPress={() => { setCategory(c.key); Haptics.selectionAsync(); setCatSheetOpen(false); }}
                          activeOpacity={0.75}
                        >
                          <GradientGlyphIcon name={c.glyph} size={26} />
                          <Text style={[s.catGridLabel, active && { color: c.color, fontFamily: Typography.fontSemiBold }]}>{t(c.tKey)}</Text>
                          {active && <View style={[s.catGridDot, { backgroundColor: c.color }]} />}
                        </TouchableOpacity>
                      );
                    }}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>

            {/* Date */}
            {(() => {
              const todayD = new Date();
              const yesterdayD = new Date(); yesterdayD.setDate(yesterdayD.getDate() - 1);
              const isToday = selectedDate.toDateString() === todayD.toDateString();
              const isYday  = selectedDate.toDateString() === yesterdayD.toDateString();
              const shiftDay = (n: number) => {
                const d = new Date(selectedDate); d.setDate(d.getDate() + n);
                if (d <= todayD) setSelectedDate(d);
              };
              const dateLabel = selectedDate.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' });
              return (
                <View style={s.dateBlock}>
                  <View style={s.dateNavRow}>
                    <TouchableOpacity style={s.dateArrow} onPress={() => shiftDay(-1)} activeOpacity={0.7}>
                      <IcoLeft c={Colors.textSecondary} n={18} />
                    </TouchableOpacity>
                    <Text style={s.dateCurrent}>{dateLabel}</Text>
                    <TouchableOpacity style={s.dateArrow} onPress={() => shiftDay(1)} activeOpacity={isToday ? 0.3 : 0.7} disabled={isToday}>
                      <IcoRight c={isToday ? Colors.textMuted + '44' : Colors.textSecondary} n={18} />
                    </TouchableOpacity>
                  </View>
                  <View style={s.dateQuickRow}>
                    <TouchableOpacity
                      style={[s.datePill, isToday && s.datePillOn]}
                      onPress={() => setSelectedDate(new Date())}
                      activeOpacity={0.75}
                    >
                      <Text style={[s.datePillTxt, isToday && s.datePillTxtOn]}>{t('scan.form.today')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.datePill, isYday && s.datePillOn]}
                      onPress={() => setSelectedDate(yesterdayD)}
                      activeOpacity={0.75}
                    >
                      <Text style={[s.datePillTxt, isYday && s.datePillTxtOn]}>{t('scan.form.yesterday')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })()}

            {/* Note toggle */}
            <TouchableOpacity style={s.noteToggle} onPress={() => setShowNote(!showNote)} activeOpacity={0.75}>
              <View style={[s.noteChip, showNote && s.noteChipOn]}>
                <Text style={s.noteChipIcon}>{showNote ? '✕' : '✎'}</Text>
                <Text style={[s.noteToggleTxt, showNote && { color: Colors.accentTeal }]}>
                  {showNote ? t('scan.form.noteHide') : t('scan.form.noteShow')}
                </Text>
              </View>
            </TouchableOpacity>
            {showNote && (
              <View style={[s.inputBox, { marginBottom: Spacing.sm }]}>
                <TextInput
                  style={[s.inputTxt, { minHeight: 60 }]}
                  value={note}
                  onChangeText={setNote}
                  placeholder={t('scan.form.notePh')}
                  placeholderTextColor={Colors.textMuted}
                  multiline
                />
              </View>
            )}

            {/* Save button */}
            <TouchableOpacity
              style={[s.saveBtn, saving && s.dimmed]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={isIncome
                  ? [Colors.success, '#2AB070']
                  : [Colors.accentTeal, Colors.accentPurple]}
                style={s.saveBtnGrad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                {saving
                  ? <ActivityIndicator color={Colors.bg} />
                  : <Text style={s.saveTxt}>{t('scan.form.save')}</Text>
                }
              </LinearGradient>
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── PDF MODE ─────────────────────────────────────────────────────────────────
  if (mode === 'pdf') {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <ScrollView contentContainerStyle={s.formPad} showsVerticalScrollIndicator={false}>

          <View style={s.formHeader}>
            <TouchableOpacity style={s.backBtn} onPress={() => { setPdfName(null); setPdfItems([]); setMode('hub'); }}>
              <IcoLeft c={Colors.accentTeal} n={22} />
            </TouchableOpacity>
            <Text style={s.formTitle}>{t('scan.pdf.title')}</Text>
            <View style={{ width: 38 }} />
          </View>

          {!pdfName ? (
            <>
              <Text style={s.pdfInfo}>{t('scan.pdf.info')}</Text>

              <TouchableOpacity onPress={pickPDF} activeOpacity={0.82}>
                <LinearGradient colors={['#7B6CF6', '#5243D1']} style={s.pdfPickGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <IcoDoc c="#fff" n={36} />
                  <Text style={s.pdfPickTitle}>{t('scan.pdf.pick')}</Text>
                  <Text style={s.pdfPickSub}>{t('scan.pdf.pickSub')}</Text>
                </LinearGradient>
              </TouchableOpacity>

              <Text style={s.pdfBanksTitle}>{t('scan.pdf.banks')}</Text>
              <View style={s.bankRow}>
                {['🏦 Тинькофф', '🏛 Сбербанк', '⚡ Альфа', '🟡 ВТБ', '🔵 Газпром', '🟠 Открытие'].map(b => (
                  <View key={b} style={s.bankChip}><Text style={s.bankChipTxt}>{b}</Text></View>
                ))}
              </View>
            </>
          ) : (
            <>
              {/* File card */}
              <View style={s.pdfFileCard}>
                <View style={[s.cardIcon, { backgroundColor: Colors.accentTeal + '20', width: 40, height: 40, borderRadius: 10 }]}>
                  <IcoDoc c={Colors.accentTeal} n={20} />
                </View>
                <Text style={s.pdfFileName} numberOfLines={1}>{pdfName}</Text>
                {!pdfParsing && pdfItems.length > 0 && (
                  <View style={s.pdfBadge}><IcoCheck c={Colors.success} n={14} /></View>
                )}
              </View>

              {pdfParsing ? (
                <View style={s.parsingBox}>
                  <ActivityIndicator color={Colors.accentTeal} size="large" />
                  <Text style={s.parsingTitle}>{t('scan.pdf.parsing')}</Text>
                  <Text style={s.parsingSub}>{t('scan.pdf.parsingSub')}</Text>
                </View>
              ) : pdfItems.length > 0 ? (
                <>
                  {/* Result header */}
                  <View style={s.pdfResHeader}>
                    <Text style={s.pdfResTitle}>{t('scan.pdf.found', { count: pdfItems.length })}</Text>
                    <TouchableOpacity onPress={() => {
                      if (selected.size === pdfItems.length) setSelected(new Set());
                      else setSelected(new Set(pdfItems.map(i => i.id)));
                    }}>
                      <Text style={s.selectAllTxt}>
                        {selected.size === pdfItems.length ? t('scan.pdf.deselect') : t('scan.pdf.selectAll')}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {pdfItems.map(item => {
                    const on = selected.has(item.id);
                    const cat = ALL_CATS.find(c => c.key === item.cat);
                    const isInc = item.type === 'income';
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[s.pdfItem, on && s.pdfItemOn]}
                        onPress={() => {
                          const nx = new Set(selected);
                          on ? nx.delete(item.id) : nx.add(item.id);
                          setSelected(nx);
                          Haptics.selectionAsync();
                        }}
                        activeOpacity={0.75}
                      >
                        <View style={[s.checkbox, on && s.checkboxOn]}>
                          {on && <IcoCheck c="#fff" n={11} />}
                        </View>
                        <Text style={s.pdfItemEmoji}>{cat?.icon ?? '📦'}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={s.pdfItemLabel}>{item.label}</Text>
                          <Text style={s.pdfItemCat}>{cat ? t(cat.tKey) : t('cat.other')}</Text>
                        </View>
                        <Text style={[s.pdfItemAmt, { color: isInc ? Colors.success : Colors.textPrimary }]}>
                          {isInc ? '+' : '−'}{item.amount.toLocaleString('ru-RU')} ₽
                        </Text>
                      </TouchableOpacity>
                    );
                  })}

                  <TouchableOpacity
                    style={[s.saveBtn, (saving || selected.size === 0) && s.dimmed]}
                    onPress={handleImportPDF}
                    disabled={saving || selected.size === 0}
                    activeOpacity={0.85}
                  >
                    {saving
                      ? <ActivityIndicator color={Colors.bg} />
                      : <Text style={s.saveTxt}>{t('scan.pdf.import', { count: selected.size })}</Text>
                    }
                  </TouchableOpacity>
                </>
              ) : null}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── SUCCESS ───────────────────────────────────────────────────────────────────
  if (mode === 'success') {
    const catInfo = ALL_CATS.find(c => c.key === lastCat);
    const isInc = lastType === 'income';
    return (
      <SafeAreaView style={[s.safe, { justifyContent: 'center' }]} edges={['top', 'bottom']}>
        <View style={s.successWrap}>
          <Animated.View style={{ transform: [{ scale: successAnim }], alignItems: 'center', justifyContent: 'center' }}>
            {/* outer glow ring */}
            <View style={[s.checkGlow, { backgroundColor: (isInc ? Colors.success : Colors.accentTeal) + '12', borderColor: (isInc ? Colors.success : Colors.accentTeal) + '25' }]}>
              <LinearGradient
                colors={isInc ? [Colors.success, '#2AB070'] : [Colors.accentTeal, Colors.accentPurple]}
                style={s.checkCircle}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <IcoCheck c="#fff" n={44} />
              </LinearGradient>
            </View>
          </Animated.View>

          <Animated.View style={{ alignItems: 'center', opacity: successAnim }}>
            <Text style={s.successTitle}>{t('scan.success.title')}</Text>
            <Text style={[s.successAmt, { color: isInc ? Colors.success : Colors.textPrimary }]}>
              {isInc ? '+' : '−'}{formatCurrency(lastAmt, currency)}
            </Text>
            <View style={[s.successBadge, {
              borderColor: (catInfo?.color ?? Colors.textMuted) + '50',
              backgroundColor: (catInfo?.color ?? Colors.textMuted) + '15',
            }]}>
              <Text style={{ fontSize: 16 }}>{catInfo?.icon ?? '📦'}</Text>
              <Text style={[s.successBadgeTxt, { color: catInfo?.color ?? Colors.textSecondary }]}>{catInfo ? t(catInfo.tKey) : t('cat.other')}</Text>
            </View>
          </Animated.View>

          <Animated.View style={[s.successBtns, { opacity: successAnim }]}>
            <TouchableOpacity style={s.successGhost} onPress={() => setMode('manual')} activeOpacity={0.8}>
              <Text style={s.successGhostTxt}>{t('scan.success.more')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.successPrimary} onPress={() => setMode('hub')} activeOpacity={0.85}>
              <Text style={s.successPrimaryTxt}>{t('scan.success.done')}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },

  // Hub
  hubPad: { padding: Spacing.xl, paddingBottom: Layout.tabBarClearance + Spacing.xl },
  hubTitle: { fontSize: 28, fontWeight: Typography.weightBold, color: Colors.textPrimary, marginBottom: 4 },
  hubSub:   { fontSize: Typography.sizeSM, color: Colors.textSecondary, marginBottom: Spacing.xl },

  row2:     { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  halfCard: { flex: 1, borderRadius: Radius.xl, overflow: 'hidden' },
  halfGrad: { padding: Spacing.lg, minHeight: 150, justifyContent: 'flex-end', gap: Spacing.sm },

  cardIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  cardTitle: { fontSize: Typography.sizeMD, fontWeight: Typography.weightBold, color: '#fff' },
  cardSub:   { fontSize: Typography.sizeXS, color: 'rgba(255,255,255,0.72)' },

  wideCard: { marginBottom: Spacing.md, borderRadius: Radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: Glass.border },
  wideGrad: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },

  hintCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Glass.border, marginTop: Spacing.xs },
  hintText: { fontSize: Typography.sizeXS, color: Colors.textMuted, lineHeight: 18 },

  // Camera
  corner: { position: 'absolute', width: 22, height: 22, borderColor: Colors.accentTeal, borderWidth: 3, borderRadius: 2 },
  cTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanLineWrap: { position: 'absolute', left: 0, right: 0 },
  scanLineBar:  { height: 2, width: '100%' },
  scanLineGlow: { height: 20, width: '100%' },
  scanHint: { marginTop: Spacing.xl, textAlign: 'center', color: 'rgba(255,255,255,0.75)', fontSize: Typography.sizeSM },

  camControls: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl,
  },
  camGhost:    { flexDirection: 'row', alignItems: 'center', gap: 6, padding: Spacing.md },
  camGhostTxt: { color: '#fff', fontSize: Typography.sizeSM, fontWeight: Typography.weightSemiBold },
  captureRing: { width: 74, height: 74, borderRadius: 37, borderWidth: 3, borderColor: '#fff', overflow: 'hidden' },
  captureInner:{ flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Form
  formPad:    { padding: Spacing.xl, paddingBottom: Layout.tabBarClearance + Spacing.xl },
  formHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xl },
  backBtn:    { width: 38, height: 38, alignItems: 'flex-start', justifyContent: 'center' },
  formTitle:  { flex: 1, fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: Colors.textPrimary, textAlign: 'center' },

  typeRow:       { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  typeBtn:       {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: Spacing.md, borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Glass.border, backgroundColor: Colors.surface,
  },
  typeBtnTxt:    { fontSize: Typography.sizeSM, fontWeight: Typography.weightSemiBold, color: Colors.textSecondary },

  amtCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl, gap: Spacing.sm,
    borderRadius: Radius.xl, paddingVertical: Spacing.xl, paddingHorizontal: Spacing.lg,
    borderWidth: 1,
  },
  amtSign: { fontSize: 32, fontWeight: Typography.weightBold, marginBottom: 6 },
  amtInput:{ fontSize: 52, fontWeight: Typography.weightBold, color: Colors.textPrimary, minWidth: 80, textAlign: 'center' },
  amtCur:  { fontSize: Typography.sizeSM, color: Colors.textMuted, alignSelf: 'flex-end', marginBottom: 14 },

  secLabel: { fontSize: Typography.sizeSM, fontWeight: Typography.weightSemiBold, color: Colors.textSecondary, marginBottom: Spacing.sm, marginTop: Spacing.md },

  // Category selector pill
  catSelector:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: Spacing.lg, borderRadius: Radius.full, borderWidth: 1.5, marginBottom: Spacing.xl },
  catSelectorEmoji:  { fontSize: 20 },
  catSelectorName:   { flex: 1, fontSize: Typography.sizeMD, fontFamily: Typography.fontSemiBold },
  catSelectorChevron:{ fontSize: 13 },

  // Category bottom sheet
  catOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  catSheet:      { backgroundColor: '#0D0E1C', borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, paddingHorizontal: Spacing.lg, paddingBottom: 36, maxHeight: SH * 0.72 },
  catSheetHandle:{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'center', marginTop: Spacing.md, marginBottom: Spacing.lg },
  catSheetTitle: { fontSize: Typography.sizeLG, fontFamily: Typography.fontBold, color: Colors.textPrimary, marginBottom: Spacing.md },
  catGridRow:    { gap: Spacing.sm, marginBottom: Spacing.sm },
  catGridItem:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Glass.border, backgroundColor: Colors.surface },
  catGridEmoji:  { fontSize: 20 },
  catGridLabel:  { flex: 1, fontSize: Typography.sizeSM, fontFamily: Typography.fontMedium, color: Colors.textSecondary },
  catGridDot:    { width: 7, height: 7, borderRadius: 4 },

  inputBox: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Glass.border,
    paddingHorizontal: Spacing.md, marginBottom: Spacing.xs,
  },
  inputTxt: { color: Colors.textPrimary, fontSize: Typography.sizeMD, paddingVertical: Spacing.md },

  dateBlock:    { marginBottom: Spacing.xl, gap: Spacing.sm },
  dateNavRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Glass.border, overflow: 'hidden' },
  dateArrow:    { paddingHorizontal: Spacing.md, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  dateCurrent:  { flex: 1, textAlign: 'center', fontSize: Typography.sizeSM, fontFamily: Typography.fontSemiBold, color: Colors.textPrimary },
  dateQuickRow: { flexDirection: 'row', gap: Spacing.sm },
  datePill:     { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, backgroundColor: Colors.surface, borderRadius: Radius.full, borderWidth: 1, borderColor: Glass.border },
  datePillOn:   { backgroundColor: Colors.accentTeal + '20', borderColor: Colors.accentTeal },
  datePillTxt:  { fontSize: Typography.sizeSM, color: Colors.textSecondary },
  datePillTxtOn:{ color: Colors.accentTeal, fontFamily: Typography.fontSemiBold },

  noteToggle:    { paddingVertical: Spacing.sm, marginBottom: Spacing.xs, alignSelf: 'flex-start' },
  noteChip:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, borderWidth: 1, borderColor: Glass.border, backgroundColor: Colors.surface },
  noteChipOn:    { borderColor: Colors.accentTeal + '60', backgroundColor: Colors.accentTeal + '10' },
  noteChipIcon:  { fontSize: 13, color: Colors.textMuted },
  noteToggleTxt: { fontSize: Typography.sizeSM, color: Colors.textMuted },

  saveBtn:     { borderRadius: Radius.full, overflow: 'hidden', marginTop: Spacing.xl },
  saveBtnGrad: { paddingVertical: Spacing.lg, alignItems: 'center' },
  saveTxt:     { color: Colors.bg, fontSize: Typography.sizeMD, fontWeight: Typography.weightBold },
  dimmed:   { opacity: 0.45 },

  // PDF
  pdfInfo:      { fontSize: Typography.sizeSM, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.xl },
  pdfPickGrad:  { borderRadius: Radius.xl, padding: Spacing.xxl, alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xl },
  pdfPickTitle: { fontSize: Typography.sizeLG, fontWeight: Typography.weightBold, color: '#fff' },
  pdfPickSub:   { fontSize: Typography.sizeSM, color: 'rgba(255,255,255,0.72)', textAlign: 'center' },
  pdfBanksTitle:{ fontSize: Typography.sizeSM, color: Colors.textMuted, marginBottom: Spacing.sm },
  bankRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  bankChip:     { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, backgroundColor: Colors.surface, borderRadius: Radius.full, borderWidth: 1, borderColor: Glass.border },
  bankChipTxt:  { fontSize: Typography.sizeXS, color: Colors.textSecondary },

  pdfFileCard:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.accentTeal + '44' },
  pdfFileName:  { flex: 1, color: Colors.textPrimary, fontSize: Typography.sizeSM, fontWeight: Typography.weightSemiBold },
  pdfBadge:     { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.success + '25', alignItems: 'center', justifyContent: 'center' },

  parsingBox:   { alignItems: 'center', gap: Spacing.md, paddingVertical: 48 },
  parsingTitle: { fontSize: Typography.sizeMD, fontWeight: Typography.weightSemiBold, color: Colors.textPrimary },
  parsingSub:   { fontSize: Typography.sizeSM, color: Colors.textMuted },

  pdfResHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  pdfResTitle:  { fontSize: Typography.sizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  selectAllTxt: { fontSize: Typography.sizeSM, color: Colors.accentTeal },

  pdfItem:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Glass.border },
  pdfItemOn:    { borderColor: Colors.accentTeal + '60', backgroundColor: Colors.accentTeal + '0C' },
  checkbox:     { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: Glass.border, alignItems: 'center', justifyContent: 'center' },
  checkboxOn:   { backgroundColor: Colors.accentTeal, borderColor: Colors.accentTeal },
  pdfItemEmoji: { fontSize: 20 },
  pdfItemLabel: { fontSize: Typography.sizeSM, fontWeight: Typography.weightSemiBold, color: Colors.textPrimary },
  pdfItemCat:   { fontSize: Typography.sizeXS, color: Colors.textMuted },
  pdfItemAmt:   { fontSize: Typography.sizeSM, fontWeight: Typography.weightBold, color: Colors.textPrimary },

  // Success
  successWrap:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.xl, padding: Spacing.xl },
  checkGlow:        { width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  checkCircle:      { width: 108, height: 108, borderRadius: 54, alignItems: 'center', justifyContent: 'center' },
  successTitle:     { fontSize: 30, fontWeight: Typography.weightBold, color: Colors.textPrimary, marginTop: Spacing.md },
  successAmt:       { fontSize: 40, fontWeight: Typography.weightBold, marginTop: 4 },
  successBadge:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, marginTop: Spacing.md, borderWidth: 1, borderColor: Glass.border },
  successBadgeTxt:  { fontSize: Typography.sizeSM, color: Colors.textSecondary, fontWeight: Typography.weightSemiBold },
  successBtns:      { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl },
  successGhost:     { flex: 1, paddingVertical: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Glass.border, borderRadius: Radius.full },
  successGhostTxt:  { color: Colors.textSecondary, fontSize: Typography.sizeSM, fontWeight: Typography.weightSemiBold },
  successPrimary:   { flex: 1, paddingVertical: Spacing.md, alignItems: 'center', backgroundColor: Colors.accentTeal, borderRadius: Radius.full },
  successPrimaryTxt:{ color: Colors.bg, fontSize: Typography.sizeSM, fontWeight: Typography.weightBold },
});
