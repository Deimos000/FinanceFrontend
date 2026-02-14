import { Card } from '@/components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import { Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useState } from 'react';

export default function SettingsScreen() {
    const { theme, toggleTheme, colors } = useTheme();
    const [notifications, setNotifications] = useState(true);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>


            <ScrollView contentContainerStyle={styles.content}>

                <Text style={[styles.sectionTitle, { color: colors.icon }]}>Preferences</Text>
                <Card style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingLabelContainer}>
                            <Ionicons name="moon-outline" size={22} color={colors.text} style={styles.icon} />
                            <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
                        </View>
                        <Switch
                            value={theme === 'dark'}
                            onValueChange={toggleTheme}
                            trackColor={{ false: '#767577', true: colors.primary }}
                            thumbColor={Platform.OS === 'ios' ? '#fff' : (theme === 'dark' ? colors.primary : '#f4f3f4')}
                        />
                    </View>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View style={styles.settingRow}>
                        <View style={styles.settingLabelContainer}>
                            <Ionicons name="notifications-outline" size={22} color={colors.text} style={styles.icon} />
                            <Text style={[styles.settingLabel, { color: colors.text }]}>Notifications</Text>
                        </View>
                        <Switch
                            value={notifications}
                            onValueChange={setNotifications}
                            trackColor={{ false: '#767577', true: colors.primary }}
                        />
                    </View>
                </Card>

                <Text style={[styles.sectionTitle, { color: colors.icon }]}>Account</Text>
                <Card style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingLabelContainer}>
                            <Ionicons name="person-outline" size={22} color={colors.text} style={styles.icon} />
                            <Text style={[styles.settingLabel, { color: colors.text }]}>Profile</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.icon} />
                    </View>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View style={styles.settingRow}>
                        <View style={styles.settingLabelContainer}>
                            <Ionicons name="card-outline" size={22} color={colors.text} style={styles.icon} />
                            <Text style={[styles.settingLabel, { color: colors.text }]}>Linked Cards</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.icon} />
                    </View>
                </Card>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
    },
    content: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 8,
        textTransform: 'uppercase',
    },
    card: {
        padding: 0,
        overflow: 'hidden',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    settingLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginRight: 12,
    },
    settingLabel: {
        fontSize: 16,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        marginLeft: 50, // Indent divider
    },
});
