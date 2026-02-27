import { Card } from '@/components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import { Platform, ScrollView, Switch, Text, TextInput, TouchableOpacity, View, ActivityIndicator, LayoutAnimation, UIManager } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useMemo, useState, useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { createSettingsStyles } from '@/app/styles/screens/settings.styles';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { PinModal } from '@/components/ui/PinModal';
import TabScreenWrapper from '@/components/ui/TabScreenWrapper';
import FriendsSection from '@/components/FriendsSection';
import { fetchSettings, updateSettings } from '@/utils/api';
import { BACKGROUND_OPTIONS } from '@/constants/colorSchemes';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, runOnJS } from 'react-native-reanimated';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

function CollapsibleContainer({ expanded, children }: { expanded: boolean, children: React.ReactNode }) {
    const [measuredHeight, setMeasuredHeight] = useState(0);
    const height = useSharedValue(0);
    const opacity = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
        height: height.value,
        opacity: opacity.value,
        overflow: 'hidden',
    }));

    useEffect(() => {
        if (expanded) {
            height.value = withTiming(measuredHeight, { duration: 300 });
            opacity.value = withTiming(1, { duration: 300 });
        } else {
            height.value = withTiming(0, { duration: 250 });
            opacity.value = withTiming(0, { duration: 200 });
        }
    }, [expanded, measuredHeight]);

    return (
        <Animated.View style={animatedStyle}>
            <View
                onLayout={(e) => {
                    const h = e.nativeEvent.layout.height;
                    if (h > 0 && h !== measuredHeight) {
                        setMeasuredHeight(h);
                    }
                }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
            >
                {children}
            </View>
        </Animated.View>
    );
}

const BIOMETRICS_KEY = '@biometrics_enabled';

type SettingsTab = 'Preferences' | 'Account' | 'Friends' | 'Security' | 'Session';

