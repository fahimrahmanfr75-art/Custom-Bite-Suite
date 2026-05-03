import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { StyleProp, TextInputProps, ViewStyle } from 'react-native';
import type { OrderStatus } from '../types';

function LayeredSurface({
  topStyle,
  bottomStyle,
  baseStyle,
  children,
}: {
  topStyle?: StyleProp<ViewStyle>;
  bottomStyle?: StyleProp<ViewStyle>;
  baseStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.layerHost}>
      <View style={[styles.baseLayer, baseStyle]} />
      <View style={[styles.bottomLayer, bottomStyle]}>
      </View>
      <View style={[styles.topLayer, topStyle]}>{children}</View>
    </View>
  );
}

export function ScreenCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <LayeredSurface
      topStyle={[styles.cardTop, style]}
      bottomStyle={styles.cardBottom}
      baseStyle={styles.cardBase}
    >
      {children}
    </LayeredSurface>
  );
}

export function Card3D({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <LayeredSurface
      topStyle={[styles.nestedCardTop, style]}
      bottomStyle={styles.nestedCardBottom}
      baseStyle={styles.nestedCardBase}
    >
      {children}
    </LayeredSurface>
  );
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionCopy}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function Pill({
  label,
  active = false,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.buttonHost}>
      {({ pressed }) => (
        <>
          <View style={[styles.baseLayer, styles.pillBase]} />
          <View style={[styles.bottomLayer, styles.pillBottom]} />
          <View
            style={[
              styles.topLayer,
              styles.pillTop,
              active ? styles.pillTopActive : undefined,
              pressed ? styles.pressedTop : undefined,
            ]}
          >
            <View style={styles.shine} />
            <Text style={[styles.pillText, active ? styles.pillTextActive : undefined]}>{label}</Text>
          </View>
        </>
      )}
    </Pressable>
  );
}

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  icon,
  iconSize = 20,
}: {
  label?: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
}) {
  const hasIcon = !!icon;
  const hasLabel = !!label;
  const showBoth = hasIcon && hasLabel;

  return (
    <Pressable onPress={onPress} disabled={disabled} style={styles.buttonHost}>
      {({ pressed }) => (
        <>
          <View style={[styles.baseLayer, styles.buttonBase]} />
          <View style={[styles.bottomLayer, styles.buttonBottom]} />
          <View
            style={[
              styles.topLayer,
              styles.buttonTop,
              variant === 'primary' && styles.primaryButton,
              variant === 'secondary' && styles.secondaryButton,
              variant === 'ghost' && styles.ghostButton,
              variant === 'danger' && styles.dangerButton,
              pressed && styles.pressedTop,
              disabled && styles.disabledButton,
            ]}
          >
            <View style={styles.shine} />
            {showBoth ? (
              <View style={styles.iconLabelRow}>
                <Ionicons
                  name={icon}
                  size={iconSize}
                  color={variant === 'ghost' ? '#0F2529' : '#FFFFFF'}
                />
                <Text
                  style={[
                    styles.buttonText,
                    styles.buttonTextWithIcon,
                    variant === 'secondary' && styles.secondaryButtonText,
                    variant === 'ghost' && styles.ghostButtonText,
                  ]}
                >
                  {label}
                </Text>
              </View>
            ) : icon ? (
              <Ionicons
                name={icon}
                size={iconSize}
                color={variant === 'ghost' ? '#0F2529' : '#FFFFFF'}
              />
            ) : (
              <Text
                style={[
                  styles.buttonText,
                  variant === 'secondary' && styles.secondaryButtonText,
                  variant === 'ghost' && styles.ghostButtonText,
                ]}
              >
                {label}
              </Text>
            )}
          </View>
        </>
      )}
    </Pressable>
  );
}

export type FloatingActionMenuItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active?: boolean;
  onPress: () => void;
};

