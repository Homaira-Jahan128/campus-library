import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Input } from "@/components/Input";
import { ScreenHeader } from "@/components/ScreenHeader";
import { COLORS, FONT, RADIUS, SPACING } from "@/utils/constants";
import { AppUser, UserRole } from "@/types";
import { getAllUsers, setUserStatus, filterUsers } from "@/services/userService";

const FILTERS: { label: string; value: UserRole | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Students", value: "student" },
  { label: "Librarians", value: "librarian" },
];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [COLORS.primary, COLORS.accent, "#9B59B6", "#E67E22", "#16A085"];
function avatarColor(name: string) {
  const i = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[i];
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [searchText, setSearchText] = useState("");
  const [filter, setFilter] = useState<UserRole | "all">("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingUid, setActingUid] = useState<string | null>(null);

  const load = async () => {
    const data = await getAllUsers();
    setUsers(data);
  };

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => filterUsers(users, searchText, filter), [users, searchText, filter]);

  const counts = useMemo(
    () => ({
      all: users.length,
      student: users.filter((u) => u.role === "student").length,
      librarian: users.filter((u) => u.role === "librarian").length,
    }),
    [users]
  );

  const handleToggle = (user: AppUser) => {
    const isActive = user.status === "active";
    const action = isActive ? "Deactivate" : "Activate";
    Alert.alert(`${action} User`, `${action} "${user.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: action,
        style: isActive ? "destructive" : "default",
        onPress: async () => {
          setActingUid(user.uid);
          try {
            await setUserStatus(user.uid, isActive ? "disabled" : "active");
            setUsers((prev) =>
              prev.map((u) => (u.uid === user.uid ? { ...u, status: isActive ? "disabled" : "active" } : u))
            );
          } catch {
            Alert.alert("Error", "Action failed.");
          } finally {
            setActingUid(null);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Users" subtitle={`${users.length} total accounts`} />

      <View style={styles.searchWrap}>
        <Input
          placeholder="Search by name or email..."
          value={searchText}
          onChangeText={setSearchText}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.value}
            onPress={() => setFilter(f.value)}
            style={[styles.chip, filter === f.value && styles.chipActive]}
          >
            <Text style={[styles.chipText, filter === f.value && styles.chipTextActive]}>{f.label}</Text>
            <View style={[styles.chipCount, filter === f.value && styles.chipCountActive]}>
              <Text style={[styles.chipCountText, filter === f.value && styles.chipCountTextActive]}>
                {counts[f.value as keyof typeof counts] ?? counts.all}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No users found.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isActive = item.status === "active";
            return (
              <View style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={[styles.avatar, { backgroundColor: avatarColor(item.name) }]}>
                    <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                    <View style={styles.tagsRow}>
                      <View style={[styles.roleTag, item.role === "librarian" && styles.roleTagLibrarian]}>
                        <Text style={[styles.roleTagText, item.role === "librarian" && styles.roleTagTextLibrarian]}>
                          {item.role.toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.deptTag}>
                        <Text style={styles.deptTagText} numberOfLines={1}>
                          {item.role === "librarian" ? item.libraryName : item.department}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {item.role !== "admin" && (
                    <Pressable
                      onPress={() => handleToggle(item)}
                      disabled={actingUid === item.uid}
                      style={[styles.toggleBtn, isActive ? styles.toggleBtnActive : styles.toggleBtnInactive]}
                    >
                      {actingUid === item.uid ? (
                        <ActivityIndicator size="small" color={isActive ? COLORS.danger : COLORS.accent} />
                      ) : (
                        <Text style={{ fontSize: 12, fontWeight: "800", color: isActive ? COLORS.danger : COLORS.accent }}>
                          {isActive ? "OFF" : "ON"}
                        </Text>
                      )}
                    </Pressable>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  searchWrap: { paddingHorizontal: 20 },
  searchInput: { marginBottom: 0 },
  filterRow: { flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingVertical: 12 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.pill, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.card },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  chipTextActive: { color: COLORS.white },
  chipCount: { backgroundColor: COLORS.background, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  chipCountActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  chipCountText: { fontSize: 11, fontWeight: "700", color: COLORS.textMuted },
  chipCountTextActive: { color: COLORS.white },
  list: { padding: 20, paddingTop: 4 },
  card: { backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1.5, borderColor: COLORS.border, padding: 14, marginBottom: 12 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  userName: { fontSize: 15, fontWeight: "800", color: COLORS.text },
  userEmail: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  tagsRow: { flexDirection: "row", gap: 6, marginTop: 6 },
  roleTag: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  roleTagLibrarian: { backgroundColor: "#E1F5EA" },
  roleTagText: { fontSize: 10, fontWeight: "800", color: COLORS.primary },
  roleTagTextLibrarian: { color: COLORS.accent },
  deptTag: { backgroundColor: COLORS.background, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, maxWidth: 140 },
  deptTagText: { fontSize: 10, fontWeight: "700", color: COLORS.textMuted },
  toggleBtn: { width: 40, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  toggleBtnActive: { backgroundColor: "#FBE3E3", borderColor: COLORS.danger },
  toggleBtnInactive: { backgroundColor: "#E1F5EA", borderColor: COLORS.accent },
  emptyWrap: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },
});