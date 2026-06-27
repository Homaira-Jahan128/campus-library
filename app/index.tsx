import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { COLORS, FONT, SPACING } from "@/utils/constants";

export default function Index() {
  const { firebaseUser, appUser, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.text}>Loading Campus Library...</Text>
      </View>
    );
  }

  if (!firebaseUser || !appUser) {
    return <Redirect href="/(auth)/login" />;
  }

  if (appUser.role === "student") {
    return <Redirect href="/(student)/home" />;
  }

  if (appUser.role === "librarian") {
    return <Redirect href="/(librarian)/dashboard" />;
  }

  if (appUser.role === "admin") {
    return <Redirect href="/(admin)/dashboard" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
    gap: SPACING.md,
  },
  text: { color: COLORS.textMuted, fontSize: FONT.size.md },
});