// src/components/TweaksPanel.tsx
// React Native port of tweaks-panel.jsx — identical API, native components.
//
// Usage (in any screen or App.tsx):
//
//   const DEFAULTS = { fontSize: 16, density: 'regular', dark: false, primary: '#00D4C8' };
//
//   function MyScreen() {
//     const [t, setTweak] = useTweaks(DEFAULTS);
//     return (
//       <View style={{ flex: 1 }}>
//         {/* screen content */}
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={v => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={v => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primary}
//                        options={['#00D4C8', '#7B6CF6', '#FF6B9D', '#39D98A']}
//                        onChange={v => setTweak('primary', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={v => setTweak('dark', v)} />
//         </TweaksPanel>
//       </View>
//     );
//   }

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Switch, Platform, Modal, Animated, PanResponder,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ── useTweaks ─────────────────────────────────────────────────────────────────

export function useTweaks<T extends Record<string, any>>(defaults: T) {
  const [values, setValues] = useState<T>(defaults);

  const setTweak = useCallback((keyOrEdits: keyof T | Partial<T>, val?: any) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null
      ? (keyOrEdits as Partial<T>)
      : ({ [keyOrEdits]: val } as Partial<T>);
    setValues(prev => ({ ...prev, ...edits }));
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      (window as any).parent?.postMessage({ type: '__edit_mode_set_keys', edits }, '*');
      window.dispatchEvent(new CustomEvent('tweakchange', { detail: edits }));
    }
  }, []);

  return [values, setTweak] as const;
}

// ── TweaksPanel ───────────────────────────────────────────────────────────────

export function TweaksPanel({ title = 'Tweaks', children }: { title?: string; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const pan = useRef(new Animated.ValueXY()).current;
  const panOff = useRef({ x: 0, y: 0 });
  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      pan.setOffset(panOff.current);
      pan.setValue({ x: 0, y: 0 });
    },
    onPanResponderMove: Animated.event(
      [null, { dx: pan.x, dy: pan.y }],
      { useNativeDriver: false },
    ),
    onPanResponderRelease: (_, gs) => {
      panOff.current = { x: panOff.current.x + gs.dx, y: panOff.current.y + gs.dy };
      pan.flattenOffset();
    },
  })).current;

  // Web host protocol
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const h = (e: any) => {
      if (e.data?.type === '__activate_edit_mode') setOpen(true);
      else if (e.data?.type === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', h);
    (window as any).parent?.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', h);
  }, []);

  const dismiss = useCallback(() => {
    setOpen(false);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      (window as any).parent?.postMessage({ type: '__edit_mode_dismissed' }, '*');
    }
  }, []);

  const bottom = insets.bottom + 16;

  return (
    <>
      {/* Floating trigger — wraps with box-none so it never blocks the app */}
      <View style={[s.triggerWrap, { bottom: bottom + 68 }]} pointerEvents="box-none">
        <TouchableOpacity style={s.triggerBtn} onPress={() => setOpen(v => !v)} activeOpacity={0.75}>
          <Text style={s.triggerIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      {open && (
        <Modal transparent statusBarTranslucent animationType="fade" onRequestClose={dismiss}>
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <Animated.View
              style={[
                s.panel,
                { bottom, right: 16 },
                { transform: [{ translateX: pan.x }, { translateY: pan.y }] },
              ]}
            >
              {Platform.OS === 'ios' ? (
                <BlurView intensity={82} tint="light" style={s.surface}>
                  <PanelBody title={title} dismiss={dismiss} panResponder={panResponder}>
                    {children}
                  </PanelBody>
                </BlurView>
              ) : (
                <View style={[s.surface, s.surfaceAndroid]}>
                  <PanelBody title={title} dismiss={dismiss} panResponder={panResponder}>
                    {children}
                  </PanelBody>
                </View>
              )}
            </Animated.View>
          </View>
        </Modal>
      )}
    </>
  );
}

