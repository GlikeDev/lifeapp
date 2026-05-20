import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  Dimensions, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../constants/tokens';

const { width: SW } = Dimensions.get('window');

export interface TipStep {
  icon: string;
  title: string;
  body: string;
}

interface Props {
  steps: TipStep[];
  onDone: () => void;
  visible: boolean;
}

export function CoachMark({ steps, onDone, visible }: Props) {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(0);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const cardFade  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setCurrent(0);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  function goNext() {
    if (current < steps.length - 1) {
      Animated.timing(cardFade, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
        setCurrent(c => c + 1);
        Animated.timing(cardFade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      });
    } else {
      dismiss();
    }
  }

  function dismiss() {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 400, duration: 250, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(onDone);
  }

  if (!visible) return null;

  const step = steps[current];
  const isLast = current === steps.length - 1;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={dismiss}>
      {/* Dark backdrop */}
      <Animated.View style={[cs.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={dismiss} />
      </Animated.View>

      {/* Card slides up from bottom */}
      <Animated.View
        style={[
          cs.card,
          { paddingBottom: insets.bottom + 16, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Handle */}
        <View style={cs.handle} />

        {/* Step counter */}
        <Text style={cs.counter}>{current + 1} / {steps.length}</Text>

        {/* Content */}
        <Animated.View style={{ opacity: cardFade }}>
          <Text style={cs.icon}>{step.icon}</Text>
          <Text style={cs.title}>{step.title}</Text>
          <Text style={cs.body}>{step.body}</Text>
        </Animated.View>

        {/* Progress dots */}
        <View style={cs.dots}>
          {steps.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => {
              Animated.sequence([
                Animated.timing(cardFade, { toValue: 0, duration: 100, useNativeDriver: true }),
              ]).start(() => {
                setCurrent(i);
                Animated.timing(cardFade, { toValue: 1, duration: 150, useNativeDriver: true }).start();
              });
            }}>
              <View style={[cs.dot, i === current && cs.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Buttons */}
        <View style={cs.actions}>
          <TouchableOpacity style={cs.skipBtn} onPress={dismiss} activeOpacity={0.7}>
            <Text style={cs.skipTxt}>Пропустить</Text>
          </TouchableOpacity>
          <TouchableOpacity style={cs.nextBtn} onPress={goNext} activeOpacity={0.85}>
            <Text style={cs.nextTxt}>{isLast ? 'Понятно! 👍' : 'Далее →'}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const cs = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  card: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surfaceElevated,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 30,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  counter: {
    fontSize: Typography.sizeXS,
    color: Colors.textMuted,
    fontWeight: Typography.weightSemiBold,
    marginBottom: Spacing.md,
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  icon: {
    fontSize: 52,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.sizeLG,
    fontWeight: Typography.weightBold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  body: {
    fontSize: Typography.sizeMD,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.accentTeal,
    width: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  skipBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
  },
  skipTxt: {
    color: Colors.textSecondary,
    fontSize: Typography.sizeSM,
    fontWeight: Typography.weightSemiBold,
  },
  nextBtn: {
    flex: 2,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.accentTeal,
    borderRadius: Radius.full,
  },
  nextTxt: {
    color: Colors.bg,
    fontSize: Typography.sizeSM,
    fontWeight: Typography.weightBold,
  },
});
