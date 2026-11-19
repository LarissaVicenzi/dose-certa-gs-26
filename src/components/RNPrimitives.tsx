/**
 * Primitivas compativeis com React Native para o preview web (Fase 1).
 * Inclui Animated, Appearance, useColorScheme e AccessibilityInfo.
 * Na Fase 2 (Expo Snack), estes imports serao trocados diretamente por 'react-native'.
 */
import React, { useEffect, useState } from 'react';

export type RNStyle =
  | Record<string, unknown>
  | false
  | null
  | undefined
  | RNStyle[];

export type ColorSchemeName = 'light' | 'dark';

const FONTE_SISTEMA =
  "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

let reduzirMovimentoUsuario = false;

export function definirReduzirMovimentoGlobal(ativo: boolean): void {
  reduzirMovimentoUsuario = ativo;
}

function prefereMovimentoReduzidoSistema(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function obterEsquemaCorSistema(): ColorSchemeName {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export const Appearance = {
  getColorScheme(): ColorSchemeName {
    return obterEsquemaCorSistema();
  },
  addChangeListener(listener: (prefs: { colorScheme: ColorSchemeName }) => void) {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return { remove: () => {} };
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      listener({ colorScheme: e.matches ? 'dark' : 'light' });
    };
    mq.addEventListener?.('change', handler);
    return {
      remove: () => mq.removeEventListener?.('change', handler),
    };
  },
};

export function useColorScheme(): ColorSchemeName {
  const [esquema, setEsquema] = useState<ColorSchemeName>(() =>
    obterEsquemaCorSistema()
  );

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setEsquema(colorScheme);
    });
    return () => sub.remove();
  }, []);

  return esquema;
}

export const AccessibilityInfo = {
  async isReduceMotionEnabled(): Promise<boolean> {
    return prefereMovimentoReduzidoSistema();
  },
  addEventListener(
    eventName: 'reduceMotionChanged',
    listener: (enabled: boolean) => void
  ) {
    if (
      eventName !== 'reduceMotionChanged' ||
      typeof window === 'undefined' ||
      !window.matchMedia
    ) {
      return { remove: () => {} };
    }
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => listener(e.matches);
    mq.addEventListener?.('change', handler);
    return {
      remove: () => mq.removeEventListener?.('change', handler),
    };
  },
};

class AnimatedValue {
  private _value: number;
  private _listeners = new Set<(val: number) => void>();

  constructor(initialValue: number) {
    this._value = initialValue;
  }

  getValue(): number {
    return this._value;
  }

  setValue(next: number): void {
    this._value = next;
    this._listeners.forEach((cb) => cb(next));
  }

  addListener(cb: (val: number) => void): () => void {
    this._listeners.add(cb);
    return () => {
      this._listeners.delete(cb);
    };
  }
}

interface CompositeAnimation {
  start: (callback?: (result: { finished: boolean }) => void) => void;
  stop: () => void;
}

function timing(
  value: AnimatedValue,
  config: { toValue: number; duration?: number; useNativeDriver?: boolean }
): CompositeAnimation {
  let frameId: number | null = null;
  let stopped = false;

  return {
    start(callback) {
      stopped = false;
      const from = value.getValue();
      const to = config.toValue;
      const semAnimacao =
        reduzirMovimentoUsuario || prefereMovimentoReduzidoSistema();
      const duration = semAnimacao ? 0 : (config.duration ?? 200);

      if (duration <= 0 || from === to) {
        value.setValue(to);
        callback?.({ finished: true });
        return;
      }

      const startTime = performance.now();

      function tick(now: number) {
        if (stopped) return;
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        value.setValue(from + (to - from) * eased);

        if (progress < 1) {
          frameId = requestAnimationFrame(tick);
        } else {
          value.setValue(to);
          callback?.({ finished: true });
        }
      }

      frameId = requestAnimationFrame(tick);
    },
    stop() {
      stopped = true;
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
    },
  };
}

