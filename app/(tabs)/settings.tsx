import { Card } from '@/components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import { Platform, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { createSettingsStyles } from '@/app/styles/screens/settings.styles';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { PinModal } from '@/components/ui/PinModal';
import TabScreenWrapper from '@/components/ui/TabScreenWrapper';
import FriendsSection from '@/components/FriendsSection';

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const { colors: theme, toggleTheme, theme: currentTheme } = useTheme();
    const { logout } = useAuth();
    const styles = useMemo(() => createSettingsStyles(theme), [theme]);

    const [notifications, setNotifications] = useState(true);
    const [biometrics, setBiometrics] = useState(false);
    const isDesktop = useIsDesktop();
    const [isPinModalVisible, setPinModalVisible] = useState(false);

    // ─── Desktop Layout ───
    if (isDesktop) {
        return (
            <TabScreenWrapper>
                <View style={[styles.container, { backgroundColor: theme.background }]}>
                    <ScrollView contentContainerStyle={{ paddingHorizontal: 32, paddingTop: 24, paddingBottom: 40, maxWidth: 600, alignSelf: 'center' as any, width: '100%' as any }}>
                        <Text style={[styles.title, { color: theme.text, fontSize: 32, marginBottom: 24 }]}>Settings</Text>

                        {/* Preferences */}
                        <Text style={[styles.sectionTitle, { color: theme.icon }]}>Preferences</Text>
                        <Card style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                            <View style={styles.settingRow}>
                                <View style={styles.settingLabelContainer}>
                                    <Ionicons name="moon-outline" size={22} color={theme.text} style={styles.icon} />
                                    <Text style={[styles.settingLabel, { color: theme.text }]}>Dark Mode</Text>
                                </View>
                                <Switch value={currentTheme === 'dark'} onValueChange={toggleTheme} trackColor={{ false: '#767577', true: theme.primary }} thumbColor={Platform.OS === 'ios' ? '#fff' : (currentTheme === 'dark' ? theme.primary : '#f4f3f4')} />
                            </View>
                            <View style={[styles.divider, { backgroundColor: theme.border }]} />
                            <View style={styles.settingRow}>
                                <View style={styles.settingLabelContainer}>
                                    <Ionicons name="notifications-outline" size={22} color={theme.text} style={styles.icon} />
                                    <Text style={[styles.settingLabel, { color: theme.text }]}>Notifications</Text>
                                </View>
                                <Switch value={notifications} onValueChange={setNotifications} trackColor={{ false: '#767577', true: theme.primary }} />
                            </View>
                        </Card>

                        {/* Account */}
                        <Text style={[styles.sectionTitle, { color: theme.icon }]}>Account</Text>
                        <Card style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                            <TouchableOpacity style={styles.settingRow}>
                                <View style={styles.settingLabelContainer}>
                                    <Ionicons name="person-outline" size={22} color={theme.text} style={styles.icon} />
                                    <Text style={[styles.settingLabel, { color: theme.text }]}>Profile</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={theme.icon} />
                            </TouchableOpacity>
                            <View style={[styles.divider, { backgroundColor: theme.border }]} />
                            <TouchableOpacity style={styles.settingRow}>
                                <View style={styles.settingLabelContainer}>
                                    <Ionicons name="card-outline" size={22} color={theme.text} style={styles.icon} />
                                    <Text style={[styles.settingLabel, { color: theme.text }]}>Linked Cards</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={theme.icon} />
                            </TouchableOpacity>
                        </Card>

                        {/* Friends */}
                        <Text style={[styles.sectionTitle, { color: theme.icon }]}>Friends</Text>
                        <FriendsSection theme={theme} styles={styles} />

                        {/* Security */}
                        <Text style={[styles.sectionTitle, { color: theme.icon }]}>Security</Text>
                        <Card style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                            <View style={styles.settingRow}>
                                <View style={styles.settingLabelContainer}>
                                    <Ionicons name="finger-print-outline" size={22} color={theme.text} style={styles.icon} />
                                    <Text style={[styles.settingLabel, { color: theme.text }]}>Face ID / Touch ID</Text>
                                </View>
                                <Switch value={biometrics} onValueChange={setBiometrics} trackColor={{ false: '#767577', true: theme.primary }} />
                            </View>
                            <View style={[styles.divider, { backgroundColor: theme.border }]} />
                            <TouchableOpacity
                                style={styles.settingRow}
                                onPress={() => setPinModalVisible(true)}
                            >
                                <View style={styles.settingLabelContainer}>
                                    <Ionicons name="lock-closed-outline" size={22} color={theme.text} style={styles.icon} />
                                    <Text style={[styles.settingLabel, { color: theme.text }]}>Change PIN</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={theme.icon} />
                            </TouchableOpacity>
                        </Card>

                        {/* Session */}
                        <Text style={[styles.sectionTitle, { color: theme.icon, marginTop: 24 }]}>Session</Text>
                        <Card style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                            <TouchableOpacity style={styles.settingRow} onPress={logout}>
                                <View style={styles.settingLabelContainer}>
                                    <Ionicons name="log-out-outline" size={22} color="#e74c3c" style={styles.icon} />
                                    <Text style={[styles.settingLabel, { color: '#e74c3c' }]}>Sign Out</Text>
                                </View>
                            </TouchableOpacity>
                        </Card>

                        <Text style={[styles.versionText, { color: theme.icon }]}>Version 1.0.2 (Build 45)</Text>
                    </ScrollView>
                </View>
            </TabScreenWrapper>
        );
    }

    // ─── Mobile Layout (unchanged) ───
    return (
        <TabScreenWrapper>
            <View style={[styles.container, { backgroundColor: theme.background }]}>

                <ScrollView contentContainerStyle={[styles.content]}>

                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
                    </View>

                    {/* Preferences */}
                    <Text style={[styles.sectionTitle, { color: theme.icon }]}>Preferences</Text>
                    <Card style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                        <View style={styles.settingRow}>
                            <View style={styles.settingLabelContainer}>
                                <Ionicons name="moon-outline" size={22} color={theme.text} style={styles.icon} />
                                <Text style={[styles.settingLabel, { color: theme.text }]}>Dark Mode</Text>
                            </View>
                            <Switch
                                value={currentTheme === 'dark'}
                                onValueChange={toggleTheme}
                                trackColor={{ false: '#767577', true: theme.primary }}
                                thumbColor={Platform.OS === 'ios' ? '#fff' : (currentTheme === 'dark' ? theme.primary : '#f4f3f4')}
                            />
                        </View>
                        <View style={[styles.divider, { backgroundColor: theme.border }]} />
                        <View style={styles.settingRow}>
                            <View style={styles.settingLabelContainer}>
                                <Ionicons name="notifications-outline" size={22} color={theme.text} style={styles.icon} />
                                <Text style={[styles.settingLabel, { color: theme.text }]}>Notifications</Text>
                            </View>
                            <Switch
                                value={notifications}
                                onValueChange={setNotifications}
                                trackColor={{ false: '#767577', true: theme.primary }}
                            />
                        </View>
                    </Card>

                    {/* Account */}
                    <Text style={[styles.sectionTitle, { color: theme.icon }]}>Account</Text>
                    <Card style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                        <TouchableOpacity style={styles.settingRow}>
                            <View style={styles.settingLabelContainer}>
                                <Ionicons name="person-outline" size={22} color={theme.text} style={styles.icon} />
                                <Text style={[styles.settingLabel, { color: theme.text }]}>Profile</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.icon} />
                        </TouchableOpacity>
                        <View style={[styles.divider, { backgroundColor: theme.border }]} />
                        <TouchableOpacity style={styles.settingRow}>
                            <View style={styles.settingLabelContainer}>
                                <Ionicons name="card-outline" size={22} color={theme.text} style={styles.icon} />
                                <Text style={[styles.settingLabel, { color: theme.text }]}>Linked Cards</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.icon} />
                        </TouchableOpacity>
                    </Card>

                    {/* Friends */}
                    <Text style={[styles.sectionTitle, { color: theme.icon }]}>Friends</Text>
                    <FriendsSection theme={theme} styles={styles} />

                    {/* Security */}
                    <Text style={[styles.sectionTitle, { color: theme.icon }]}>Security</Text>
                    <Card style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                        <View style={styles.settingRow}>
                            <View style={styles.settingLabelContainer}>
                                <Ionicons name="finger-print-outline" size={22} color={theme.text} style={styles.icon} />
                                <Text style={[styles.settingLabel, { color: theme.text }]}>Face ID / Touch ID</Text>
                            </View>
                            <Switch
                                value={biometrics}
                                onValueChange={setBiometrics}
                                trackColor={{ false: '#767577', true: theme.primary }}
                            />
                        </View>
                        <View style={[styles.divider, { backgroundColor: theme.border }]} />
                        <TouchableOpacity
                            style={styles.settingRow}
                            onPress={() => setPinModalVisible(true)}
                        >
                            <View style={styles.settingLabelContainer}>
                                <Ionicons name="lock-closed-outline" size={22} color={theme.text} style={styles.icon} />
                                <Text style={[styles.settingLabel, { color: theme.text }]}>Change PIN</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.icon} />
                        </TouchableOpacity>
                    </Card>

                    {/* Session */}
                    <Text style={[styles.sectionTitle, { color: theme.icon, marginTop: 24 }]}>Session</Text>
                    <Card style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                        <TouchableOpacity style={styles.settingRow} onPress={logout}>
                            <View style={styles.settingLabelContainer}>
                                <Ionicons name="log-out-outline" size={22} color="#e74c3c" style={styles.icon} />
                                <Text style={[styles.settingLabel, { color: '#e74c3c' }]}>Sign Out</Text>
                            </View>
                        </TouchableOpacity>
                    </Card>

                    <Text style={[styles.versionText, { color: theme.icon }]}>Version 1.0.2 (Build 45)</Text>

                </ScrollView>

                <PinModal
                    visible={isPinModalVisible}
                    onClose={() => setPinModalVisible(false)}
                    onSuccess={() => {
                        // PIN successfully changed
                        console.log('PIN updated successfully');
                    }}
                    mode="setup"
                />
            </View>
        </TabScreenWrapper>
    );
}
