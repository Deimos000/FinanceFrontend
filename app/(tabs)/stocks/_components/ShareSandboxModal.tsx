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
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>Share "{sandboxName}"</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close-circle" size={28} color={colors.icon} />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                        {/* Current Shares */}
                        {shares.length > 0 && (
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colors.secondary }]}>
                                    Shared With ({shares.length})
                                </Text>
                                {shares.map((share) => (
                                    <View key={share.id} style={[styles.shareRow, { borderBottomColor: colors.border }]}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                            <View style={[styles.avatar, { backgroundColor: colors.primary + '30' }]}>
                                                <Text style={{ color: colors.primary, fontWeight: 'bold' }}>
                                                    {share.shared_with_username.charAt(0).toUpperCase()}
                                                </Text>
                                            </View>
                                            <View>
                                                <Text style={[styles.username, { color: colors.text }]}>
                                                    {share.shared_with_username}
                                                </Text>
                                            </View>
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
                                                            ? '#4cd96420'
                                                            : colors.primary + '20',
                                                        borderColor: share.permission === 'edit'
                                                            ? '#4cd964'
                                                            : colors.primary,
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
                                            >
                                                {actionLoading === `remove-${share.id}`
                                                    ? <ActivityIndicator size="small" color="#e74c3c" />
                                                    : <Ionicons name="trash-outline" size={18} color="#e74c3c" />
                                                }
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Add Friends */}
                        {unsharedFriends.length > 0 && (
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colors.secondary }]}>
                                    Add Friends
                                </Text>
                                {unsharedFriends.map((friend) => (
                                    <View key={friend.friend_id} style={[styles.shareRow, { borderBottomColor: colors.border }]}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                            <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                                                <Text style={{ color: colors.primary, fontWeight: 'bold' }}>
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
                                                style={[styles.shareBtn, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
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
                                                style={[styles.shareBtn, { backgroundColor: '#4cd96420', borderColor: '#4cd964' }]}
                                            >
                                                <Ionicons name="create-outline" size={14} color="#4cd964" />
                                                <Text style={{ color: '#4cd964', fontSize: 12, fontWeight: '600', marginLeft: 4 }}>Edit</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Empty state */}
                        {friends.length === 0 && (
                            <View style={{ padding: 40, alignItems: 'center' }}>
                                <Ionicons name="people-outline" size={40} color={colors.icon} style={{ opacity: 0.5, marginBottom: 12 }} />
                                <Text style={{ color: colors.secondary, textAlign: 'center', fontSize: 15 }}>
                                    Add friends from Settings first to share sandboxes.
                                </Text>
                            </View>
                        )}

                        {friends.length > 0 && unsharedFriends.length === 0 && shares.length > 0 && (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text style={{ color: colors.secondary, textAlign: 'center', fontSize: 14, opacity: 0.7 }}>
                                    All friends have access to this sandbox.
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    closeBtn: {
        padding: 4,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
        opacity: 0.7,
    },
    shareRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
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
        borderRadius: 12,
        borderWidth: 1,
    },
    shareBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1,
    },
});