function sequence(animations: CompositeAnimation[]): CompositeAnimation {
  let currentIndex = 0;
  let stopped = false;

  return {
    start(callback) {
      stopped = false;
      currentIndex = 0;

      function runNext() {
        if (stopped) return;
        if (currentIndex >= animations.length) {
          callback?.({ finished: true });
          return;
        }
        const current = animations[currentIndex];
        currentIndex += 1;
        current.start(({ finished }) => {
          if (finished && !stopped) {
            runNext();
          }
        });
      }

      runNext();
    },
    stop() {
      stopped = true;
      animations.forEach((a) => a.stop());
    },
  };
}

function parallel(animations: CompositeAnimation[]): CompositeAnimation {
  return {
    start(callback) {
      let remaining = animations.length;
      if (remaining === 0) {
        callback?.({ finished: true });
        return;
      }
      animations.forEach((a) => {
        a.start(() => {
          remaining -= 1;
          if (remaining === 0) {
            callback?.({ finished: true });
          }
        });
      });
    },
    stop() {
      animations.forEach((a) => a.stop());
    },
  };
}

function extrairAnimatedValues(style?: RNStyle): AnimatedValue[] {
  const encontrados: AnimatedValue[] = [];
  if (!style) return encontrados;
  if (Array.isArray(style)) {
    style.forEach((s) => encontrados.push(...extrairAnimatedValues(s)));
    return encontrados;
  }
  for (const val of Object.values(style)) {
    if (val instanceof AnimatedValue) {
      encontrados.push(val);
    } else if (Array.isArray(val)) {
      val.forEach((item) => {
        if (item && typeof item === 'object') {
          Object.values(item as Record<string, unknown>).forEach((v) => {
            if (v instanceof AnimatedValue) encontrados.push(v);
          });
        }
      });
    }
  }
  return encontrados;
}

function converterTransformRN(
  transforms: Array<Record<string, unknown>>
): string {
  return transforms
    .map((item) => {
      const [key, rawVal] = Object.entries(item)[0] || [];
      if (!key) return '';
      const num =
        rawVal instanceof AnimatedValue ? rawVal.getValue() : Number(rawVal);
      if (key === 'scale') return `scale(${num})`;
      if (key === 'translateY') return `translateY(${num}px)`;
      if (key === 'translateX') return `translateX(${num}px)`;
      return '';
    })
    .filter(Boolean)
    .join(' ');
}

function converterEstiloRN(style?: RNStyle): React.CSSProperties {
  if (!style) return {};
  if (Array.isArray(style)) {
    return style.reduce<React.CSSProperties>(
      (acc, item) => ({ ...acc, ...converterEstiloRN(item) }),
      {}
    );
  }

  const out: React.CSSProperties = {};
  const raw = style as Record<string, unknown>;

  for (const [key, rawValue] of Object.entries(raw)) {
    if (rawValue === undefined || rawValue === null) continue;

    const value =
      rawValue instanceof AnimatedValue ? rawValue.getValue() : rawValue;

    if (key === 'paddingHorizontal') {
      out.paddingLeft = value as number | string;
      out.paddingRight = value as number | string;
    } else if (key === 'paddingVertical') {
      out.paddingTop = value as number | string;
      out.paddingBottom = value as number | string;
    } else if (key === 'marginHorizontal') {
      out.marginLeft = value as number | string;
      out.marginRight = value as number | string;
    } else if (key === 'marginVertical') {
      out.marginTop = value as number | string;
      out.marginBottom = value as number | string;
    } else if (key === 'borderWidth') {
      out.borderWidth = value as number;
      if (!raw.borderStyle) out.borderStyle = 'solid';
    } else if (key === 'borderTopWidth') {
      out.borderTopWidth = value as number;
      out.borderTopStyle = 'solid';
    } else if (key === 'borderBottomWidth') {
      out.borderBottomWidth = value as number;
      out.borderBottomStyle = 'solid';
    } else if (key === 'borderLeftWidth') {
      out.borderLeftWidth = value as number;
      out.borderLeftStyle = 'solid';
    } else if (key === 'borderRightWidth') {
      out.borderRightWidth = value as number;
      out.borderRightStyle = 'solid';
    } else if (key === 'transform' && Array.isArray(value)) {
      out.transform = converterTransformRN(
        value as Array<Record<string, unknown>>
      );
    } else if (
      key === 'shadowOpacity' ||
      key === 'shadowRadius' ||
      key === 'shadowOffset' ||
      key === 'shadowColor' ||
      key === 'elevation'
    ) {
      if (typeof raw.elevation === 'number' && raw.elevation > 0) {
        const op =
          typeof raw.shadowOpacity === 'number' ? raw.shadowOpacity : 0.07;
        const blur =
          typeof raw.shadowRadius === 'number'
            ? raw.shadowRadius
            : raw.elevation * 4;
        out.boxShadow = `0px ${Math.min(raw.elevation * 2, 8)}px ${blur}px rgba(18, 28, 22, ${op})`;
      }
    } else if (key === 'lineHeight' && typeof value === 'number') {
      out.lineHeight = `${value}px`;
    } else {
      (out as Record<string, unknown>)[key] = value;
    }
  }

  if (raw.flex === 1 && raw.minHeight === undefined) {
    out.minHeight = 0;
  }

  return out;
}

