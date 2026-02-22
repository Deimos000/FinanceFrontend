import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import * as SecureStore from '@/utils/storage';
import { BlurView } from 'expo-blur';

interface PinModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: (pin: string) => void;
    mode: 'setup' | 'verify'; // 'setup' sets a new pin, 'verify' checks it
}

const MAX_PIN_LENGTH = 6;
const { width } = Dimensions.get('window');
const isDesktop = width > 768;

export function PinModal({ visible, onClose, onSuccess, mode }: PinModalProps) {
    const { colors: theme } = useTheme();
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [step, setStep] = useState<'enter' | 'confirm'>(mode === 'setup' ? 'enter' : 'confirm');
    const [error, setError] = useState(false);

    // For verify mode only
    const [savedPin, setSavedPin] = useState<string | null>(null);

    useEffect(() => {
        if (visible) {
            setPin('');
            setConfirmPin('');
            setError(false);
            setStep(mode === 'setup' ? 'enter' : 'confirm');

            if (mode === 'verify') {
                SecureStore.getItemAsync('user_pin').then(res => setSavedPin(res));
            }
        }
    }, [visible, mode]);

    const handlePress = (num: string) => {
        setError(false);
        const currentTarget = step === 'enter' ? pin : confirmPin;
        const setter = step === 'enter' ? setPin : setConfirmPin;

        if (currentTarget.length < MAX_PIN_LENGTH) {
            setter(currentTarget + num);
        }
    };

    const handleDelete = () => {
        setError(false);
        const currentTarget = step === 'enter' ? pin : confirmPin;
        const setter = step === 'enter' ? setPin : setConfirmPin;

        if (currentTarget.length > 0) {
            setter(currentTarget.slice(0, -1));
        }
    };

    const handleContinue = async () => {
        if (mode === 'setup') {
            if (step === 'enter') {
                if (pin.length < 4) {
                    setError(true);
                    return;
                }
                setStep('confirm');
            } else {
                if (pin === confirmPin) {
                    await SecureStore.setItemAsync('user_pin', pin);
                    onSuccess(pin);
                    onClose();
                } else {
                    setError(true);
                    setConfirmPin('');
                }
            }
        } else {
            // Verify Mode
            if (confirmPin === savedPin) {
                onSuccess(confirmPin);
                onClose();
            } else {
                setError(true);
                setConfirmPin('');
            }
        }
    };

    const renderDots = (value: string) => {
        const dots = [];
        // Determine length, usually 4 or 6. We dynamically show 6 dots but fill based on input.
        const lengthToRender = mode === 'setup' && step === 'enter' ? Math.max(4, pin.length + 1, 6) : (savedPin?.length || 6);

        for (let i = 0; i < (mode === 'setup' && step === 'enter' ? 6 : lengthToRender); i++) {
            const isFilled = i < value.length;
            dots.push(
                <View
                    key={i}
                    style={[
                        styles.dot,
                        {
                            borderColor: theme.text,
                            backgroundColor: isFilled ? theme.primary : 'transparent',
                            borderWidth: isFilled ? 0 : 2
                        },
                        error && { borderColor: theme.danger, backgroundColor: isFilled ? theme.danger : 'transparent' }
                    ]}
                />
            );
        }
        return <View style={styles.dotsContainer}>{dots}</View>;
    };

    // Calculate dynamic styles based on theme
    const numPadNumberStyle = [styles.numpadText, { color: theme.text }];
    const numPadButtonStyle = [styles.numpadButton, { backgroundColor: theme.cardBackground, borderColor: theme.border }];

    return (
        <Modal visible={visible} transparent animationType="fade">
            <BlurView intensity={70} tint="dark" style={styles.container}>
                <View style={[styles.content, { backgroundColor: theme.background, borderColor: theme.border }]}>

                    <View style={styles.header}>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.text} />
                        </TouchableOpacity>
                        <Text style={[styles.title, { color: theme.text }]}>
                            {mode === 'setup'
                                ? (step === 'enter' ? 'Set PIN' : 'Confirm PIN')
                                : 'Enter PIN'}
                        </Text>
                        <View style={{ width: 24 }} /> {/* Balances the close button */}
                    </View>

                    <Text style={[styles.subtitle, { color: theme.icon }]}>
                        {mode === 'setup'
                            ? (step === 'enter' ? 'Enter a 4-to-6 digit PIN.' : 'Re-enter your PIN to confirm.')
                            : 'Enter your current PIN to authenticate.'}
                    </Text>

                    {renderDots(step === 'enter' ? pin : confirmPin)}

                    {error && (
                        <Text style={[styles.errorText, { color: theme.danger }]}>
                            {mode === 'verify' ? 'Incorrect PIN.' : 'PINs do not match.'}
                        </Text>
                    )}

                    <View style={styles.numpad}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <TouchableOpacity
                                key={num}
                                style={numPadButtonStyle}
                                onPress={() => handlePress(num.toString())}
                            >
                                <Text style={numPadNumberStyle}>{num}</Text>
                            </TouchableOpacity>
                        ))}
                        <View style={styles.numpadEmpty} />
                        <TouchableOpacity
                            style={numPadButtonStyle}
                            onPress={() => handlePress('0')}
                        >
                            <Text style={numPadNumberStyle}>0</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[numPadButtonStyle, { backgroundColor: 'transparent', borderWidth: 0 }]}
                            onPress={handleDelete}
                        >
                            <Ionicons name="backspace-outline" size={28} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            { backgroundColor: theme.primary },
                            ((step === 'enter' && pin.length < 4) || (step === 'confirm' && confirmPin.length < 4)) && { opacity: 0.5 }
                        ]}
                        disabled={(step === 'enter' && pin.length < 4) || (step === 'confirm' && confirmPin.length < 4)}
                        onPress={handleContinue}
                    >
                        <Text style={styles.submitButtonText}>
                            {mode === 'setup' && step === 'enter' ? 'Continue' : 'Confirm'}
                        </Text>
                    </TouchableOpacity>

                </View>
            </BlurView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 4,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 30,
        textAlign: 'center',
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        height: 40,
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        marginHorizontal: 8,
    },
    errorText: {
        fontSize: 14,
        marginBottom: 20,
        fontWeight: '500',
    },
    numpad: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: 280,
        marginBottom: 30,
        gap: 15,
    },
    numpadButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    numpadText: {
        fontSize: 28,
        fontWeight: '500',
    },
    numpadEmpty: {
        width: 70,
        height: 70,
    },
    submitButton: {
        width: '100%',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
