import React from "react";
import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { COLORS, FONT } from "@/utils/constants";
import { Platform, StyleSheet } from "react-native";

export default function AdminLayout() {
  const { appUser, loading } = useAuth();

  if (loading) return null;
  if (!appUser) return <Redirect href="/(auth)/login" />;
  if (appUser.role !== "admin") {
    if (appUser.role === "student") return <Redirect href="/(student)/home" />;
    if (appUser.role === "librarian") return <Redirect href="/(librarian)/dashboard" />;
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: "Users",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="libraries"
        options={{
          title: "Libraries",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="business" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.card,
    paddingTop: 4,
    height: Platform.OS === "ios" ? 88 : 64,
    paddingBottom: Platform.OS === "ios" ? 28 : 8,
  },
  tabLabel: {
    fontSize: FONT.size.xs,
    fontWeight: "600",
    marginTop: 2,
  },
});