export const StyleSheet = {
  create<T extends Record<string, Record<string, unknown>>>(styles: T): T {
    return styles;
  },
};

export interface AccessibilityProps {
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?:
    | 'button'
    | 'header'
    | 'text'
    | 'tab'
    | 'tablist'
    | 'alert'
    | 'image'
    | 'switch'
    | 'progressbar'
    | 'radio'
    | 'none';
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean;
  };
}

export interface ViewProps extends AccessibilityProps {
  style?: RNStyle;
  children?: React.ReactNode;
}

export function View({
  style,
  children,
  accessibilityLabel,
  accessibilityRole,
  accessibilityState,
}: ViewProps) {
  const baseStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    position: 'relative',
  };

  return (
    <div
      style={{ ...baseStyle, ...converterEstiloRN(style) }}
      aria-label={accessibilityLabel}
      role={accessibilityRole === 'header' ? 'banner' : accessibilityRole}
      aria-disabled={accessibilityState?.disabled}
      aria-selected={accessibilityState?.selected}
      aria-checked={accessibilityState?.checked}
    >
      {children}
    </div>
  );
}

function AnimatedView({
  style,
  children,
  accessibilityLabel,
  accessibilityRole,
  accessibilityState,
}: ViewProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const animValues = extrairAnimatedValues(style);
    if (animValues.length === 0) return;
    const unsubs = animValues.map((av) =>
      av.addListener(() => setTick((t) => t + 1))
    );
    return () => {
      unsubs.forEach((u) => u());
    };
  }, [style]);

  return (
    <View
      style={style}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
    >
      {children}
    </View>
  );
}

export const Animated = {
  Value: AnimatedValue,
  timing,
  sequence,
  parallel,
  View: AnimatedView,
};

export interface TextProps extends AccessibilityProps {
  style?: RNStyle;
  children?: React.ReactNode;
  numberOfLines?: number;
  allowFontScaling?: boolean;
}

export function Text({
  style,
  children,
  numberOfLines,
  accessibilityLabel,
  accessibilityRole,
}: TextProps) {
  const baseStyle: React.CSSProperties = {
    display: 'block',
    margin: 0,
    padding: 0,
    boxSizing: 'border-box',
    fontFamily: FONTE_SISTEMA,
    fontVariantNumeric: 'tabular-nums',
    overflowWrap: 'break-word',
  };

  const clampStyle: React.CSSProperties = numberOfLines
    ? {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: numberOfLines,
        WebkitBoxOrient: 'vertical',
      }
    : {};

  return (
    <span
      style={{ ...baseStyle, ...clampStyle, ...converterEstiloRN(style) }}
      aria-label={accessibilityLabel}
      role={accessibilityRole === 'header' ? 'heading' : accessibilityRole}
    >
      {children}
    </span>
  );
}

export interface PressableProps extends AccessibilityProps {
  style?: RNStyle | ((state: { pressed: boolean }) => RNStyle);
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
}