function PanelBody({ title, dismiss, panResponder, children }: {
  title: string; dismiss: () => void; panResponder: any; children?: React.ReactNode;
}) {
  return (
    <>
      <View style={s.hd} {...panResponder.panHandlers}>
        <Text style={s.hdTitle}>{title}</Text>
        <TouchableOpacity onPress={dismiss} hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}>
          <Text style={s.hdX}>✕</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        style={s.body}
        contentContainerStyle={s.bodyPad}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </>
  );
}

// ── Layout helpers ─────────────────────────────────────────────────────────────

export function TweakSection({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <>
      <Text style={s.sectLbl}>{label}</Text>
      {children}
    </>
  );
}

function TweakRow({ label, value, children }: { label: string; value?: string; children: React.ReactNode }) {
  return (
    <View style={s.row}>
      <View style={s.rowHd}>
        <Text style={s.lbl}>{label}</Text>
        {value != null && <Text style={s.val}>{value}</Text>}
      </View>
      {children}
    </View>
  );
}

// ── Controls ──────────────────────────────────────────────────────────────────

export function TweakSlider({
  label, value, min = 0, max = 100, step = 1, unit = '', onChange,
}: { label: string; value: number; min?: number; max?: number; step?: number; unit?: string; onChange: (v: number) => void }) {
  const twRef = useRef(0);
  const [tw, setTw] = useState(0);
  const pct = tw > 0 ? Math.max(0, Math.min(1, (value - min) / (max - min))) : 0;
  const decimals = (String(step).split('.')[1] || '').length;

  const pick = (x: number) => {
    const p = Math.max(0, Math.min(1, x / twRef.current));
    const raw = min + p * (max - min);
    return Number(Math.max(min, Math.min(max, Math.round(raw / step) * step)).toFixed(decimals));
  };

  return (
    <TweakRow label={label} value={`${value}${unit}`}>
      <View
        style={s.sldTrack}
        onLayout={e => { twRef.current = e.nativeEvent.layout.width; setTw(e.nativeEvent.layout.width); }}
        onStartShouldSetResponder={() => true}
        onResponderGrant={e => onChange(pick(e.nativeEvent.locationX))}
        onResponderMove={e => onChange(pick(e.nativeEvent.locationX))}
      >
        <View style={[s.sldFill, { width: pct * tw }]} />
        {tw > 0 && <View style={[s.sldThumb, { left: Math.max(0, pct * tw - 7) }]} />}
      </View>
    </TweakRow>
  );
}

export function TweakToggle({
  label, value, onChange,
}: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={s.inRow}>
      <Text style={s.lbl}>{label}</Text>
      <Switch
        value={!!value}
        onValueChange={onChange}
        trackColor={{ false: 'rgba(0,0,0,.15)', true: '#34c759' }}
        thumbColor="#fff"
        style={{ transform: [{ scaleX: 0.78 }, { scaleY: 0.78 }] }}
      />
    </View>
  );
}