export function FloatingActionMenu({
  items,
  activeLabel,
  accentColor = '#174C4F',
  activeTint = '#F6F3EB',
  inactiveTint = '#174C4F',
  containerStyle,
}: {
  items: FloatingActionMenuItem[];
  activeLabel: string;
  accentColor?: string;
  activeTint?: string;
  inactiveTint?: string;
  containerStyle?: StyleProp<ViewStyle>;
}) {
  const [expanded, setExpanded] = useState(false);
  const activeItem = useMemo(
    () => items.find((item) => item.active) ?? items[0],
    [items]
  );

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {expanded ? (
        <Pressable style={styles.fabScrim} onPress={() => setExpanded(false)} />
      ) : null}

      <View pointerEvents="box-none" style={[styles.fabDock, containerStyle]}>
        {expanded ? (
          <View style={styles.fabMenuList}>
            {items.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => {
                  item.onPress();
                  setExpanded(false);
                }}
                style={({ pressed }) => [
                  styles.fabMenuItem,
                  {
                    backgroundColor: item.active ? accentColor : '#E2E9FF',
                    borderColor: item.active ? accentColor : '#E2E9FF',
                  },
                  pressed ? styles.fabMenuItemPressed : undefined,
                ]}
              >
                <View style={styles.fabMenuLeading}>
                  <View
                    style={[
                      styles.fabMenuIconWrap,
                      {
                        backgroundColor: item.active ? 'rgba(255,255,255,0.18)' : 'rgba(52, 78, 141, 0.12)',
                      },
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={item.active ? activeTint : inactiveTint}
                    />
                  </View>
                  <Text
                    style={[
                      styles.fabMenuLabel,
                      { color: item.active ? activeTint : '#344E8D' },
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
                {item.active ? (
                  <Ionicons name="ellipse" size={10} color={activeTint} />
                ) : null}
              </Pressable>
            ))}
          </View>
        ) : null}

        <Pressable
          onPress={() => setExpanded((current) => !current)}
          accessibilityLabel={expanded ? `Close menu for ${activeLabel}` : `Open menu for ${activeLabel}`}
          style={({ pressed }) => [
            styles.fabTrigger,
            { backgroundColor: accentColor },
            pressed ? styles.fabTriggerPressed : undefined,
          ]}
        >
          <Ionicons
            name={expanded ? 'close' : activeItem?.icon ?? 'add'}
            size={28}
            color={activeTint}
          />
        </Pressable>
      </View>
    </View>
  );
}

function formatOrderStatusLabel(status: OrderStatus) {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'accepted':
      return 'Accepted';
    case 'preparing':
      return 'Preparing';
    case 'ready':
      return 'Ready';
    case 'on_the_way':
      return 'On the Way';
    case 'delivered':
      return 'Delivered';
    case 'rejected':
      return 'Rejected';
    case 'canceled':
      return 'Canceled';
    default:
      return status;
  }
}