const SETTINGS_SECTIONS: { id: SettingsTab; title: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'Preferences', title: 'Preferences', icon: 'options-outline' },
    { id: 'Account', title: 'Account', icon: 'person-outline' },
    { id: 'Friends', title: 'Friends', icon: 'people-outline' },
    { id: 'Security', title: 'Security', icon: 'shield-checkmark-outline' },
    { id: 'Session', title: 'Session', icon: 'log-out-outline' },
];

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const { colors: theme, toggleTheme, theme: currentTheme, colorScheme, setColorScheme, colorSchemes, backgroundStyle, setBackgroundStyle } = useTheme();
    const { logout } = useAuth();
    const styles = useMemo(() => createSettingsStyles(theme), [theme]);

    const [notifications, setNotifications] = useState(true);
    const [biometrics, setBiometrics] = useState(false);
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);
    const [biometricType, setBiometricType] = useState<LocalAuthentication.AuthenticationType | null>(null);

    const isDesktop = useIsDesktop();
    const [isPinModalVisible, setPinModalVisible] = useState(false);

    // API Key State
    const [geminiApiKey, setGeminiApiKey] = useState('');
    const [isSavingKey, setIsSavingKey] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Layout States
    const [expandedSection, setExpandedSection] = useState<SettingsTab | null>('Preferences');
    const [activeTab, setActiveTab] = useState<SettingsTab>('Preferences');

    useEffect(() => {
        loadSettings();
        if (Platform.OS !== 'web') {
            checkBiometrics();
        }
    }, []);

    const checkBiometrics = async () => {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            setIsBiometricSupported(hasHardware && isEnrolled);

            if (hasHardware && isEnrolled) {
                const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
                if (types.length > 0) setBiometricType(types[0]);
                const saved = await AsyncStorage.getItem(BIOMETRICS_KEY);
                if (saved === 'true') {
                    setBiometrics(true);
                }
            }
        } catch (e) {
            console.error("Biometrics check failed", e);
        }
    };

    const toggleBiometrics = async (value: boolean) => {
        if (value) {
            try {
                const result = await LocalAuthentication.authenticateAsync({
                    promptMessage: 'Authenticate to enable biometrics',
                    fallbackLabel: 'Use Passcode',
                });
                if (result.success) {
                    setBiometrics(true);
                    await AsyncStorage.setItem(BIOMETRICS_KEY, 'true');
                }
            } catch (e) {
                console.error("Biometrics auth failed", e);
            }
        } else {
            setBiometrics(false);
            await AsyncStorage.setItem(BIOMETRICS_KEY, 'false');
        }
    };

    const loadSettings = async () => {
        try {
            const data = await fetchSettings();
            if (data?.gemini_api_key) {
                setGeminiApiKey(data.gemini_api_key);
            }
        } catch (error) {
            console.error("Failed to load settings", error);
        }
    };

    const handleSaveApiKey = async () => {
        if (isSavingKey) return;
        setIsSavingKey(true);
        setSaveSuccess(false);
        try {
            await updateSettings({ gemini_api_key: geminiApiKey });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (error) {
            console.error("Failed to save API key", error);
        } finally {
            setIsSavingKey(false);
        }
    };

    const toggleSection = (section: SettingsTab) => {
        setExpandedSection(prev => prev === section ? null : section);
    };

    const renderApiKeyInput = () => (
        <View style={styles.apiInputContainer}>
            <Ionicons name="key-outline" size={22} color={theme.text} style={styles.icon} />
            <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.cardBackground }]}
                placeholder="Enter Gemini API Key..."
                placeholderTextColor={theme.icon}
                value={geminiApiKey}
                onChangeText={setGeminiApiKey}
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
            />
            <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: saveSuccess ? theme.secondary : theme.primary, opacity: isSavingKey ? 0.7 : 1 }]}
                onPress={handleSaveApiKey}
                disabled={isSavingKey}
            >
                {isSavingKey ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Text style={styles.saveButtonText}>
                        {saveSuccess ? 'Saved' : 'Save'}
                    </Text>
                )}
            </TouchableOpacity>
        </View>
    );

    const renderPreferencesCard = () => (
        <View style={{ paddingBottom: 8 }}>
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
                    <Ionicons name="color-palette-outline" size={22} color={theme.text} style={styles.icon} />
                    <Text style={[styles.settingLabel, { color: theme.text }]}>Color Scheme</Text>
                </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16, paddingBottom: 16 }}>
                {colorSchemes.map((scheme) => {
                    const isActive = scheme.id === colorScheme.id;
                    return (
                        <TouchableOpacity
                            key={scheme.id}
                            onPress={() => setColorScheme(scheme.id)}
                            style={{
                                alignItems: 'center',
                                gap: 6,
                                opacity: isActive ? 1 : 0.7,
                            }}
                        >
                            <View style={{
                                width: 44,
                                height: 44,
                                borderRadius: 22,
                                backgroundColor: scheme.preview,
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderWidth: isActive ? 3 : 1,
                                borderColor: isActive ? (currentTheme === 'dark' ? '#FFFFFF' : theme.primary) : (currentTheme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'),
                            }}>
                                {isActive && <Ionicons name="checkmark" size={22} color={currentTheme === 'dark' ? '#FFFFFF' : '#FFFFFF'} />}
                            </View>
                            <Text style={{ color: theme.text, fontSize: 11, fontWeight: isActive ? '700' : '400' }}>
                                {scheme.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.settingRow}>
                <View style={styles.settingLabelContainer}>
                    <Ionicons name="images-outline" size={22} color={theme.text} style={styles.icon} />
                    <Text style={[styles.settingLabel, { color: theme.text }]}>Dark Background Style</Text>
                </View>
            </View>
            <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}>
                {currentTheme === 'dark' ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {BACKGROUND_OPTIONS.map((option) => {
                            const isActive = backgroundStyle === option.id;
                            return (
                                <TouchableOpacity
                                    key={option.id}
                                    onPress={() => setBackgroundStyle(option.id)}
                                    style={{
                                        paddingHorizontal: 12,
                                        paddingVertical: 6,
                                        borderRadius: 16,
                                        backgroundColor: isActive ? theme.primary : theme.cardBackground,
                                        borderWidth: 1,
                                        borderColor: isActive ? theme.primary : theme.border,
                                    }}
                                >
                                    <Text style={{
                                        color: isActive ? '#fff' : theme.text,
                                        fontSize: 12,
                                        fontWeight: isActive ? '700' : '500'
                                    }}>
                                        {option.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ) : (
                    <Text style={{ color: theme.icon, fontSize: 12, fontStyle: 'italic' }}>
                        Switch to Dark Mode to customize background style.
                    </Text>
                )}
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.settingRow}>
                <View style={styles.settingLabelContainer}>
                    <Ionicons name="notifications-outline" size={22} color={theme.text} style={styles.icon} />
                    <Text style={[styles.settingLabel, { color: theme.text }]}>Notifications</Text>
                </View>
                <Switch value={notifications} onValueChange={setNotifications} trackColor={{ false: '#767577', true: theme.primary }} />
            </View>
        </View>
    );

    const renderAccountCard = () => (
        <View style={{ paddingBottom: 8 }}>
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
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            {renderApiKeyInput()}
        </View>
    );

    const renderFriendsCard = () => <FriendsSection theme={theme} styles={styles} />;

    const renderSecurityCard = () => (
        <View style={{ paddingBottom: 8 }}>
            {Platform.OS !== 'web' && !isDesktop && isBiometricSupported && (
                <>
                    <View style={styles.settingRow}>
                        <View style={styles.settingLabelContainer}>
                            <Ionicons name="finger-print-outline" size={22} color={theme.text} style={styles.icon} />
                            <Text style={[styles.settingLabel, { color: theme.text }]}>
                                {biometricType === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION ? 'Face ID' : 'Touch ID / Biometrics'}
                            </Text>
                        </View>
                        <Switch value={biometrics} onValueChange={toggleBiometrics} trackColor={{ false: '#767577', true: theme.primary }} />
                    </View>
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                </>
            )}
            <TouchableOpacity style={styles.settingRow} onPress={() => setPinModalVisible(true)}>
                <View style={styles.settingLabelContainer}>
                    <Ionicons name="lock-closed-outline" size={22} color={theme.text} style={styles.icon} />
                    <Text style={[styles.settingLabel, { color: theme.text }]}>Change PIN</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.icon} />
            </TouchableOpacity>
        </View>
    );

    const renderSessionCard = () => (
        <View style={{ paddingBottom: 8 }}>
            <TouchableOpacity style={styles.settingRow} onPress={logout}>
                <View style={styles.settingLabelContainer}>
                    <Ionicons name="log-out-outline" size={22} color="#e74c3c" style={styles.icon} />
                    <Text style={[styles.settingLabel, { color: '#e74c3c' }]}>Sign Out</Text>
                </View>
            </TouchableOpacity>
        </View>
    );

    const renderCardContent = (sectionId: SettingsTab) => {
        switch (sectionId) {
            case 'Preferences': return renderPreferencesCard();
            case 'Account': return renderAccountCard();
            case 'Friends': return renderFriendsCard();
            case 'Security': return renderSecurityCard();
            case 'Session': return renderSessionCard();
            default: return null;
        }
    };

    if (isDesktop) {
        return (
            <TabScreenWrapper>
                <View style={[styles.container, { backgroundColor: theme.background }]}>
                    <View style={styles.desktopContainer}>
                        <View style={[styles.desktopMainCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>

                            {/* Left Sidebar Nucleus */}
                            <View style={[styles.desktopSidebarArea, { borderColor: theme.border }]}>
                                <Text style={[styles.title, { color: theme.text, marginBottom: 40 }]}>Settings</Text>
                                {SETTINGS_SECTIONS.map((section) => {
                                    const isActive = activeTab === section.id;
                                    return (
                                        <TouchableOpacity
                                            key={section.id}
                                            style={[
                                                styles.desktopSidebarItem,
                                                { backgroundColor: isActive ? theme.primary : 'transparent' }
                                            ]}
                                            onPress={() => setActiveTab(section.id)}
                                        >
                                            <Ionicons name={section.icon} size={22} color={isActive ? '#fff' : theme.text} />
                                            <Text style={[styles.desktopSidebarItemText, { color: isActive ? '#fff' : theme.text }]}>
                                                {section.title}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                                <View style={{ flex: 1, minHeight: 40 }} />
                                <Text style={[styles.versionText, { color: theme.icon, textAlign: 'left', marginLeft: 16, marginTop: 'auto' }]}>Version 1.0.2 (Build 45)</Text>
                            </View>

                            {/* Right Content Area */}
                            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.desktopContentArea} showsVerticalScrollIndicator={false}>
                                <Text style={[styles.desktopContentHeader, { color: theme.text }]}>
                                    {SETTINGS_SECTIONS.find(s => s.id === activeTab)?.title}
                                </Text>
                                {activeTab === 'Friends' ? (
                                    renderCardContent(activeTab)
                                ) : (
                                    <Card style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                                        {renderCardContent(activeTab)}
                                    </Card>
                                )}
                            </ScrollView>

                        </View>
                    </View>

                    <PinModal
                        visible={isPinModalVisible}
                        onClose={() => setPinModalVisible(false)}
                        onSuccess={() => console.log('PIN updated successfully')}
                        mode="setup"
                    />
                </View>
            </TabScreenWrapper>
        );
    }

    return (
        <TabScreenWrapper>
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
                    </View>

                    {SETTINGS_SECTIONS.map((section) => {
                        const isExpanded = expandedSection === section.id;
                        return (
                            <View key={section.id} style={{ marginBottom: 12 }}>
                                <Card style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border, marginBottom: 0, overflow: 'hidden' }]}>
                                    <TouchableOpacity
                                        style={[styles.accordionHeader, { paddingVertical: 16, paddingHorizontal: 16, borderRadius: 0, marginBottom: 0 }]}
                                        onPress={() => toggleSection(section.id)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.accordionHeaderContent}>
                                            <Ionicons name={section.icon} size={24} color={isExpanded ? theme.primary : theme.text} />
                                            <Text style={[styles.accordionTitle, { color: isExpanded ? theme.primary : theme.text }]}>
                                                {section.title}
                                            </Text>
                                        </View>
                                        <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={isExpanded ? theme.primary : theme.icon} />
                                    </TouchableOpacity>

                                    <CollapsibleContainer expanded={isExpanded}>
                                        <View style={[styles.accordionContent, section.id === 'Friends' && { paddingHorizontal: 16 }]}>
                                            {section.id !== 'Friends' && <View style={[styles.divider, { backgroundColor: theme.border, marginLeft: 0 }]} />}
                                            {renderCardContent(section.id)}
                                        </View>
                                    </CollapsibleContainer>
                                </Card>
                            </View>
                        );
                    })}

                    <Text style={[styles.versionText, { color: theme.icon }]}>Version 1.0.2 (Build 45)</Text>
                </ScrollView>

                <PinModal
                    visible={isPinModalVisible}
                    onClose={() => setPinModalVisible(false)}
                    onSuccess={() => console.log('PIN updated successfully')}
                    mode="setup"
                />
            </View>
        </TabScreenWrapper>
    );
}
