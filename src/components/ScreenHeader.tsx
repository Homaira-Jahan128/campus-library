import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SPACING } from "@/utils/constants";


interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  showBack?: boolean;
  onBackPress?: () => void;
  badge?: boolean;
}

export function ScreenHeader({
  title,
  subtitle,
  eyebrow,
  rightIcon,
  onRightPress,
  showBack,
  onBackPress,
  badge,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 14 }]}>
      <View style={styles.row}>
        <View style={styles.left}>
          {showBack && (
            <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={8}>
              <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
            </Pressable>
          )}
          <View style={{ flexShrink: 1 }}>
            {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
            ) : null}
          </View>
        </View>

        {rightIcon ? (
          <Pressable style={styles.iconBtn} onPress={onRightPress} hitSlop={8}>
            <Ionicons name={rightIcon} size={19} color={COLORS.primary} />
            {badge && <View style={styles.badgeDot} />}
          </Pressable>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.background,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    flexShrink: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  iconPlaceholder: { width: 42, height: 42 },
  badgeDot: {
    position: "absolute",
    top: 8, right: 8,
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
    borderWidth: 1.5,
    borderColor: COLORS.card,
  },
});