import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import SearchableDropdown, { DropdownItem } from "@/components/SearchableDropdown";
import { COLORS, FONT, RADIUS, SPACING } from "@/utils/constants";
import { Library, UserRole } from "@/types";
import { getAllLibraries } from "@/services/libraryService";
import { RU_DEPARTMENTS } from "@/data/departments";

export default function SignupScreen() {
  const { signup } = useAuth();
  const [role, setRole] = useState<UserRole>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [session, setSession] = useState("");
  const [loading, setLoading] = useState(false);

  const [deptDropdown, setDeptDropdown] = useState(false);
  const [selectedDept, setSelectedDept] = useState("");

  const [libDropdown, setLibDropdown] = useState(false);
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [selectedLibrary, setSelectedLibrary] = useState<Library | null>(null);

  useEffect(() => {
    if (role === "librarian") {
      getAllLibraries()
        .then(setLibraries)
        .catch((err) => {
          console.log("Library error:", err);
          setLibraries([]);
        });
    }
  }, [role]);
  const deptItems: DropdownItem[] = useMemo(
    () => RU_DEPARTMENTS.map((d) => ({ label: d, value: d })),
    []
  );

  const libItems: DropdownItem[] = useMemo(
    () => libraries.map((lib) => ({ label: lib.name, value: lib.id })),
    [libraries]
  );

  const handleSignup = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Full name is required.");
      return;
    }
    if (role === "student" && !selectedDept) {
      Alert.alert("Error", "Please select your department.");
      return;
    }
    if (role === "student") {
      if (!rollNumber.trim()) {
        Alert.alert("Error", "Student ID is required.");
        return;
      }

      if (!/^\d{10}$/.test(rollNumber.trim())) {
        Alert.alert("Error", "Student ID must be exactly 10 digits.");
        return;
      }

      if (!session.trim()) {
        Alert.alert("Error", "Session is required.");
        return;
      }
    }
    if (role === "librarian" && !selectedLibrary) {
      Alert.alert("Error", "Please select your library.");
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      Alert.alert("Error", "Enter a valid email.");
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await signup({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        department: role === "student" ? selectedDept : undefined,
        rollNumber: role === "student" ? rollNumber.trim() : undefined,
        session: role === "student" ? session.trim() : undefined,
        libraryId: role === "librarian" ? selectedLibrary?.id : undefined,
        libraryName: role === "librarian" ? selectedLibrary?.name : undefined,
      });

      if (role === "librarian") {
        Alert.alert(
          "Request Submitted 📋",
          `Your request for "${selectedLibrary?.name}" has been sent to admin for approval.`,
          [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
        );
      } else {
        router.replace("/");
      }
    } catch (e: any) {
      Alert.alert("Signup Failed", e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={styles.backBtn}
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/(auth)/login");
          }}
        >
          <Ionicons name="arrow-back" size={18} color={COLORS.text} />
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Campus Library</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>I am a</Text>
          <View style={styles.roleRow}>
            {(["student", "librarian"] as UserRole[]).map((r) => (
              <Pressable
                key={r}
                style={[styles.roleBtn, role === r && styles.roleBtnActive]}
                onPress={() => {
                  setRole(r);
                  setSelectedDept("");
                  setSelectedLibrary(null);
                }}
              >
                <Ionicons
                  name={r === "student" ? "school-outline" : "book-outline"}
                  size={14}
                  color={role === r ? COLORS.primary : COLORS.textMuted}
                />
                <Text style={[styles.roleText, role === r && styles.roleTextActive]}>
                  {r === "student" ? "Student / Teacher" : "Librarian"}
                </Text>
              </Pressable>
            ))}
          </View>

          <Input
            label="Full Name"
            placeholder="Your full name"
            value={name}
            onChangeText={setName}
          />

          {role === "student" && (
            <>
              <Text style={styles.fieldLabel}>Department *</Text>
              <Pressable style={styles.dropdownBtn} onPress={() => setDeptDropdown(true)}>
                <Ionicons name="business-outline" size={14} color={COLORS.textMuted} />
                <Text
                  style={[styles.dropdownText, !selectedDept && { color: COLORS.textMuted }]}
                  numberOfLines={1}
                >
                  {selectedDept || "Select your department"}
                </Text>
                <Ionicons name="chevron-down" size={14} color={COLORS.textMuted} />
              </Pressable>

              <Input
                label="Student ID"
                placeholder="Your Student ID"
                value={rollNumber}
                onChangeText={setRollNumber}
                keyboardType="number-pad"
                maxLength={10}
              />
              <Input
                label="Session"
                placeholder="e.g. 2022-23"
                value={session}
                onChangeText={setSession}
              />
            </>
          )}

          {role === "librarian" && (
            <>
              <Text style={styles.fieldLabel}>Select Your Library *</Text>
              <Pressable
                style={styles.dropdownBtn}
                onPress={() => {
                  if (libraries.length === 0) {
                    Alert.alert("Loading...", "Please wait while libraries load.");
                    return;
                  }
                  setLibDropdown(true);
                }}
              >
                <Ionicons name="business" size={14} color={COLORS.textMuted} />
                <Text
                  style={[styles.dropdownText, !selectedLibrary && { color: COLORS.textMuted }]}
                  numberOfLines={1}
                >
                  {selectedLibrary ? selectedLibrary.name : "Select your library"}
                </Text>
                <Ionicons name="chevron-down" size={14} color={COLORS.textMuted} />
              </Pressable>
              {selectedLibrary && (
                <Text style={styles.libHint}>
                  ℹ️ Admin will verify and approve your access.
                </Text>
              )}
            </>
          )}

          <Input
            label="Email"
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Input
            label="Password"
            placeholder="Min. 6 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Input
            label="Confirm Password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <Button
            title={role === "librarian" ? "Submit Request" : "Create Account"}
            onPress={handleSignup}
            loading={loading}
            style={{ marginTop: 6 }}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Pressable onPress={() => router.replace("/(auth)/login")}>
              <Text style={styles.link}> Sign In</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <SearchableDropdown
        visible={deptDropdown}
        onClose={() => setDeptDropdown(false)}
        items={deptItems}
        title="Select Department"
        onSelect={(item) => setSelectedDept(item.value)}
      />

      <SearchableDropdown
        visible={libDropdown}
        onClose={() => setLibDropdown(false)}
        items={libItems}
        title="Select Your Library"
        onSelect={(item) => {
          const lib = libraries.find((l) => l.id === item.value);
          if (lib) setSelectedLibrary(lib);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingBottom: 40,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  header: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "800", color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 15, color: COLORS.textMuted },
  card: {
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    padding: 20,
    shadowColor: "#1A2B54",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: COLORS.textMuted, marginBottom: 8 },
  roleRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
  roleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  roleBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "14",
  },
  roleText: { fontSize: 13, fontWeight: "600", color: COLORS.textMuted },
  roleTextActive: { color: COLORS.primary },
  dropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    marginBottom: 14,
  },
  dropdownText: { flex: 1, fontSize: 14, color: COLORS.text },
  libHint: {
    fontSize: 11,
    marginTop: -10,
    marginBottom: 14,
    fontStyle: "italic",
    color: COLORS.textMuted,
  },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 16 },
  footerText: { fontSize: 14, color: COLORS.textMuted },
  link: { fontSize: 14, fontWeight: "700", color: COLORS.primary },
});