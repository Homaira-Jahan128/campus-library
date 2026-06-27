import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";
import { COLORS, RADIUS, SPACING, FONT } from "@/utils/constants";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "outline";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const bgColor =
    variant === "primary"
      ? COLORS.primary
      : variant === "secondary"
      ? COLORS.accent
      : variant === "danger"
      ? COLORS.danger
      : "transparent";

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bgColor },
        variant === "outline" && styles.outline,
        isDisabled && styles.disabled,
        pressed && !isDisabled && { opacity: 0.85 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" ? COLORS.primary : COLORS.white}
        />
      ) : (
        <Text
          style={[
            styles.text,
            variant === "outline" && { color: COLORS.primary },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: COLORS.white,
    fontSize: FONT.size.md,
    fontWeight: "600",
  },
});