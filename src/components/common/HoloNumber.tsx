import React, { useRef } from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { Colors } from '../../constants/tokens';

let _holoId = 0;

interface HoloNumberProps {
  value: number | string;
  fontSize?: number;
  strokeWidth?: number;
}

const paintOrderProp = { paintOrder: 'stroke' } as any;

export function HoloNumber({ value, fontSize = 56, strokeWidth = 5 }: HoloNumberProps) {
  const id = useRef(`holo_${++_holoId}`).current;
  const text = String(value);
  const w = text.length * fontSize * 0.62 + strokeWidth * 2;
  const h = fontSize + strokeWidth * 2;

  return (
    <View style={{ width: w, height: h }}>
      <Svg width={w} height={h}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor={Colors.cyan}/>
            <Stop offset="50%" stopColor={Colors.purple}/>
            <Stop offset="100%" stopColor={Colors.coral}/>
          </LinearGradient>
        </Defs>
        <SvgText
          x={w / 2} y={h - strokeWidth}
          textAnchor="middle"
          fontSize={fontSize}
          fontWeight="800"
          fill="#FFFFFF"
          stroke={`url(#${id})`}
          strokeWidth={strokeWidth}
          {...paintOrderProp}
          letterSpacing="-2"
        >
          {text}
        </SvgText>
      </Svg>
    </View>
  );
}
