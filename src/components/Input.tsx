import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { COLORS, RADIUS, SPACING, FONT } from "@/utils/constants";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...rest }: InputProps) {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor={COLORS.textMuted}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT.size.sm,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    fontSize: FONT.size.md,
    backgroundColor: COLORS.card,
    color: COLORS.text,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  error: {
    color: COLORS.danger,
    fontSize: FONT.size.xs,
    marginTop: SPACING.xs,
  },
});