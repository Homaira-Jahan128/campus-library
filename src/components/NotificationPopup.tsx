import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { COLORS, FONT, RADIUS, SPACING } from "@/utils/constants";
import { AppNotification } from "@/types";
import { getNotificationsForUser, markNotificationRead } from "@/services/notificationService";
import { formatDate } from "@/utils/fines";

interface Props {
  visible: boolean;
  onClose: () => void;
}

const ICON_MAP: Record<string, { icon: string; color: string }> = {
  request_submitted: { icon: "paper-plane-outline", color: COLORS.primary },
  request_approved: { icon: "checkmark-circle-outline", color: COLORS.accent },
  request_rejected: { icon: "close-circle-outline", color: COLORS.danger },
  book_returned: { icon: "book-outline", color: COLORS.primary },
  due_reminder: { icon: "time-outline", color: COLORS.warning },
  overdue_reminder: { icon: "alert-circle-outline", color: COLORS.danger },
  librarian_approved: { icon: "shield-checkmark-outline", color: COLORS.accent },
  librarian_rejected: { icon: "shield-outline", color: COLORS.danger },
};

export default function NotificationPopup({ visible, onClose }: Props) {
  const { appUser } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible && appUser) {
      setLoading(true);
      getNotificationsForUser(appUser.uid)
        .then(setNotifications)
        .finally(() => setLoading(false));
    }
  }, [visible, appUser?.uid]);

  const handlePress = async (n: AppNotification) => {
    if (!n.read) {
      await markNotificationRead(n.id);
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
      );
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.panel} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Notifications</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.textMuted} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 420 }}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Ionicons name="notifications-off-outline" size={36} color={COLORS.border} />
                  <Text style={styles.emptyText}>No notifications yet.</Text>
                </View>
              }
              renderItem={({ item }) => {
                const meta = ICON_MAP[item.type] ?? { icon: "notifications-outline", color: COLORS.primary };
                return (
                  <Pressable
                    style={[styles.item, !item.read && styles.itemUnread]}
                    onPress={() => handlePress(item)}
                  >
                    <View style={[styles.iconCircle, { backgroundColor: meta.color + "18" }]}>
                      <Ionicons name={meta.icon as any} size={18} color={meta.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemMessage} numberOfLines={2}>{item.message}</Text>
                      <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
                    </View>
                    {!item.read && <View style={styles.unreadDot} />}
                  </Pressable>
                );
              }}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 100,
    paddingRight: 16,
  },
  panel: {
    width: 320,
    maxWidth: "92%",
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: { fontSize: FONT.size.md, fontWeight: "800", color: COLORS.text },
  closeBtn: { padding: 2 },
  center: { padding: SPACING.xl, alignItems: "center" },
  empty: { alignItems: "center", padding: SPACING.xl, gap: SPACING.sm },
  emptyText: { color: COLORS.textMuted },
  item: {
    flexDirection: "row",
    gap: SPACING.sm,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: "flex-start",
  },
  itemUnread: { backgroundColor: COLORS.primaryLight + "40" },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  itemTitle: { fontSize: FONT.size.sm, fontWeight: "700", color: COLORS.text },
  itemMessage: { fontSize: FONT.size.xs, color: COLORS.textMuted, marginTop: 2 },
  itemDate: { fontSize: 10, color: COLORS.textMuted, marginTop: 4 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: 4,
  },
});