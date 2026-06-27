import React from "react";
import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { COLORS, FONT, SPACING } from "@/utils/constants";

// ── Custom Tab Bar ──────────────────────────────────────────
function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  const TABS = [
    { name: "dashboard", icon: "grid", activeIcon: "grid", label: "Home" },
    { name: "inventory", icon: "library", activeIcon: "library", label: "Books" },
    { name: "requests", icon: "document-text", activeIcon: "document-text", label: "Requests" },
    { name: "loans", icon: "time", activeIcon: "time", label: "Loans" },
    { name: "profile", icon: "person", activeIcon: "person", label: "Profile" },
  ];

  // Only show real tabs (skip add-book and book/[id])
  const visibleRoutes = state.routes.filter((r: any) =>
    TABS.some((t) => t.name === r.name)
  );

  return (
    <View
      style={[
        styles.tabBar,
        { paddingBottom: insets.bottom > 0 ? insets.bottom : 10 },
      ]}
    >
      {visibleRoutes.map((route: any) => {
        const tab = TABS.find((t) => t.name === route.name);
        if (!tab) return null;

        const isFocused = state.routes[state.index].name === route.name;
        const color = isFocused ? COLORS.primary : COLORS.textMuted;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.name}
            onPress={onPress}
            style={styles.tabItem}
          >
            <Ionicons
              name={(isFocused ? tab.activeIcon : tab.icon) as any}
              size={24}
              color={color}
            />
            <Text style={[styles.tabLabel, { color }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Main Layout ─────────────────────────────────────────────
export default function LibrarianLayout() {
  const { appUser, loading, logout, refreshAppUser } = useAuth();

  if (loading) return null;
  if (!appUser) return <Redirect href="/(auth)/login" />;
  if (appUser.role !== "librarian") {
    if (appUser.role === "student") return <Redirect href="/(student)/home" />;
    if (appUser.role === "admin") return <Redirect href="/(admin)/dashboard" />;
    return <Redirect href="/(auth)/login" />;
  }

  if (appUser.status === "pending") {
    return (
      <View style={styles.pendingContainer}>
        <View style={styles.pendingIcon}>
          <Ionicons name="time" size={40} color={COLORS.warning} />
        </View>
        <Text style={styles.pendingTitle}>Pending Approval</Text>
        <Text style={styles.pendingText}>
          Your librarian account for{"\n"}
          <Text style={styles.bold}>{appUser.libraryName}</Text>
          {"\n\n"}has been submitted and is awaiting admin approval.{"\n\n"}
          You will be notified once approved.
        </Text>
        <Pressable style={styles.refreshBtn} onPress={refreshAppUser}>
          <Ionicons name="refresh" size={16} color={COLORS.primary} />
          <Text style={styles.refreshText}>Check Status</Text>
        </Pressable>
        <Pressable style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>
      </View>
    );
  }

  if (appUser.status === "disabled") {
    return (
      <View style={styles.pendingContainer}>
        <Ionicons name="ban-outline" size={64} color={COLORS.danger} />
        <Text style={styles.pendingTitle}>Account Disabled</Text>
        <Text style={styles.pendingText}>
          Your account has been disabled by an administrator.
        </Text>
        <Pressable style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="inventory" />
      <Tabs.Screen name="requests" />
      <Tabs.Screen name="loans" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="add-book" options={{ href: null }} />
      <Tabs.Screen name="book/[id]" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  // Custom tab bar
  tabBar: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.1,
  },

  // Pending / Disabled screens
  pendingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
    gap: SPACING.md,
  },
  pendingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFF3D6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  pendingTitle: {
    fontSize: FONT.size.xl,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
  },
  pendingText: {
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 24,
    fontSize: FONT.size.md,
  },
  bold: { fontWeight: "700", color: COLORS.text },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
    backgroundColor: COLORS.primaryLight,
    marginTop: SPACING.sm,
  },
  refreshText: { color: COLORS.primary, fontWeight: "700" },
  logoutBtn: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: COLORS.danger,
  },
  logoutText: { color: COLORS.danger, fontWeight: "700" },
});