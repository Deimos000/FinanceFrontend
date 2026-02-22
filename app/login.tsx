import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { BACKEND_URL } from '../utils/api';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
    const { setAuth } = useAuth();
    const { theme } = useTheme();
    const router = useRouter();

    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const isDark = theme === 'dark';
    const bgColor = isDark ? '#1a1a2e' : '#f5f5f5';
    const textColor = isDark ? '#ffffff' : '#000000';
    const cardBg = isDark ? '#16213e' : '#ffffff';
    const inputBg = isDark ? '#0f3460' : '#f0f0f0';
    const primaryColor = '#e94560';

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
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            <View style={[styles.card, { backgroundColor: cardBg }]}>
                <View style={styles.header}>
                    <Ionicons name="wallet-outline" size={60} color={primaryColor} />
                    <Text style={[styles.title, { color: textColor }]}>
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </Text>
                    <Text style={[styles.subtitle, { color: isDark ? '#a0a0a0' : '#666666' }]}>
                        Finance Dashboard
                    </Text>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: textColor }]}>Username</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                        value={username}
                        onChangeText={setUsername}
                        placeholder="Enter your username"
                        placeholderTextColor={isDark ? '#aaaaaa' : '#888888'}
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: textColor }]}>Password</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter your password"
                        placeholderTextColor={isDark ? '#aaaaaa' : '#888888'}
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: primaryColor }]}
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
                    <Text style={{ color: isDark ? '#aaaaaa' : '#666666' }}>
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                    </Text>
                    <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                        <Text style={[styles.switchText, { color: primaryColor }]}>
                            {isLogin ? 'Sign Up' : 'Sign In'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 20,
        padding: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginTop: 15,
    },
    subtitle: {
        fontSize: 16,
        marginTop: 5,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        height: 50,
        borderRadius: 10,
        paddingHorizontal: 15,
        fontSize: 16,
    },
    button: {
        height: 50,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    errorText: {
        color: '#ff4444',
        marginBottom: 15,
        textAlign: 'center',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 25,
    },
    switchText: {
        fontWeight: 'bold',
    },
});
