
import { Colors } from '@/constants/Colors';
import { updateCashBalance } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Keyboard, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';

interface EditBalanceModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: () => void;
    currentBalance: number;
}

export function EditBalanceModal({ visible, onClose, onSave, currentBalance }: EditBalanceModalProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const [balance, setBalance] = useState('');

    useEffect(() => {
        if (visible) {
            setBalance(currentBalance.toString());
        }
    }, [visible, currentBalance]);

    const handleSave = async () => {
        if (!balance) return;

        const numBalance = parseFloat(balance.replace(',', '.'));
        if (isNaN(numBalance)) return;

        await updateCashBalance(numBalance);
        onSave();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <Pressable onPress={Keyboard.dismiss} style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: theme.cardBackground }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text }]}>Update Balance</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.icon} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.description, { color: theme.icon }]}>
                        Manually set the current amount of cash you have. This will overwrite the calculated balance.
                    </Text>

                    {/* Amount Input */}
                    <Text style={[styles.label, { color: theme.text }]}>Current Cash Amount</Text>
                    <TextInput
                        style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                        placeholder="0.00"
                        placeholderTextColor={theme.icon}
                        keyboardType="decimal-pad"
                        value={balance}
                        onChangeText={setBalance}
                        autoFocus
                    />

                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: theme.primary }]}
                        onPress={handleSave}
                    >
                        <Text style={styles.saveButtonText}>Update Balance</Text>
                    </TouchableOpacity>
                </View>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    container: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
    },
    description: {
        fontSize: 14,
        marginBottom: 20,
        lineHeight: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        fontSize: 18,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 20,
    },
    saveButton: {
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    }
});
