import React from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { ScreenHeader } from "@/components/ScreenHeader";
import { COLORS, FONT, SPACING } from "@/utils/constants";

const PROFILE_COLOR = "#1a6bb5";

export default function StudentProfile() {
  const { appUser, logout } = useAuth();

  const initials = appUser?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "S";

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            router.replace("/(auth)/login");
          } catch (e: any) {
            Alert.alert("Error", e?.message ?? "Could not log out");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Profile" subtitle="Your account details" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{appUser?.name}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="school" size={12} color={PROFILE_COLOR} />
            <Text style={styles.roleText}>STUDENT</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <InfoRow icon="mail" label="Email" value={appUser?.email} />
          <InfoRow icon="school-outline" label="Department" value={appUser?.department} />
          <InfoRow icon="card-outline" label="Roll Number" value={appUser?.rollNumber} />
          <InfoRow icon="calendar-outline" label="Session" value={appUser?.session} />
        </View>

        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value, valueColor }: { icon: any; label: string; value?: string; valueColor?: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon} size={16} color={COLORS.textMuted} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text
        style={[styles.infoValue, valueColor ? { color: valueColor } : null]}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {value || "-"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  avatarSection: { alignItems: "center", marginBottom: SPACING.lg, marginTop: SPACING.sm },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: PROFILE_COLOR,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  avatarText: { color: COLORS.white, fontSize: FONT.size.xl, fontWeight: "800" },
  name: { fontSize: FONT.size.lg, fontWeight: "800", color: COLORS.text },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E3EEF9", // #1a6bb5 এর সাথে contrast রেখে হালকা নীল shade
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: SPACING.xs,
  },
  roleText: { color: PROFILE_COLOR, fontWeight: "700", fontSize: FONT.size.xs },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    flexShrink: 0,
    maxWidth: "40%",
  },
  infoLabel: { color: COLORS.textMuted, fontWeight: "600" },
  infoValue: {
    color: COLORS.text,
    fontWeight: "700",
    flexShrink: 1,
    flex: 1,
    textAlign: "right",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.danger,
    padding: SPACING.md,
    borderRadius: 14,
  },
  logoutText: { color: COLORS.white, fontWeight: "700", fontSize: FONT.size.md },
});