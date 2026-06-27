import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, RADIUS, SPACING, FONT } from "@/utils/constants";

type BadgeStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "active"
  | "returned"
  | "overdue"
  | "disabled";

interface BadgeProps {
  status: BadgeStatus;
  label?: string;
}

const STATUS_COLORS: Record<BadgeStatus, { bg: string; fg: string }> = {
  pending: { bg: "#FFF3D6", fg: COLORS.warning },
  approved: { bg: "#E1F5EA", fg: COLORS.accent },
  active: { bg: "#E1F5EA", fg: COLORS.accent },
  returned: { bg: COLORS.primaryLight, fg: COLORS.primary },
  rejected: { bg: "#FBE3E3", fg: COLORS.danger },
  disabled: { bg: "#FBE3E3", fg: COLORS.danger },
  overdue: { bg: "#FBE3E3", fg: COLORS.danger },
};

export function Badge({ status, label }: BadgeProps) {
  const colors = STATUS_COLORS[status];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.fg }]}>
        {(label ?? status).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: FONT.size.xs,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});