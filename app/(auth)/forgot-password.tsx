import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { sendPasswordReset } from "@/services/authService";
import { COLORS, FONT, SPACING } from "@/utils/constants";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(auth)/login");
  };

  const handleSend = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordReset(email.trim());
      setSent(true);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <Pressable style={styles.backBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={18} color={COLORS.text} />
        </Pressable>

        {!sent ? (
          <>
            <View style={styles.iconWrap}>
              <Ionicons name="lock-open-outline" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your registered email address. We'll send you a link to reset your password.
            </Text>

            <Input
              label="Email Address"
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoFocus
            />

            <Button
              title="Send Reset Link"
              onPress={handleSend}
              loading={loading}
              style={styles.btn}
            />

            <Pressable style={styles.backLink} onPress={goBack}>
              <Text style={styles.backLinkText}>Back to Login</Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.successContainer}>
            <View style={styles.successIconWrap}>
              <Ionicons name="mail" size={48} color={COLORS.accent} />
            </View>
            <Text style={styles.successTitle}>Check Your Email</Text>
            <Text style={styles.successSubtitle}>
              We've sent a password reset link to
            </Text>
            <Text style={styles.successEmail}>{email}</Text>

            <View style={styles.stepsCard}>
              <Text style={styles.stepsTitle}>What to do next:</Text>
              {[
                { icon: "mail-open-outline", text: "Open the email from Campus Library" },
                { icon: "link-outline", text: "Click the reset link in the email" },
                { icon: "lock-closed-outline", text: "Set your new password in the browser" },
                { icon: "log-in-outline", text: "Come back and log in with new password" },
              ].map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  <Ionicons name={step.icon as any} size={16} color={COLORS.primary} />
                  <Text style={styles.stepText}>{step.text}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.spamNote}>
              Don't see it? Check your spam/junk folder.
            </Text>

            <Button
              title="Back to Login"
              onPress={() => router.replace("/(auth)/login")}
              style={styles.btn}
            />

            <Pressable
              style={styles.backLink}
              onPress={() => {
                setSent(false);
                setEmail("");
              }}
            >
              <Text style={styles.backLinkText}>Try a different email</Text>
            </Pressable>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 32,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    justifyContent: "center", alignItems: "center",
    marginBottom: 28,
  },
  iconWrap: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center", justifyContent: "center",
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: "900", color: COLORS.text, marginBottom: 8 },
  subtitle: {
    fontSize: 14, color: COLORS.textMuted,
    lineHeight: 22, marginBottom: 24,
  },
  btn: { marginTop: SPACING.sm },
  backLink: {
    alignItems: "center",
    marginTop: SPACING.lg,
    padding: SPACING.sm,
  },
  backLinkText: {
    color: COLORS.textMuted,
    fontWeight: "600",
    fontSize: FONT.size.sm,
  },
  successContainer: { flex: 1 },
  successIconWrap: {
    width: 88, height: 88, borderRadius: 24,
    backgroundColor: "#E1F5EA",
    alignItems: "center", justifyContent: "center",
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24, fontWeight: "900",
    color: COLORS.text, marginBottom: 6,
  },
  successSubtitle: { fontSize: 14, color: COLORS.textMuted },
  successEmail: {
    fontSize: 15, fontWeight: "800",
    color: COLORS.primary, marginBottom: 24, marginTop: 2,
  },
  stepsCard: {
    backgroundColor: COLORS.card, borderRadius: 16,
    borderWidth: 1.5, borderColor: COLORS.border,
    padding: SPACING.md, gap: SPACING.sm, marginBottom: SPACING.md,
  },
  stepsTitle: {
    fontSize: FONT.size.sm, fontWeight: "700",
    color: COLORS.text, marginBottom: 4,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  stepNum: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center", justifyContent: "center",
  },
  stepNumText: { fontSize: 10, fontWeight: "800", color: COLORS.primary },
  stepText: { fontSize: FONT.size.sm, color: COLORS.textMuted, flex: 1 },
  spamNote: {
    textAlign: "center", fontSize: 12,
    color: COLORS.textMuted, marginBottom: SPACING.md,
    fontStyle: "italic",
  },
});