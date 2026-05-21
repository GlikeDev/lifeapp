import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Animated, ActivityIndicator, Alert, Switch, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius, Layout, Glass } from '../../constants/tokens';
import { useTranslation } from '../../i18n';
import { useAuthStore } from '../../store/useAuthStore';
import { useBudgetStore } from '../../store/useBudgetStore';
import { supabase } from '../../lib/supabase';
import type { Achievement, AchievementTier, MoreStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<MoreStackParamList>;

// ─── XP helpers ───────────────────────────────────────────────────────────────

const XP_TABLE = [0,200,500,900,1400,2000,2700,3500,4400,5400,6500,7700,9000,10500,12000];
const LEVEL_NAMES: Record<number,string> = {
  1:'Новичок',2:'Ученик',3:'Аналитик',4:'Стратег',5:'Инвестор',
  6:'Советник',7:'Эксперт',8:'Гуру',9:'Магистр',10:'Легенда',
};
function xpProg(xp: number, lvl: number) {
  const from = XP_TABLE[lvl-1] ?? 0;
  const to   = XP_TABLE[lvl]   ?? from+300;
  return Math.max(0, Math.min(1, (xp-from)/(to-from)));
}

// ─── Tier colors ──────────────────────────────────────────────────────────────

const TIER_COLOR: Record<AchievementTier,string> = {
  bronze: Colors.tierBronze, silver: Colors.tierSilver,
  gold: Colors.tierGold, platinum: Colors.tierPlatinum, legend: Colors.tierLegend,
};

// ─── XP Arc Ring ──────────────────────────────────────────────────────────────

function ArcRing({ progress, size, color, strokeWidth=6, children }: {
  progress: number; size: number; color: string; strokeWidth?: number; children?: React.ReactNode;
}) {
  const R    = size/2 - strokeWidth;
  const circ = 2 * Math.PI * R;
  const cx   = size/2;
  return (
    <View style={{ width:size, height:size, alignItems:'center', justifyContent:'center' }}>
      <Svg width={size} height={size} style={{ position:'absolute' }}>
        <Circle cx={cx} cy={cx} r={R} stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} fill="none"/>
        <Circle cx={cx} cy={cx} r={R} stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circ} strokeDashoffset={circ*(1-progress)}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cx})`}/>
      </Svg>
      {children}
    </View>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, action, onAction, children }: {
  title: string; action?: string; onAction?: ()=>void; children: React.ReactNode;
}) {
  return (
    <View style={s.section}>
      <View style={s.sectionHead}>
        <Text style={s.sectionTitle}>{title}</Text>
        {action && <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={s.sectionAction}>{action}</Text>
        </TouchableOpacity>}
      </View>
      {children}
    </View>
  );
}

// ─── Setting row ──────────────────────────────────────────────────────────────

function SettingRow({ icon, label, right, onPress, danger=false }: {
  icon: string; label: string; right?: React.ReactNode; onPress?: ()=>void; danger?: boolean;
}) {
  return (
    <TouchableOpacity style={s.settingRow} onPress={onPress} activeOpacity={onPress ? 0.7 : 1} disabled={!onPress && !right}>
      <View style={[s.settingIcon, danger && { backgroundColor: Colors.danger+'18' }]}>
        <Text style={{ fontSize: 15 }}>{icon}</Text>
      </View>
      <Text style={[s.settingLabel, danger && { color: Colors.danger }]}>{label}</Text>
      <View style={s.settingRight}>{right}</View>
    </TouchableOpacity>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function MoreMenuScreen() {
  const nav = useNavigation<Nav>();
  const { user, setUser } = useAuthStore();
  const { transactions, goals } = useBudgetStore();
  const { t, locale } = useTranslation();

  const [achievements, setAchievements]   = useState<Achievement[]>([]);
  const [earnedIds, setEarnedIds]         = useState<Set<string>>(new Set());
  const [achTotal, setAchTotal]           = useState(0);
  const [achLoading, setAchLoading]       = useState(true);
  const [selectedAch, setSelectedAch]     = useState<Achievement|null>(null);
  const [notifOn, setNotifOn]             = useState(true);
  const [streak, setStreak]               = useState<boolean[]>(Array(14).fill(false));

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const level   = user?.level ?? 1;
  const xp      = user?.xp    ?? 0;
  const xpTo    = XP_TABLE[level] ?? XP_TABLE[XP_TABLE.length-1];
  const prog    = xpProg(xp, level);
  const initials= (user?.full_name ?? 'U').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const txCount = transactions.length;
  const savedTotal = goals.reduce((s,g) => s+g.current_amount, 0);
  const currency = user?.currency ?? 'EUR';
  const currSymbol = currency === 'RUB' ? '₽' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '€';
  const joinDate = new Date(user?.created_at ?? '').toLocaleDateString(locale, { month: 'long', year: 'numeric' });

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue:1, duration:380, useNativeDriver:true }).start();
    load();
  }, [user?.id]);

  async function load() {
    if (!user) return;
    setAchLoading(true);
    const [defsRes, earnedRes, txDatesRes, totalRes] = await Promise.all([
      supabase.from('achievement_definitions').select('*').order('xp_reward', { ascending:false }).limit(12),
      supabase.from('user_achievements').select('achievement_id').eq('user_id', user.id),
      supabase.from('transactions').select('date').eq('user_id', user.id)
        .gte('date', new Date(Date.now()-14*86400000).toISOString().slice(0,10)),
      supabase.from('achievement_definitions').select('id', { count:'exact', head:true }),
    ]);
    if (defsRes.data) setAchievements(defsRes.data.map((d:any) => ({
      id: d.id, key: d.key, title: d.title, description: d.description,
      tier: d.tier, category: d.category, xp_reward: d.xp_reward,
    })));
    if (earnedRes.data) setEarnedIds(new Set(earnedRes.data.map((r:any) => r.achievement_id)));
    setAchTotal(totalRes.count ?? 0);
    if (txDatesRes.data) {
      const active = new Set(txDatesRes.data.map((r:any) => r.date as string));
      setStreak(Array.from({length:14}, (_,i) => {
        const d = new Date(Date.now()-(13-i)*86400000);
        return active.has(d.toISOString().slice(0,10));
      }));
    }
    setAchLoading(false);
  }

  function tapAch(ach: Achievement, earned: boolean) {
    setSelectedAch({ ...ach, earned_at: earned ? 'yes' : undefined });
    scaleAnim.setValue(0);
    Animated.spring(scaleAnim, { toValue:1, tension:80, friction:6, useNativeDriver:true }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async function handleSignOut() {
    Alert.alert('Выйти из аккаунта?', 'Все локальные данные будут очищены.', [
      { text:'Отмена', style:'cancel' },
      { text:'Выйти', style:'destructive', onPress: async () => {
        await supabase.auth.signOut();
        setUser(null);
      }},
    ]);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        indicatorStyle="white"
      >
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* ═══ HERO ═══════════════════════════════════════════════ */}
          <LinearGradient
            colors={['#1E1547','#120F36','#0A0B14']}
            start={{x:0,y:0}} end={{x:1,y:1}}
            style={s.hero}
          >
            {/* Blob glow */}
            <View style={s.heroBlobL} pointerEvents="none"/>
            <View style={s.heroBlobR} pointerEvents="none"/>

            <ArcRing progress={prog} size={100} color={Colors.accentPurple} strokeWidth={5}>
              <View style={s.avatar}>
                <Text style={s.avatarInitials}>{initials}</Text>
                {user?.is_pro && (
                  <View style={s.proBadge}><Text style={s.proTxt}>PRO</Text></View>
                )}
              </View>
            </ArcRing>

            <Text style={s.heroName} numberOfLines={1}>{user?.full_name ?? 'Профиль'}</Text>
            <Text style={s.heroSub}>{user?.email ?? ''}</Text>

            {/* Level row */}
            <View style={s.levelRow}>
              <View style={s.levelPill}>
                <Text style={s.levelPillTxt}>Уровень {level}</Text>
              </View>
              <Text style={s.levelName}>{LEVEL_NAMES[level] ?? `Уровень ${level}`}</Text>
            </View>

            {/* XP bar */}
            <View style={s.xpWrap}>
              <View style={s.xpTrack}>
                <View style={[s.xpFill, { width:`${Math.round(prog*100)}%` as any }]}/>
              </View>
              <Text style={s.xpTxt}>{xp} / {xpTo} XP</Text>
            </View>

            <Text style={s.joinDate}>в приложении с {joinDate}</Text>
          </LinearGradient>

          {/* ═══ STATS ══════════════════════════════════════════════ */}
          <View style={s.statsRow}>
            {[
              { val:`${currSymbol}${Math.round(savedTotal).toLocaleString('ru-RU')}`, lbl:'Накоплено', c:Colors.success },
              { val:String(txCount), lbl:'Транзакций', c:Colors.accentTeal },
              { val:String(goals.length), lbl:'Целей', c:Colors.accentPurple },
              { val:String(earnedIds.size), lbl:'Достижений', c:Colors.warning },
            ].map(({ val, lbl, c }) => (
              <View key={lbl} style={s.statCard}>
                <Text style={[s.statVal, { color:c }]}>{val}</Text>
                <Text style={s.statLbl}>{lbl}</Text>
              </View>
            ))}
          </View>

          {/* ═══ АКТИВНОСТЬ ════════════════════════════════════════ */}
          <Section title="АКТИВНОСТЬ">
            <View style={s.streakRow}>
              {streak.map((active, i) => (
                <View key={i} style={[s.streakDot, { backgroundColor: active ? Colors.warning : 'rgba(255,255,255,0.07)' }]}/>
              ))}
            </View>
            <Text style={s.streakSub}>
              {streak.filter(Boolean).length} из 14 дней активен
            </Text>
          </Section>

          {/* ═══ ДОСТИЖЕНИЯ ════════════════════════════════════════ */}
          <Section title="ДОСТИЖЕНИЯ" action={`Все (${achTotal}) →`} onAction={() => nav.navigate('Achievements')}>
            {achLoading ? (
              <ActivityIndicator color={Colors.accentPurple} style={{ marginVertical:Spacing.lg }}/>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal:-Spacing.xl }}>
                <View style={{ flexDirection:'row', gap:10, paddingHorizontal:Spacing.xl, paddingBottom:4 }}>
                  {achievements.map(ach => {
                    const isEarned = earnedIds.has(ach.id);
                    const col = TIER_COLOR[ach.tier];
                    return (
                      <TouchableOpacity
                        key={ach.id}
                        style={[s.achBadge, {
                          backgroundColor: isEarned ? col+'18' : 'rgba(255,255,255,0.04)',
                          borderColor: isEarned ? col+'55' : 'rgba(255,255,255,0.07)',
                        }]}
                        onPress={() => tapAch(ach, isEarned)}
                        activeOpacity={0.75}
                      >
                        <Text style={[s.achStar, { color: isEarned ? col : Colors.textMuted }]}>★</Text>
                        <Text style={[s.achName, !isEarned && { color:Colors.textMuted }]} numberOfLines={1}>
                          {isEarned ? ach.title : '???'}
                        </Text>
                        <Text style={[s.achXp, { color: isEarned ? col : Colors.textMuted }]}>
                          {ach.xp_reward} XP
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            )}
          </Section>

          {/* ═══ ФИНАНСЫ ════════════════════════════════════════════ */}
          <Section title="ФИНАНСЫ">
            <View style={s.finRow}>
              <TouchableOpacity style={s.finCard} onPress={() => nav.navigate('Subscriptions')} activeOpacity={0.82}>
                <LinearGradient colors={['#1A2B3C','#0F1B26']} style={s.finGrad} start={{x:0,y:0}} end={{x:1,y:1}}>
                  <Text style={s.finEmoji}>💳</Text>
                  <Text style={s.finTitle}>Подписки</Text>
                  <Text style={s.finSub}>Контроль трат</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={s.finCard} onPress={() => nav.navigate('Debts')} activeOpacity={0.82}>
                <LinearGradient colors={['#1F2A1A','#141E0F']} style={s.finGrad} start={{x:0,y:0}} end={{x:1,y:1}}>
                  <Text style={s.finEmoji}>🤝</Text>
                  <Text style={s.finTitle}>Долги</Text>
                  <Text style={s.finSub}>Кто кому должен</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Section>

          {/* ═══ НАСТРОЙКИ ══════════════════════════════════════════ */}
          <Section title="НАСТРОЙКИ">
            <View style={s.settingsCard}>
              <SettingRow
                icon="🔔"
                label="Уведомления"
                right={
                  <Switch
                    value={notifOn}
                    onValueChange={setNotifOn}
                    trackColor={{ false:Colors.border, true:Colors.accentTeal+'88' }}
                    thumbColor={notifOn ? Colors.accentTeal : Colors.textMuted}
                  />
                }
              />
              <View style={s.divider}/>
              <SettingRow
                icon="💱"
                label="Валюта"
                right={<Text style={s.settingVal}>{currency}</Text>}
              />
              <View style={s.divider}/>
              <SettingRow
                icon="⭐"
                label="Подписка"
                right={
                  <Text style={[s.settingVal, { color: user?.is_pro ? Colors.accentPurple : Colors.textMuted }]}>
                    {user?.is_pro ? 'PRO' : 'Бесплатно'}
                  </Text>
                }
              />
              <View style={s.divider}/>
              <SettingRow
                icon="📤"
                label="Экспорт данных"
                right={<Text style={s.settingVal}>CSV / PDF</Text>}
              />
            </View>
          </Section>

          {/* ═══ ВЫХОД ══════════════════════════════════════════════ */}
          <TouchableOpacity style={s.signOut} onPress={handleSignOut} activeOpacity={0.8}>
            <Text style={s.signOutTxt}>Выйти из аккаунта</Text>
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>

      {/* ═══ ACH DETAIL MODAL ═══════════════════════════════════════ */}
      {selectedAch && (
        <Modal transparent animationType="fade" onRequestClose={() => setSelectedAch(null)}>
          <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => setSelectedAch(null)}>
            <Animated.View style={[s.achModal, { transform:[{ scale:scaleAnim }] }]}>
              <TouchableOpacity activeOpacity={1}>
                {(() => {
                  const col = TIER_COLOR[selectedAch.tier];
                  const earned = !!selectedAch.earned_at;
                  return (
                    <>
                      <View style={[s.achModalBadge, { backgroundColor:col+'22', borderColor:col+'55' }]}>
                        <Text style={[s.achModalStar, { color:col }]}>★</Text>
                        <Text style={[s.achModalXp, { color:col }]}>{selectedAch.xp_reward} XP</Text>
                      </View>
                      <Text style={s.achModalTitle}>{earned ? selectedAch.title : 'Заблокировано'}</Text>
                      <Text style={s.achModalDesc}>
                        {earned ? selectedAch.description : 'Выполни условие, чтобы разблокировать достижение'}
                      </Text>
                      <TouchableOpacity
                        style={[s.achModalBtn, { backgroundColor: earned ? Colors.accentTeal : Colors.surface }]}
                        onPress={() => setSelectedAch(null)}
                      >
                        <Text style={[s.achModalBtnTxt, { color: earned ? Colors.bg : Colors.textSecondary }]}>
                          {earned ? 'Отлично!' : 'Понятно'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  );
                })()}
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        </Modal>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex:1, backgroundColor:Colors.bg },
  scroll: { paddingBottom: Layout.tabBarClearance + Spacing.xl },

  // Hero
  hero:       { marginHorizontal:Spacing.xl, marginTop:Spacing.md, borderRadius:Radius.xl, padding:Spacing.xl, alignItems:'center', gap:Spacing.sm, overflow:'hidden' },
  heroBlobL:  { position:'absolute', width:160, height:160, borderRadius:80, backgroundColor:'rgba(167,139,250,0.20)', top:-40, left:-40 },
  heroBlobR:  { position:'absolute', width:120, height:120, borderRadius:60, backgroundColor:'rgba(34,211,238,0.12)', bottom:-20, right:-20 },
  avatar:     { width:72, height:72, borderRadius:36, backgroundColor:'rgba(167,139,250,0.22)', alignItems:'center', justifyContent:'center' },
  avatarInitials: { fontSize:Typography.sizeLG, fontWeight:Typography.weightBold, color:Colors.accentPurple },
  proBadge:   { position:'absolute', bottom:-4, right:-4, backgroundColor:Colors.warning, borderRadius:Radius.full, paddingHorizontal:5, paddingVertical:1 },
  proTxt:     { fontSize:8, fontWeight:Typography.weightBold, color:Colors.bg },
  heroName:   { fontSize:Typography.sizeLG, fontWeight:Typography.weightBold, color:Colors.textPrimary, marginTop:4 },
  heroSub:    { fontSize:Typography.sizeXS, color:Colors.textMuted },
  levelRow:   { flexDirection:'row', alignItems:'center', gap:Spacing.sm, marginTop:4 },
  levelPill:  { backgroundColor:Colors.accentPurple+'30', borderRadius:Radius.full, paddingHorizontal:Spacing.md, paddingVertical:3 },
  levelPillTxt:{ fontSize:Typography.sizeXS, fontWeight:Typography.weightBold, color:Colors.accentPurple },
  levelName:  { fontSize:Typography.sizeXS, color:Colors.textSecondary },
  xpWrap:     { width:'100%', gap:4, marginTop:4 },
  xpTrack:    { height:5, backgroundColor:'rgba(255,255,255,0.10)', borderRadius:Radius.full, overflow:'hidden' },
  xpFill:     { height:'100%', backgroundColor:Colors.accentPurple, borderRadius:Radius.full },
  xpTxt:      { fontSize:Typography.sizeXS, color:Colors.textMuted, textAlign:'right' },
  joinDate:   { fontSize:Typography.sizeXS, color:Colors.textMuted, marginTop:2 },

  // Stats
  statsRow:   { flexDirection:'row', gap:Spacing.sm, paddingHorizontal:Spacing.xl, marginTop:Spacing.lg },
  statCard:   { flex:1, backgroundColor:'rgba(255,255,255,0.04)', borderRadius:Radius.md, padding:Spacing.md, alignItems:'center', gap:2, borderWidth:1, borderColor:'rgba(255,255,255,0.06)' },
  statVal:    { fontSize:Typography.sizeMD, fontWeight:Typography.weightBold },
  statLbl:    { fontSize:8, color:Colors.textMuted, fontWeight:Typography.weightMedium, textAlign:'center' },

  // Section
  section:    { paddingHorizontal:Spacing.xl, marginTop:Spacing.xl },
  sectionHead:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:Spacing.md },
  sectionTitle:{ fontSize:Typography.sizeXS, fontWeight:Typography.weightSemiBold, color:Colors.textMuted, letterSpacing:1.2 },
  sectionAction:{ fontSize:Typography.sizeXS, color:Colors.accentTeal, fontWeight:Typography.weightSemiBold },

  // Streak
  streakRow:  { flexDirection:'row', gap:5, flexWrap:'wrap' },
  streakDot:  { width:16, height:16, borderRadius:4 },
  streakSub:  { fontSize:Typography.sizeXS, color:Colors.textMuted, marginTop:Spacing.xs },

  // Achievements
  achBadge:   { width:80, alignItems:'center', borderRadius:Radius.md, borderWidth:1, paddingVertical:Spacing.sm, paddingHorizontal:Spacing.xs, gap:3 },
  achStar:    { fontSize:22 },
  achName:    { fontSize:9, color:Colors.textPrimary, fontWeight:Typography.weightSemiBold, textAlign:'center' },
  achXp:      { fontSize:9, fontWeight:Typography.weightBold },

  // Finance
  finRow:     { flexDirection:'row', gap:Spacing.md },
  finCard:    { flex:1, borderRadius:Radius.xl, overflow:'hidden' },
  finGrad:    { padding:Spacing.lg, gap:4, minHeight:110 },
  finEmoji:   { fontSize:26, marginBottom:2 },
  finTitle:   { fontSize:Typography.sizeMD, fontWeight:Typography.weightBold, color:Colors.textPrimary },
  finSub:     { fontSize:Typography.sizeXS, color:Colors.textSecondary },

  // Settings
  settingsCard:{ backgroundColor:'rgba(255,255,255,0.04)', borderRadius:Radius.xl, borderWidth:1, borderColor:'rgba(255,255,255,0.06)', overflow:'hidden' },
  settingRow: { flexDirection:'row', alignItems:'center', paddingHorizontal:Spacing.lg, paddingVertical:Spacing.md, gap:Spacing.md },
  settingIcon:{ width:32, height:32, borderRadius:Radius.sm, backgroundColor:'rgba(255,255,255,0.06)', alignItems:'center', justifyContent:'center' },
  settingLabel:{ flex:1, fontSize:Typography.sizeMD, color:Colors.textPrimary, fontWeight:Typography.weightMedium },
  settingRight:{ flexDirection:'row', alignItems:'center' },
  settingVal: { fontSize:Typography.sizeSM, color:Colors.textSecondary },
  divider:    { height:1, backgroundColor:'rgba(255,255,255,0.05)', marginLeft:Spacing.lg+32+Spacing.md },

  // Sign out
  signOut:    { marginHorizontal:Spacing.xl, marginTop:Spacing.xl, backgroundColor:Colors.danger+'18', borderRadius:Radius.full, paddingVertical:Spacing.md, alignItems:'center', borderWidth:1, borderColor:Colors.danger+'40' },
  signOutTxt: { color:Colors.danger, fontWeight:Typography.weightSemiBold, fontSize:Typography.sizeMD },

  // Ach modal
  backdrop:      { flex:1, backgroundColor:'rgba(0,0,0,0.75)', alignItems:'center', justifyContent:'center', padding:Spacing.xl },
  achModal:      { backgroundColor:'#141527', borderRadius:Radius.xl, padding:Spacing.xl, width:'100%', alignItems:'center', borderWidth:1, borderColor:Glass.border },
  achModalBadge: { width:88, height:88, borderRadius:22, alignItems:'center', justifyContent:'center', borderWidth:2, marginBottom:Spacing.lg },
  achModalStar:  { fontSize:36 },
  achModalXp:    { fontSize:Typography.sizeXS, fontWeight:Typography.weightBold, marginTop:2 },
  achModalTitle: { fontSize:Typography.sizeLG, fontWeight:Typography.weightBold, color:Colors.textPrimary, textAlign:'center', marginBottom:Spacing.xs },
  achModalDesc:  { fontSize:Typography.sizeSM, color:Colors.textSecondary, textAlign:'center', lineHeight:20, marginBottom:Spacing.lg },
  achModalBtn:   { width:'100%', borderRadius:Radius.full, paddingVertical:Spacing.md, alignItems:'center' },
  achModalBtnTxt:{ fontSize:Typography.sizeMD, fontWeight:Typography.weightBold },
});
