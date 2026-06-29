import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { COLORS, FONT, SPACING } from "@/utils/constants";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate(): boolean {
    const next: typeof errors = {};
    if (!email.trim()) next.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email)) next.email = "Enter a valid email.";
    if (!password) next.password = "Password is required.";
    else if (password.length < 6) next.password = "At least 6 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace("/");
    } catch (e: any) {
      Alert.alert(
        "Login Failed",
        e?.code === "auth/invalid-credential"
          ? "Invalid email or password"
          : e?.message ?? "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={[COLORS.primary + "20", COLORS.background, COLORS.primaryLight + "15"]}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="book" size={32} color="#fff" />
          </View>
          <Text style={styles.appName}>Campus Library</Text>
          <Text style={styles.tagline}>Learn. Borrow. Grow.</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSubtitle}>Sign in to your account</Text>

          <Input
            label="Email"
            placeholder="your@email.com"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setErrors((p) => ({ ...p, email: undefined }));
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setErrors((p) => ({ ...p, password: undefined }));
            }}
            secureTextEntry
            error={errors.password}
          />

          {/* Forgot Password link */}
          <Pressable
            style={styles.forgotBtn}
            onPress={() => router.push("/(auth)/forgot-password")}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </Pressable>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginBtn}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <Pressable onPress={() => router.push("/(auth)/signup")}>
              <Text style={styles.link}> Sign Up</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 40,
  },
  logoSection: { alignItems: "center", marginBottom: 28 },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  appName: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 4,
  },
  tagline: { fontSize: 14, color: COLORS.textMuted },
  card: {
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 22,
    backgroundColor: COLORS.card,
    shadowColor: "#1A2B54",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 22,
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginTop: -SPACING.xs,
    marginBottom: SPACING.md,
    padding: 4,
  },
  forgotText: {
    fontSize: FONT.size.sm,
    color: COLORS.primary,
    fontWeight: "600",
  },
  loginBtn: { marginTop: 0 },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 18,
  },
  footerText: { fontSize: 14, color: COLORS.textMuted },
  link: { fontSize: 14, fontWeight: "700", color: COLORS.primary },
});