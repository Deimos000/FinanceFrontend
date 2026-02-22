import React, { useCallback, useEffect, useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ActivityIndicator,
    Alert, Platform, StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import {
    searchUsers, sendFriendRequest, getFriends, getFriendRequests,
    respondToFriendRequest, removeFriend
} from '@/utils/api';

interface FriendsSectionProps {
    theme: any;
    styles: any;
}

export default function FriendsSection({ theme, styles }: FriendsSectionProps) {
    const [friends, setFriends] = useState<any[]>([]);
    const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
    const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        try {
            const [friendsData, requestsData] = await Promise.all([
                getFriends(),
                getFriendRequests()
            ]);
            setFriends(friendsData.friends || []);
            setIncomingRequests(requestsData.incoming || []);
            setOutgoingRequests(requestsData.outgoing || []);
        } catch (e) {
            console.error("Failed to load friends data:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSearch = async (text: string) => {
        setSearchQuery(text);
        if (text.length < 2) {
            setSearchResults([]);
            return;
        }
        setSearching(true);
        try {
            const data = await searchUsers(text);
            setSearchResults(data.users || []);
        } catch (e) {
            console.error("Search error:", e);
        } finally {
            setSearching(false);
        }
    };

    const handleSendRequest = async (username: string) => {
        setActionLoading(`send-${username}`);
        try {
            await sendFriendRequest(username);
            setSearchQuery('');
            setSearchResults([]);
            await loadData();
            if (Platform.OS === 'web') {
                window.alert('Friend request sent!');
            } else {
                Alert.alert('Success', 'Friend request sent!');
            }
        } catch (e: any) {
            const msg = e?.message || 'Failed to send request';
            if (Platform.OS === 'web') {
                window.alert(msg);
            } else {
                Alert.alert('Error', msg);
            }
        } finally {
            setActionLoading(null);
        }
    };

    const handleRespond = async (id: number, action: 'accept' | 'reject') => {
        setActionLoading(`respond-${id}`);
        try {
            await respondToFriendRequest(id, action);
            await loadData();
        } catch (e) {
            console.error("Respond error:", e);
        } finally {
            setActionLoading(null);
        }
    };

    const handleRemoveFriend = async (friendshipId: number, username: string) => {
        const doRemove = async () => {
            setActionLoading(`remove-${friendshipId}`);
            try {
                await removeFriend(friendshipId);
                await loadData();
            } catch (e) {
                console.error("Remove error:", e);
            } finally {
                setActionLoading(null);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`Remove ${username} from friends?`)) {
                doRemove();
            }
        } else {
            Alert.alert('Remove Friend', `Remove ${username} from friends?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: doRemove },
            ]);
        }
    };

    if (loading) {
        return (
            <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={theme.primary} />
            </View>
        );
    }

    return (
        <View>
            {/* Search Users */}
            <Card style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                <View style={[styles.settingRow, { paddingVertical: 12 }]}>
                    <View style={{ flex: 1 }}>
                        <TextInput
                            placeholder="Search users..."
                            placeholderTextColor={theme.secondary || theme.icon}
                            value={searchQuery}
                            onChangeText={handleSearch}
                            style={[
                                styles.searchInput,
                                {
                                    color: theme.text,
                                    fontSize: 16,
                                    padding: 8,
                                    backgroundColor: 'rgba(255,255,255,0.06)',
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: theme.border,
                                },
                                Platform.select({ web: { outlineStyle: 'none' } as any })
                            ]}
                        />
                    </View>
                </View>

                {/* Search Results */}
                {searching && (
                    <View style={{ padding: 12, alignItems: 'center' }}>
                        <ActivityIndicator size="small" color={theme.primary} />
                    </View>
                )}
                {searchResults.map((user) => {
                    const isFriend = friends.some(f => f.friend_id === user.id);
                    const isPending = outgoingRequests.some(r => r.addressee_id === user.id) ||
                        incomingRequests.some(r => r.requester_id === user.id);
                    return (
                        <View key={user.id}>
                            <View style={[localStyles.divider, { backgroundColor: theme.border }]} />
                            <View style={[styles.settingRow, { paddingVertical: 10 }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <View style={[localStyles.avatar, { backgroundColor: theme.primary + '30' }]}>
                                        <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 14 }}>
                                            {user.username.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <Text style={{ color: theme.text, fontSize: 15, fontWeight: '500' }}>{user.username}</Text>
                                </View>
                                {isFriend ? (
                                    <Text style={{ color: theme.primary, fontSize: 13, fontWeight: '600' }}>Friends ✓</Text>
                                ) : isPending ? (
                                    <Text style={{ color: theme.icon, fontSize: 13 }}>Pending</Text>
                                ) : (
                                    <TouchableOpacity
                                        onPress={() => handleSendRequest(user.username)}
                                        disabled={actionLoading === `send-${user.username}`}
                                        style={[localStyles.addButton, { backgroundColor: theme.primary }]}
                                    >
                                        {actionLoading === `send-${user.username}`
                                            ? <ActivityIndicator size="small" color="#fff" />
                                            : <><Ionicons name="person-add" size={14} color="#fff" /><Text style={{ color: '#fff', marginLeft: 4, fontWeight: '600', fontSize: 13 }}>Add</Text></>
                                        }
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    );
                })}
            </Card>

            {/* Pending Incoming Requests */}
            {incomingRequests.length > 0 && (
                <>
                    <Text style={[styles.sectionTitle, { color: theme.icon, marginTop: 16 }]}>
                        Friend Requests ({incomingRequests.length})
                    </Text>
                    <Card style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                        {incomingRequests.map((req, idx) => (
                            <View key={req.id}>
                                {idx > 0 && <View style={[localStyles.divider, { backgroundColor: theme.border }]} />}
                                <View style={[styles.settingRow, { paddingVertical: 10 }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <View style={[localStyles.avatar, { backgroundColor: '#FFA50030' }]}>
                                            <Ionicons name="person-add" size={14} color="#FFA500" />
                                        </View>
                                        <Text style={{ color: theme.text, fontSize: 15, fontWeight: '500' }}>{req.requester_username}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                        <TouchableOpacity
                                            onPress={() => handleRespond(req.id, 'accept')}
                                            disabled={actionLoading === `respond-${req.id}`}
                                            style={[localStyles.actionBtn, { backgroundColor: '#4cd964' }]}
                                        >
                                            <Ionicons name="checkmark" size={16} color="#fff" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => handleRespond(req.id, 'reject')}
                                            disabled={actionLoading === `respond-${req.id}`}
                                            style={[localStyles.actionBtn, { backgroundColor: '#e74c3c' }]}
                                        >
                                            <Ionicons name="close" size={16} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </Card>
                </>
            )}

            {/* Outgoing Requests */}
            {outgoingRequests.length > 0 && (
                <>
                    <Text style={[styles.sectionTitle, { color: theme.icon, marginTop: 16 }]}>
                        Sent Requests ({outgoingRequests.length})
                    </Text>
                    <Card style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                        {outgoingRequests.map((req, idx) => (
                            <View key={req.id}>
                                {idx > 0 && <View style={[localStyles.divider, { backgroundColor: theme.border }]} />}
                                <View style={[styles.settingRow, { paddingVertical: 10 }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <View style={[localStyles.avatar, { backgroundColor: theme.primary + '20' }]}>
                                            <Ionicons name="time-outline" size={14} color={theme.primary} />
                                        </View>
                                        <Text style={{ color: theme.text, fontSize: 15, fontWeight: '500' }}>{req.addressee_username}</Text>
                                    </View>
                                    <Text style={{ color: theme.icon, fontSize: 12 }}>Pending</Text>
                                </View>
                            </View>
                        ))}
                    </Card>
                </>
            )}

            {/* Friends List */}
            {friends.length > 0 && (
                <>
                    <Text style={[styles.sectionTitle, { color: theme.icon, marginTop: 16 }]}>
                        My Friends ({friends.length})
                    </Text>
                    <Card style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                        {friends.map((friend, idx) => (
                            <View key={friend.friendship_id}>
                                {idx > 0 && <View style={[localStyles.divider, { backgroundColor: theme.border }]} />}
                                <View style={[styles.settingRow, { paddingVertical: 10 }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <View style={[localStyles.avatar, { backgroundColor: theme.primary + '30' }]}>
                                            <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 14 }}>
                                                {friend.friend_username.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                        <Text style={{ color: theme.text, fontSize: 15, fontWeight: '500' }}>{friend.friend_username}</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => handleRemoveFriend(friend.friendship_id, friend.friend_username)}
                                        disabled={actionLoading === `remove-${friend.friendship_id}`}
                                    >
                                        {actionLoading === `remove-${friend.friendship_id}`
                                            ? <ActivityIndicator size="small" color={theme.icon} />
                                            : <Ionicons name="person-remove-outline" size={18} color="#e74c3c" />
                                        }
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </Card>
                </>
            )}

            {/* Empty State */}
            {friends.length === 0 && incomingRequests.length === 0 && searchResults.length === 0 && (
                <View style={{ padding: 20, alignItems: 'center' }}>
                    <Ionicons name="people-outline" size={32} color={theme.icon} style={{ marginBottom: 8, opacity: 0.5 }} />
                    <Text style={{ color: theme.icon, textAlign: 'center', opacity: 0.7, fontSize: 14 }}>
                        Search for users above to add friends
                    </Text>
                </View>
            )}
        </View>
    );
}

const localStyles = StyleSheet.create({
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    actionBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        marginLeft: 50,
    },
});
