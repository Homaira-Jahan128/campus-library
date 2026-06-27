import React, { useState } from "react";
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
import { ScreenHeader } from "@/components/ScreenHeader";
import { COLORS, FONT, RADIUS, SPACING } from "@/utils/constants";
import { ItemType } from "@/types";
import { addBook } from "@/services/bookService";

export default function AddBook() {
  const { appUser } = useAuth();
  const [type, setType] = useState<ItemType>("book");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [shelfLocation, setShelfLocation] = useState("");
  const [totalCopies, setTotalCopies] = useState("1");
  const [loading, setLoading] = useState(false);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(librarian)/inventory");
  };

  const handleSubmit = async () => {
    if (!appUser?.libraryId || !appUser?.libraryName) return;
    if (!title.trim() || !author.trim()) {
      Alert.alert("Error", "Title and author are required");
      return;
    }
    const copies = parseInt(totalCopies, 10);
    if (isNaN(copies) || copies < 1) {
      Alert.alert("Error", "Total copies must be at least 1");
      return;
    }
    setLoading(true);
    try {
      await addBook({
        title: title.trim(),
        author: author.trim(),
        type,
        description: description.trim(),
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        shelfLocation: shelfLocation.trim(),
        totalCopies: copies,
        libraryId: appUser.libraryId,
        libraryName: appUser.libraryName,
      });
      Alert.alert("Success ✓", "Item added to inventory.", [
        { text: "OK", onPress: goBack },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not add item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScreenHeader
        title="Add Item"
        subtitle="Add book or paper to inventory"
        showBack
        onBackPress={goBack}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Item Type</Text>
        <View style={styles.typeRow}>
          {(["book", "paper"] as ItemType[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              style={[styles.typeChip, type === t && styles.typeChipActive]}
            >
              <Ionicons
                name={t === "book" ? "book" : "document-text"}
                size={16}
                color={type === t ? COLORS.white : COLORS.text}
              />
              <Text style={[styles.typeText, type === t && styles.typeTextActive]}>
                {t === "book" ? "Book" : "Research Paper"}
              </Text>
            </Pressable>
          ))}
        </View>

        <Input label="Title *" placeholder="Book or paper title" value={title} onChangeText={setTitle} />
        <Input label="Author *" placeholder="Author name" value={author} onChangeText={setAuthor} />
        <Input
          label="Description"
          placeholder="Brief description"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          style={styles.textArea}
        />
        <Input
          label="Tags (comma separated)"
          placeholder="e.g. database, algorithms, 3rd year"
          value={tags}
          onChangeText={setTags}
        />
        <Input
          label="Shelf Location"
          placeholder="e.g. Rack B-3, Shelf 2"
          value={shelfLocation}
          onChangeText={setShelfLocation}
        />
        <Input
          label="Total Copies *"
          placeholder="Number of copies"
          value={totalCopies}
          onChangeText={setTotalCopies}
          keyboardType="number-pad"
        />

        <Button title="Add to Inventory" onPress={handleSubmit} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: SPACING.lg, paddingBottom: SPACING.xl },
  label: { fontSize: FONT.size.sm, fontWeight: "600", color: COLORS.text, marginBottom: SPACING.xs },
  typeRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.md },
  typeChip: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: SPACING.xs, paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md, borderWidth: 1.5,
    borderColor: COLORS.border, backgroundColor: COLORS.card,
  },
  typeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeText: { color: COLORS.text, fontWeight: "600" },
  typeTextActive: { color: COLORS.white },
  textArea: { height: 80, textAlignVertical: "top" },
});