export function OrderStatusBadge({
  status,
  compact = false,
}: {
  status: OrderStatus;
  compact?: boolean;
}) {
  return (
    <View
      style={[
        styles.orderStatusBadge,
        compact && styles.orderStatusBadgeCompact,
        status === 'pending' && styles.orderStatusPending,
        status === 'accepted' && styles.orderStatusAccepted,
        status === 'preparing' && styles.orderStatusPreparing,
        status === 'ready' && styles.orderStatusReady,
        status === 'on_the_way' && styles.orderStatusOnTheWay,
        status === 'delivered' && styles.orderStatusDelivered,
        status === 'rejected' && styles.orderStatusRejected,
        status === 'canceled' && styles.orderStatusCanceled,
      ]}
    >
      <Text style={[styles.orderStatusText, compact && styles.orderStatusTextCompact]}>
        {formatOrderStatusLabel(status)}
      </Text>
    </View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  error,
  ...props
}: TextInputProps & {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <LayeredSurface
        topStyle={[styles.inputTop, error && styles.inputError]}
        bottomStyle={styles.inputBottom}
        baseStyle={styles.inputBase}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor="#667782"
          style={styles.input}
          {...props}
        />
      </LayeredSurface>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export const commonStyles = StyleSheet.create({
  mutedText: {
    color: '#56707B',
  },
  smallText: {
    color: '#56707B',
    fontSize: 12,
  },
  metricValue: {
    color: '#0F2529',
    fontSize: 28,
    fontWeight: '700',
  },
  metricLabel: {
    color: '#56707B',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

const styles = StyleSheet.create({
  layerHost: {
    marginBottom: 6,
    minHeight: 24,
    position: 'relative',
  },
  buttonHost: {
    alignSelf: 'flex-start',
    marginBottom: 6,
    minHeight: 24,
    position: 'relative',
  },
  topLayer: {
    borderColor: '#242622',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  bottomLayer: {
    backgroundColor: '#E5E5C7',
    borderColor: '#242622',
    borderRadius: 16,
    borderWidth: 1,
    bottom: -6,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 6,
    zIndex: -1,
  },
  baseLayer: {
    backgroundColor: '#8C8C8C',
    borderColor: '#242622',
    borderRadius: 16,
    borderWidth: 1,
    bottom: -10,
    left: -1,
    position: 'absolute',
    right: -1,
    top: 10,
    zIndex: -2,
  },
  // bottomRailLeft: {
  //   backgroundColor: '#242622',
  //   bottom: 0,
  //   height: 8,
  //   left: '15%',
  //   position: 'absolute',
  //   width: 2,
  // },
  // bottomRailRight: {
  //   backgroundColor: '#242622',
  //   bottom: 0,
  //   height: 8,
  //   left: '85%',
  //   position: 'absolute',
  //   width: 2,
  // },
  shine: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    height: '170%',
    left: -24,
    position: 'absolute',
    top: -12,
    transform: [{ skewX: '-20deg' }],
    width: 18,
  },
  pressedTop: {
    transform: [{ translateY: 6 }],
  },
  cardTop: {
    backgroundColor: '#F9F6EE',
    borderRadius: 24,
    gap: 12,
    padding: 18,
  },
  cardBottom: {
    backgroundColor: '#D7D1BE',
    borderColor: '#2E302C',
    borderRadius: 24,
    top: 9,
    bottom: -9,
  },
  cardBase: {
    backgroundColor: '#6F6A5C',
    borderColor: '#2E302C',
    borderRadius: 24,
    borderWidth: 1,
    left: -2,
    right: -2,
    top: 15,
    bottom: -15,
  },
  cardRailLeft: {
    backgroundColor: '#2E302C',
    height: 10,
  },
  cardRailRight: {
    backgroundColor: '#2E302C',
    height: 10,
  },
  nestedCardTop: {
    backgroundColor: '#FBFCF8',
    borderRadius: 14,
    gap: 8,
    padding: 12,
  },
  nestedCardBottom: {
    backgroundColor: '#E1DBC9',
    borderColor: '#3A3B37',
    borderRadius: 14,
    top: 8,
    bottom: -8,
  },
  nestedCardBase: {
    backgroundColor: '#7E786C',
    borderColor: '#3A3B37',
    borderRadius: 14,
    borderWidth: 1,
    left: -2,
    right: -2,
    top: 12,
    bottom: -12,
  },
  nestedCardRailLeft: {
    backgroundColor: '#3A3B37',
    height: 9,
  },
  nestedCardRailRight: {
    backgroundColor: '#3A3B37',
    height: 9,
  },
  sectionHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  sectionCopy: {
    flex: 1,
    gap: 4,
  },
  sectionTitle: {
    color: '#0F2529',
    fontSize: 22,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: '#56707B',
    fontSize: 14,
  },
  pillTop: {
    alignItems: 'center',
    backgroundColor: '#E7E3D9',
    borderRadius: 999,
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pillBottom: {
    borderRadius: 999,
  },
  pillBase: {
    borderRadius: 999,
  },
  pillTopActive: {
    backgroundColor: '#174C4F',
  },
  pillText: {
    color: '#174C4F',
    fontWeight: '700',
  },
  pillTextActive: {
    color: '#FDF9EF',
  },
  buttonTop: {
    alignItems: 'center',
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 16,
  },
  buttonBottom: {
    borderRadius: 16,
  },
  buttonBase: {
    borderRadius: 16,
  },
  primaryButton: {
    backgroundColor: '#D45D31',
  },
  secondaryButton: {
    backgroundColor: '#174C4F',
  },
  ghostButton: {
    backgroundColor: '#FFFCF4',
  },
  dangerButton: {
    backgroundColor: '#9D3C2A',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFF7ED',
    fontSize: 15,
    fontWeight: '700',
  },
  iconLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buttonTextWithIcon: {
    fontSize: 14,
  },
  secondaryButtonText: {
    color: '#F8F4E8',
  },
  ghostButtonText: {
    color: '#174C4F',
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    color: '#0F2529',
    fontSize: 13,
    fontWeight: '600',
  },
  inputTop: {
    backgroundColor: '#FFFCF4',
    borderRadius: 16,
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 0,
  },
  inputBottom: {
    borderRadius: 16,
  },
  inputBase: {
    borderRadius: 16,
  },
  input: {
    color: '#0F2529',
    minHeight: 48,
    paddingHorizontal: 2,
    paddingVertical: 12,
  },
  inputError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '500',
  },
  orderStatusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  orderStatusBadgeCompact: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  orderStatusText: {
    color: '#174C4F',
    fontSize: 12,
    fontWeight: '700',
  },
  orderStatusTextCompact: {
    fontSize: 11,
  },
  orderStatusPending: {
    backgroundColor: '#E5E7EB',
  },
  orderStatusAccepted: {
    backgroundColor: '#DBEAFE',
  },
  orderStatusPreparing: {
    backgroundColor: '#FCE7F3',
  },
  orderStatusReady: {
    backgroundColor: '#FEF3C7',
  },
  orderStatusOnTheWay: {
    backgroundColor: '#DCFCE7',
  },
  orderStatusDelivered: {
    backgroundColor: '#D1E9D5',
  },
  orderStatusRejected: {
    backgroundColor: '#FCCCC3',
  },
  orderStatusCanceled: {
    backgroundColor: '#FCCCC3',
  },
  fabScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16, 24, 28, 0.51)',
  },
  fabDock: {
    alignItems: 'flex-end',
    bottom: 24,
    position: 'absolute',
    right: 16,
  },
  fabMenuList: {
    gap: 10,
    marginBottom: 14,
    maxWidth: 280,
  },
  fabMenuItem: {
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: 18,
    paddingVertical: 10,
    shadowColor: '#00000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
  },
  fabMenuItemPressed: {
    opacity: 0.92,
    transform: [{ translateY: 1 }],
  },
  fabMenuIconWrap: {
    alignItems: 'center',
    borderRadius: 999,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  fabMenuLeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  fabMenuLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  fabTrigger: {
    alignItems: 'center',
    borderRadius: 26,
    height: 60,
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    width: 60,
  },
  fabTriggerPressed: {
    opacity: 0.94,
    transform: [{ translateY: 1 }],
  },
});
