import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/utils/constants";

export interface DropdownItem {
  label: string;
  value: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  items: DropdownItem[];
  onSelect: (item: DropdownItem) => void;
  title: string;
}

export default function SearchableDropdown({
  visible,
  onClose,
  items,
  onSelect,
  title,
}: Props) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (visible) setQuery("");
  }, [visible]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.label.toLowerCase().indexOf(q) !== -1);
  }, [query, items]);

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={styles.panel}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={handleClose} hitSlop={10}>
              <Ionicons name="close" size={20} color={COLORS.textMuted} />
            </Pressable>
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${title.toLowerCase()}...`}
              placeholderTextColor={COLORS.textMuted}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")} hitSlop={10}>
                <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
              </Pressable>
            )}
          </View>

          <Text style={styles.count}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </Text>

          <FlatList
            data={filtered}
            keyExtractor={(item, idx) => `${item.value}-${idx}`}
            style={styles.list}
            keyboardShouldPersistTaps="always"
            ListEmptyComponent={<Text style={styles.noResult}>No matches found</Text>}
            renderItem={({ item }) => (
              <Pressable
                style={styles.item}
                onPress={() => {
                  onSelect(item);
                  handleClose();
                }}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={16}
                  color={COLORS.primary}
                  style={{ marginRight: 10 }}
                />
                <Text style={styles.itemText}>{item.label}</Text>
              </Pressable>
            )}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  panel: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 24 : 20,
    height: "75%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginBottom: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  title: { fontSize: 16, fontWeight: "800", color: COLORS.text },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    marginBottom: 6,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text, padding: 0 },
  count: { fontSize: 11, marginBottom: 8, color: COLORS.textMuted },
  list: { flex: 1 },
  noResult: { textAlign: "center", color: COLORS.textMuted, paddingVertical: 20 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemText: { fontSize: 14, flex: 1, color: COLORS.text },
});