export function TweakRadio({
  label, value, options, onChange,
}: { label: string; value: any; options: any[]; onChange: (v: any) => void }) {
  const opts = options.map(o => typeof o === 'object' ? o : { value: o, label: String(o) });
  const idx = Math.max(0, opts.findIndex(o => o.value === value));
  const n = opts.length;

  // If labels are long, fall back to TweakSelect
  const maxLen = opts.reduce((m, o) => Math.max(m, String(o.label).length), 0);
  const fits = maxLen <= ({ 2: 16, 3: 10 }[n] ?? 0);
  if (!fits) return <TweakSelect label={label} value={value} options={options} onChange={onChange} />;

  return (
    <TweakRow label={label}>
      <View style={s.seg}>
        <View style={[s.segThumb, { left: `${(idx * 100) / n}%` as any, width: `${100 / n}%` as any }]} />
        {opts.map(o => (
          <TouchableOpacity key={String(o.value)} style={s.segBtn} onPress={() => onChange(o.value)} activeOpacity={0.6}>
            <Text style={[s.segTxt, o.value === value && s.segTxtOn]}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </TweakRow>
  );
}

export function TweakSelect({
  label, value, options, onChange,
}: { label: string; value: any; options: any[]; onChange: (v: any) => void }) {
  const opts = options.map(o => typeof o === 'object' ? o : { value: String(o), label: String(o) });
  return (
    <TweakRow label={label}>
      <View style={s.selWrap}>
        {opts.map(o => {
          const on = String(o.value) === String(value);
          return (
            <TouchableOpacity key={String(o.value)} style={[s.selOpt, on && s.selOptOn]} onPress={() => onChange(o.value)} activeOpacity={0.7}>
              <Text style={[s.selTxt, on && s.selTxtOn]}>{o.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </TweakRow>
  );
}

export function TweakText({
  label, value, placeholder, onChange,
}: { label: string; value: string; placeholder?: string; onChange: (v: string) => void }) {
  return (
    <TweakRow label={label}>
      <TextInput
        style={s.field}
        value={String(value ?? '')}
        placeholder={placeholder ?? ''}
        onChangeText={onChange}
        placeholderTextColor="rgba(41,38,27,.35)"
      />
    </TweakRow>
  );
}

export function TweakNumber({
  label, value, min, max, step = 1, unit = '', onChange,
}: { label: string; value: number; min?: number; max?: number; step?: number; unit?: string; onChange: (v: number) => void }) {
  const clamp = (n: number) => {
    let v = n;
    if (min != null && v < min) v = min;
    if (max != null && v > max) v = max;
    return v;
  };
  const decimals = (String(step).split('.')[1] || '').length;

  return (
    <View style={s.numWrap}>
      <Text style={s.numLbl}>{label}</Text>
      <TextInput
        style={s.numInput}
        value={String(value)}
        keyboardType="numeric"
        onChangeText={t => {
          const n = parseFloat(t);
          if (!isNaN(n)) onChange(clamp(Number(n.toFixed(decimals))));
        }}
      />
      {!!unit && <Text style={s.numUnit}>{unit}</Text>}
    </View>
  );
}

function isLight(hex: string): boolean {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, c => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}

export function TweakColor({
  label, value, options, onChange,
}: { label: string; value: any; options?: any[]; onChange: (v: any) => void }) {
  if (!options?.length) {
    const hex = Array.isArray(value) ? value[0] : value;
    return (
      <View style={s.inRow}>
        <Text style={s.lbl}>{label}</Text>
        <View style={[s.swatch, { backgroundColor: hex }]} />
      </View>
    );
  }
  const key = (o: any) => JSON.stringify(o).toLowerCase();
  const cur = key(value);
  return (
    <TweakRow label={label}>
      <View style={s.chips}>
        {options.map((o, i) => {
          const cols: string[] = Array.isArray(o) ? o : [o];
          const [hero, ...rest] = cols;
          const on = key(o) === cur;
          return (
            <TouchableOpacity key={i} style={[s.chip, { backgroundColor: hero }, on && s.chipOn]} onPress={() => onChange(o)} activeOpacity={0.8}>
              {rest.length > 0 && (
                <View style={s.chipStack}>
                  {rest.slice(0, 4).map((c, j) => <View key={j} style={[s.chipStripe, { backgroundColor: c }]} />)}
                </View>
              )}
              {on && <Text style={[s.chipCheck, { color: isLight(hero) ? 'rgba(0,0,0,.78)' : '#fff' }]}>✓</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </TweakRow>
  );
}

export function TweakButton({
  label, onClick, secondary = false,
}: { label: string; onClick: () => void; secondary?: boolean }) {
  return (
    <TouchableOpacity style={[s.btn, secondary && s.btnSec]} onPress={onClick} activeOpacity={0.8}>
      <Text style={[s.btnTxt, secondary && s.btnTxtSec]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const INK = '#29261b';

const s = StyleSheet.create({
  // trigger
  triggerWrap: { position: 'absolute', right: 16, zIndex: 9998 },
  triggerBtn:  {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(250,249,247,.94)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6,
    elevation: 6,
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,.6)',
  },
  triggerIcon: { fontSize: 15 },

  // panel shell
  panel: {
    position: 'absolute', width: 264,
    maxHeight: '72%',
    zIndex: 9999,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.22, shadowRadius: 32,
    elevation: 24,
  },
  surface:        { borderRadius: 14, overflow: 'hidden', flex: 1, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,.55)' },
  surfaceAndroid: { backgroundColor: 'rgba(248,247,244,.97)' },

  // header (drag handle)
  hd:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,.08)' },
  hdTitle: { fontSize: 12, fontWeight: '600', color: INK, letterSpacing: 0.1 },
  hdX:     { fontSize: 13, color: 'rgba(41,38,27,.55)', paddingHorizontal: 2 },

  // body
  body:    { flex: 1 },
  bodyPad: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 14 },

  // rows
  row:   { marginBottom: 10 },
  rowHd: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 },
  inRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  lbl:   { fontSize: 11.5, fontWeight: '500', color: 'rgba(41,38,27,.72)' },
  val:   { fontSize: 11.5, color: 'rgba(41,38,27,.45)' },

  // section label
  sectLbl: { fontSize: 10, fontWeight: '600', letterSpacing: 0.55, color: 'rgba(41,38,27,.42)', textTransform: 'uppercase', marginTop: 8, marginBottom: 4 },

  // slider
  sldTrack:  { height: 18, justifyContent: 'center', position: 'relative' },
  sldFill:   { position: 'absolute', left: 0, height: 4, borderRadius: 999, backgroundColor: 'rgba(0,0,0,.14)' },
  sldThumb:  { position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: '#fff', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,.12)', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3 },

  // segmented
  seg:       { flexDirection: 'row', borderRadius: 8, backgroundColor: 'rgba(0,0,0,.06)', padding: 2, position: 'relative', minHeight: 26 },
  segThumb:  { position: 'absolute', top: 2, bottom: 2, borderRadius: 6, backgroundColor: 'rgba(255,255,255,.9)', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  segBtn:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 3, zIndex: 1 },
  segTxt:    { fontSize: 11.5, fontWeight: '500', color: 'rgba(41,38,27,.52)' },
  segTxtOn:  { color: INK },

  // select (overflow fallback)
  selWrap:   { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  selOpt:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: 'rgba(0,0,0,.05)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,.1)' },
  selOptOn:  { backgroundColor: 'rgba(0,0,0,.78)' },
  selTxt:    { fontSize: 11.5, color: 'rgba(41,38,27,.7)' },
  selTxtOn:  { color: '#fff' },

  // text field
  field: { height: 26, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,.12)', borderRadius: 7, paddingHorizontal: 8, fontSize: 11.5, color: INK, backgroundColor: 'rgba(255,255,255,.65)' },

  // number
  numWrap:  { flexDirection: 'row', alignItems: 'center', height: 26, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,.12)', borderRadius: 7, backgroundColor: 'rgba(255,255,255,.65)', marginBottom: 10 },
  numLbl:   { fontSize: 11.5, fontWeight: '500', color: 'rgba(41,38,27,.6)', paddingLeft: 8, paddingRight: 4 },
  numInput: { flex: 1, fontSize: 11.5, color: INK, textAlign: 'right', paddingRight: 4 },
  numUnit:  { paddingRight: 8, fontSize: 11.5, color: 'rgba(41,38,27,.42)' },

  // color chips
  chips:      { flexDirection: 'row', gap: 6 },
  chip:       { flex: 1, height: 40, borderRadius: 6, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,.12)' },
  chipOn:     { borderWidth: 1.5, borderColor: 'rgba(0,0,0,.85)' },
  chipStack:  { position: 'absolute', top: 0, bottom: 0, right: 0, width: '34%' },
  chipStripe: { flex: 1 },
  chipCheck:  { position: 'absolute', top: 5, left: 5, fontSize: 11, fontWeight: '700' },
  swatch:     { width: 48, height: 22, borderRadius: 5, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,.12)' },

  // button
  btn:       { height: 26, borderRadius: 7, backgroundColor: 'rgba(0,0,0,.78)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, marginBottom: 4 },
  btnSec:    { backgroundColor: 'rgba(0,0,0,.06)' },
  btnTxt:    { fontSize: 11.5, fontWeight: '500', color: '#fff' },
  btnTxtSec: { color: INK },
});
