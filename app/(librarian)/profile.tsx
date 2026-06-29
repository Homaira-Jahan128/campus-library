import React from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { ScreenHeader } from "@/components/ScreenHeader";
import { COLORS, FONT, SPACING } from "@/utils/constants";
import { sendPasswordReset } from "@/services/authService";


export default function LibrarianProfile() {
  const { appUser, logout } = useAuth();

  const initials = appUser?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "L";

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

  const handleChangePassword = () => {
  Alert.alert(
    "Change Password",
    `Send a reset link to ${appUser?.email}?`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Send Link",
        onPress: async () => {
          try {
            await sendPasswordReset(appUser?.email ?? "");
            Alert.alert(
              "Email Sent ✓",
              "Check your inbox for the password reset link. Also check spam folder."
            );
          } catch (e: any) {
            Alert.alert("Error", e?.message ?? "Could not send reset email.");
          }
        },
      },
    ]
  );
};

  return (
    <View style={styles.container}>
      <ScreenHeader title="Profile" subtitle="Your librarian account" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{appUser?.name}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="library" size={12} color={COLORS.accent} />
            <Text style={styles.roleText}>LIBRARIAN</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <InfoRow icon="mail" label="Email" value={appUser?.email} />
          <InfoRow icon="card" label="Employee ID" value={appUser?.employeeId} />
          <InfoRow icon="business" label="Library" value={appUser?.libraryName} />
          <InfoRow
            icon="ellipse"
            label="Status"
            value={appUser?.status?.toUpperCase()}
            valueColor={appUser?.status === "active" ? COLORS.accent : COLORS.warning}
          />
        </View>
        <Pressable style={styles.changePassBtn} onPress={handleChangePassword}>
          <Ionicons name="key-outline" size={18} color={COLORS.primary} />
          <Text style={styles.changePassText}>Change Password</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        </Pressable>
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
      <Text style={[styles.infoValue, valueColor ? { color: valueColor } : null]}>{value || "-"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  avatarSection: { alignItems: "center", marginBottom: SPACING.lg, marginTop: SPACING.sm },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.accent, alignItems: "center", justifyContent: "center", marginBottom: SPACING.md },
  avatarText: { color: COLORS.white, fontSize: FONT.size.xl, fontWeight: "800" },
  name: { fontSize: FONT.size.lg, fontWeight: "800", color: COLORS.text },
  roleBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#E1F5EA", paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: 999, marginTop: SPACING.xs },
  roleText: { color: COLORS.accent, fontWeight: "700", fontSize: FONT.size.xs },
  infoCard: { backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg, overflow: "hidden" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoLeft: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  infoLabel: { color: COLORS.textMuted, fontWeight: "600" },
  infoValue: { color: COLORS.text, fontWeight: "700" },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SPACING.sm, backgroundColor: COLORS.danger, padding: SPACING.md, borderRadius: 14 },
  logoutText: { color: COLORS.white, fontWeight: "700", fontSize: FONT.size.md },
  changePassBtn: {
  flexDirection: "row",
  alignItems: "center",
  gap: SPACING.sm,
  backgroundColor: COLORS.card,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: COLORS.border,
  padding: SPACING.md,
  marginTop: SPACING.md,
  marginBottom: SPACING.sm,
},
changePassText: {
  flex: 1,
  fontSize: FONT.size.md,
  fontWeight: "600",
  color: COLORS.text,
},
});