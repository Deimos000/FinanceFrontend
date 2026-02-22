import React, { useCallback, useEffect, useState } from 'react';
import {
    View, Text, TouchableOpacity, ActivityIndicator, ScrollView,
    StyleSheet, Alert, Platform, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { getFriends } from '@/utils/api';
import { getSandboxShares, shareSandbox, updateSandboxShare, removeSandboxShare } from '../_utils/api';
import { SandboxShare } from '../_utils/types';

interface ShareSandboxModalProps {
    visible: boolean;
    sandboxId: number;
    sandboxName: string;
    onClose: () => void;
}

export default function ShareSandboxModal({ visible, sandboxId, sandboxName, onClose }: ShareSandboxModalProps) {
    const { colors } = useTheme();
    const [shares, setShares] = useState<SandboxShare[]>([]);
    const [friends, setFriends_] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        try {
            const [sharesData, friendsData] = await Promise.all([
                getSandboxShares(sandboxId),
                getFriends()
            ]);
            setShares(sharesData || []);
            setFriends_(friendsData.friends || []);
        } catch (e) {
            console.error("Load share data error:", e);
        } finally {
            setLoading(false);
        }
    }, [sandboxId]);

    useEffect(() => {
        if (visible) {
            setLoading(true);
            loadData();
        }
    }, [visible, loadData]);

    const unsharedFriends = friends.filter(
        f => !shares.some(s => s.shared_with_id === f.friend_id)
    );

    const handleShare = async (friendId: number, permission: 'watch' | 'edit') => {
        setActionLoading(`share-${friendId}`);
        try {
            const ok = await shareSandbox(sandboxId, friendId, permission);
            if (ok) await loadData();
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(null);
        }
    };

    const handleTogglePermission = async (share: SandboxShare) => {
        const newPerm = share.permission === 'watch' ? 'edit' : 'watch';
        setActionLoading(`toggle-${share.id}`);
        try {
            const ok = await updateSandboxShare(sandboxId, share.id, newPerm);
            if (ok) await loadData();
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(null);
        }
    };

    const handleRemove = async (share: SandboxShare) => {
        const doRemove = async () => {
            setActionLoading(`remove-${share.id}`);
            try {
                const ok = await removeSandboxShare(sandboxId, share.id);
                if (ok) await loadData();
            } catch (e) {
                console.error(e);
            } finally {
                setActionLoading(null);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`Remove ${share.shared_with_username}'s access?`)) doRemove();
        } else {
            Alert.alert('Remove Access', `Remove ${share.shared_with_username}'s access?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: doRemove },
            ]);
        }
    };

    return (
        <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.sheet, { backgroundColor: colors.cardBackground }]}>
                    {/* Drag Handle */}
                    <View style={styles.handle} />

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.title, { color: colors.text }]}>Share Sandbox</Text>
                            <Text style={[styles.subtitle, { color: colors.icon }]} numberOfLines={1}>
                                "{sandboxName}"
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                            <Ionicons name="close" size={18} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : (
                        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                            {/* Current Shares */}
                            {shares.length > 0 && (
                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <View style={[styles.sectionIcon, { backgroundColor: colors.primary + '20' }]}>
                                            <Ionicons name="people" size={14} color={colors.primary} />
                                        </View>
                                        <Text style={[styles.sectionTitle, { color: colors.icon }]}>
                                            Shared With ({shares.length})
                                        </Text>
                                    </View>
                                    <View style={[styles.sectionCard, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                                        {shares.map((share, idx) => (
                                            <View key={share.id}>
                                                {idx > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                                                <View style={styles.shareRow}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                                        <View style={[styles.avatar, { backgroundColor: colors.primary + '30', borderColor: colors.primary + '50', borderWidth: 1 }]}>
                                                            <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 14 }}>
                                                                {share.shared_with_username.charAt(0).toUpperCase()}
                                                            </Text>
                                                        </View>
                                                        <Text style={[styles.username, { color: colors.text }]}>
                                                            {share.shared_with_username}
                                                        </Text>
                                                    </View>

                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                        {/* Permission Toggle */}
                                                        <TouchableOpacity
                                                            onPress={() => handleTogglePermission(share)}
                                                            disabled={actionLoading === `toggle-${share.id}`}
                                                            style={[
                                                                styles.permBadge,
                                                                {
                                                                    backgroundColor: share.permission === 'edit'
                                                                        ? '#4cd96415'
                                                                        : colors.primary + '15',
                                                                    borderColor: share.permission === 'edit'
                                                                        ? '#4cd96450'
                                                                        : colors.primary + '50',
                                                                }
                                                            ]}
                                                        >
                                                            {actionLoading === `toggle-${share.id}`
                                                                ? <ActivityIndicator size="small" color={colors.primary} />
                                                                : <>
                                                                    <Ionicons
                                                                        name={share.permission === 'edit' ? 'create-outline' : 'eye-outline'}
                                                                        size={13}
                                                                        color={share.permission === 'edit' ? '#4cd964' : colors.primary}
                                                                    />
                                                                    <Text style={{
                                                                        color: share.permission === 'edit' ? '#4cd964' : colors.primary,
                                                                        fontSize: 12,
                                                                        fontWeight: '600',
                                                                        marginLeft: 4,
                                                                        textTransform: 'capitalize'
                                                                    }}>
                                                                        {share.permission}
                                                                    </Text>
                                                                </>
                                                            }
                                                        </TouchableOpacity>

                                                        {/* Remove */}
                                                        <TouchableOpacity
                                                            onPress={() => handleRemove(share)}
                                                            disabled={actionLoading === `remove-${share.id}`}
                                                            style={[styles.removeBtn, { backgroundColor: '#ff453a15' }]}
                                                        >
                                                            {actionLoading === `remove-${share.id}`
                                                                ? <ActivityIndicator size="small" color="#e74c3c" />
                                                                : <Ionicons name="trash-outline" size={15} color="#ff453a" />
                                                            }
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Add Friends */}
                            {unsharedFriends.length > 0 && (
                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <View style={[styles.sectionIcon, { backgroundColor: '#FFA50020' }]}>
                                            <Ionicons name="person-add" size={14} color="#FFA500" />
                                        </View>
                                        <Text style={[styles.sectionTitle, { color: colors.icon }]}>
                                            Add Friends
                                        </Text>
                                    </View>
                                    <View style={[styles.sectionCard, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                                        {unsharedFriends.map((friend, idx) => (
                                            <View key={friend.friend_id}>
                                                {idx > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                                                <View style={styles.shareRow}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                                        <View style={[styles.avatar, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40', borderWidth: 1 }]}>
                                                            <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 14 }}>
                                                                {friend.friend_username.charAt(0).toUpperCase()}
                                                            </Text>
                                                        </View>
                                                        <Text style={[styles.username, { color: colors.text }]}>
                                                            {friend.friend_username}
                                                        </Text>
                                                    </View>

                                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                                        <TouchableOpacity
                                                            onPress={() => handleShare(friend.friend_id, 'watch')}
                                                            disabled={actionLoading === `share-${friend.friend_id}`}
                                                            style={[styles.shareBtn, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '50' }]}
                                                        >
                                                            {actionLoading === `share-${friend.friend_id}` ? (
                                                                <ActivityIndicator size="small" color={colors.primary} />
                                                            ) : (
                                                                <>
                                                                    <Ionicons name="eye-outline" size={14} color={colors.primary} />
                                                                    <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600', marginLeft: 4 }}>Watch</Text>
                                                                </>
                                                            )}
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            onPress={() => handleShare(friend.friend_id, 'edit')}
                                                            disabled={actionLoading === `share-${friend.friend_id}`}
                                                            style={[styles.shareBtn, { backgroundColor: '#4cd96415', borderColor: '#4cd96450' }]}
                                                        >
                                                            <Ionicons name="create-outline" size={14} color="#4cd964" />
                                                            <Text style={{ color: '#4cd964', fontSize: 12, fontWeight: '600', marginLeft: 4 }}>Edit</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Empty state */}
                            {friends.length === 0 && (
                                <View style={[styles.emptyState, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                                    <View style={[styles.emptyIcon, { backgroundColor: colors.primary + '15' }]}>
                                        <Ionicons name="people-outline" size={32} color={colors.primary} style={{ opacity: 0.7 }} />
                                    </View>
                                    <Text style={{ color: colors.text, textAlign: 'center', fontSize: 15, fontWeight: '600', marginBottom: 4 }}>
                                        No Friends Yet
                                    </Text>
                                    <Text style={{ color: colors.icon, textAlign: 'center', fontSize: 13, opacity: 0.8 }}>
                                        Add friends from Settings first to share sandboxes.
                                    </Text>
                                </View>
                            )}

                            {friends.length > 0 && unsharedFriends.length === 0 && shares.length > 0 && (
                                <View style={{ padding: 24, alignItems: 'center' }}>
                                    <Ionicons name="checkmark-circle" size={28} color={colors.secondary} style={{ marginBottom: 8, opacity: 0.7 }} />
                                    <Text style={{ color: colors.icon, textAlign: 'center', fontSize: 14, opacity: 0.8 }}>
                                        All friends have access to this sandbox.
                                    </Text>
                                </View>
                            )}
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    sheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    section: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 8,
    },
    sectionIcon: {
        width: 26,
        height: 26,
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sectionCard: {
        borderRadius: 14,
        paddingHorizontal: 14,
        overflow: 'hidden',
    },
    shareRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        marginLeft: 48,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    username: {
        fontSize: 15,
        fontWeight: '500',
    },
    permBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        borderWidth: 1,
    },
    shareBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        borderWidth: 1,
    },
    removeBtn: {
        width: 30,
        height: 30,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyState: {
        borderRadius: 14,
        padding: 32,
        alignItems: 'center',
        marginHorizontal: 0,
    },
    emptyIcon: {
        width: 60,
        height: 60,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
});
