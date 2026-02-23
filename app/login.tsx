import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { BACKEND_URL } from '../utils/api';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Logo from '../components/ui/Logo';
import AnimatedLoginLogo from '../components/ui/AnimatedLoginLogo';

// Use the web-safe canvas version on web, and the Skia version on native.
// This avoids the Skia PictureRecorder error which occurs when Skia is used
// on web without the required LoadSkiaWeb() initialization.
const ParticleBackground = Platform.OS === 'web'
    ? require('../components/ui/ParticleBackground.web').default
    : require('../components/ui/ParticleBackground').default;

const { width } = Dimensions.get('window');

export default function LoginScreen() {
    const { setAuth } = useAuth();
    const router = useRouter();

    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { colors: themeColors } = useTheme();
    const primaryColor = themeColors.primary;

    const handleAuth = async () => {
        if (!username || !password) {
            setError('Please enter both username and password.');
            return;
        }

        setError('');
        setLoading(true);

        const endpoint = isLogin ? '/auth/login' : '/auth/register';

        try {
            const response = await fetch(`${BACKEND_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Authentication failed');
            }

            await setAuth(data.token, data.user_id, data.username);
            router.replace('/(tabs)');
        } catch (err: any) {
            setError(err.message || 'An error occurred during authentication.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            {/* Galaxy background — only on login screen */}
            <ParticleBackground />
            {/* Glassmorphic overlay for the form */}
            <View style={styles.centerWrapper}>
                <View style={styles.glassCard}>
                    <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={styles.glassContent}>
                        <View style={styles.header}>
                            <AnimatedLoginLogo size={180} style={styles.logo} />
                            <Text style={styles.title}>
                                {isLogin ? 'Welcome Back' : 'Create Account'}
                            </Text>
                            <Text style={styles.subtitle}>
                                Deimos Finance
                            </Text>
                        </View>

                        {error ? (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={20} color="#ff4444" />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Username</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="person-outline" size={20} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none', boxShadow: 'none' } as any]}
                                    value={username}
                                    onChangeText={setUsername}
                                    placeholder="Enter your username"
                                    placeholderTextColor="rgba(255,255,255,0.7)"
                                    autoCapitalize="none"
                                    selectionColor="#fff"
                                />
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Password</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.7)" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none', boxShadow: 'none' } as any]}
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="Enter your password"
                                    placeholderTextColor="rgba(255,255,255,0.7)"
                                    secureTextEntry
                                    selectionColor="#fff"
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleAuth}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>
                                {isLogin ? "Don't have an account? " : "Already have an account? "}
                            </Text>
                            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                                <Text style={styles.switchText}>
                                    {isLogin ? 'Sign Up' : 'Sign In'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        position: 'relative',
    },
    centerWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        zIndex: 10,
        // Allows pointer events to pass through background clicks to the canvas
        // (but only around the card, the card itself will capture pointers)
    },
    glassCard: {
        width: '100%',
        maxWidth: 420,
        borderRadius: 40,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.25)', // Unified border color to fix Android crash
        backgroundColor: 'rgba(25, 10, 40, 0.4)', // Slightly dark backdrop
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.1,
        shadowRadius: 30,
        elevation: 10,
    },
    glassContent: {
        padding: 40,
        zIndex: 1, // Ensures content sits above the absolute BlurView
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: 5,
        fontWeight: '500',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 68, 68, 0.1)',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 68, 68, 0.3)',
        marginBottom: 20,
    },
    errorText: {
        color: '#ff4444',
        marginLeft: 10,
        fontSize: 14,
        fontWeight: '500',
    },
    inputContainer: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 8,
        fontWeight: '600',
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    inputIcon: {
        paddingHorizontal: 16,
    },
    input: {
        flex: 1,
        height: 56,
        color: '#ffffff',
        fontSize: 16,
        paddingRight: 16,
    },
    button: {
        height: 56,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30,
        alignItems: 'center',
    },
    footerText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 15,
    },
    switchText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
    },
});