export function Pressable({
  style,
  onPress,
  onPressIn,
  onPressOut,
  disabled,
  children,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  accessibilityState,
}: PressableProps) {
  const [pressed, setPressed] = useState(false);

  const resolvedStyle =
    typeof style === 'function' ? style({ pressed }) : style;

  const baseStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    cursor: disabled ? 'not-allowed' : 'pointer',
    userSelect: 'none',
    opacity: disabled ? 0.55 : 1,
    outlineOffset: '3px',
  };

  return (
    <div
      role={accessibilityRole}
      tabIndex={disabled ? -1 : 0}
      aria-label={accessibilityLabel}
      aria-description={accessibilityHint}
      aria-disabled={disabled || accessibilityState?.disabled}
      aria-selected={accessibilityState?.selected}
      aria-checked={accessibilityState?.checked}
      style={{ ...baseStyle, ...converterEstiloRN(resolvedStyle) }}
      onMouseDown={() => {
        if (disabled) return;
        setPressed(true);
        onPressIn?.();
      }}
      onMouseUp={() => {
        if (pressed) {
          setPressed(false);
          onPressOut?.();
        }
      }}
      onMouseLeave={() => {
        if (pressed) {
          setPressed(false);
          onPressOut?.();
        }
      }}
      onClick={() => {
        if (!disabled && onPress) onPress();
      }}
      onKeyDown={(e) => {
        if (!disabled && onPress && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onPress();
        }
      }}
    >
      {children}
    </div>
  );
}

export interface ScrollViewProps extends AccessibilityProps {
  style?: RNStyle;
  contentContainerStyle?: RNStyle;
  children?: React.ReactNode;
}

export function ScrollView({
  style,
  contentContainerStyle,
  children,
  accessibilityLabel,
}: ScrollViewProps) {
  const outerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch',
    boxSizing: 'border-box',
  };

  const innerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
  };

  return (
    <div
      style={{ ...outerStyle, ...converterEstiloRN(style) }}
      aria-label={accessibilityLabel}
    >
      <div style={{ ...innerStyle, ...converterEstiloRN(contentContainerStyle) }}>
        {children}
      </div>
    </div>
  );
}

export interface FlatListProps<T> {
  data: T[];
  renderItem: (info: { item: T; index: number }) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  style?: RNStyle;
  contentContainerStyle?: RNStyle;
  ListHeaderComponent?: React.ReactNode;
  ListFooterComponent?: React.ReactNode;
  ListEmptyComponent?: React.ReactNode;
  accessibilityLabel?: string;
}

export function FlatList<T>({
  data,
  renderItem,
  keyExtractor,
  style,
  contentContainerStyle,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  accessibilityLabel,
}: FlatListProps<T>) {
  return (
    <ScrollView
      style={style}
      contentContainerStyle={contentContainerStyle}
      accessibilityLabel={accessibilityLabel}
    >
      {ListHeaderComponent}
      {data.length === 0
        ? ListEmptyComponent
        : data.map((item, index) => (
            <React.Fragment key={keyExtractor(item, index)}>
              {renderItem({ item, index })}
            </React.Fragment>
          ))}
      {ListFooterComponent}
    </ScrollView>
  );
}

export interface ImageProps extends AccessibilityProps {
  source: { uri: string };
  style?: RNStyle;
  resizeMode?: 'cover' | 'contain' | 'stretch';
}

export function Image({
  source,
  style,
  resizeMode = 'contain',
  accessibilityLabel,
}: ImageProps) {
  const baseStyle: React.CSSProperties = {
    display: 'block',
    objectFit: resizeMode === 'stretch' ? 'fill' : resizeMode,
    boxSizing: 'border-box',
  };

  return (
    <img
      src={source.uri}
      alt={accessibilityLabel || ''}
      referrerPolicy="no-referrer"
      style={{ ...baseStyle, ...converterEstiloRN(style) }}
    />
  );
}

export interface TextInputProps extends AccessibilityProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  placeholderTextColor?: string;
  style?: RNStyle;
  maxLength?: number;
}

export function TextInput({
  value,
  onChangeText,
  placeholder,
  style,
  accessibilityLabel,
  accessibilityHint,
  maxLength,
}: TextInputProps) {
  const baseStyle: React.CSSProperties = {
    boxSizing: 'border-box',
    width: '100%',
    fontFamily: FONTE_SISTEMA,
    outlineOffset: '3px',
  };

  return (
    <input
      type="text"
      value={value}
      maxLength={maxLength}
      placeholder={placeholder}
      aria-label={accessibilityLabel}
      aria-description={accessibilityHint}
      onChange={(e) => onChangeText(e.target.value)}
      style={{ ...baseStyle, ...converterEstiloRN(style) }}
    />
  );
}
