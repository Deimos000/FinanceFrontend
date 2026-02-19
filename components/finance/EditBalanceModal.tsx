import { Colors } from '@/constants/Colors';
import { updateCashBalance } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState, useMemo } from 'react';
import { Keyboard, Modal, Pressable, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { createEditBalanceModalStyles } from '@/app/styles/components/EditBalanceModal.styles';

interface EditBalanceModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: () => void;
    currentBalance: number;
}

export function EditBalanceModal({ visible, onClose, onSave, currentBalance }: EditBalanceModalProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const styles = useMemo(() => createEditBalanceModalStyles(theme), [theme]);

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
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Update Balance</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.icon} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.description}>
                        Manually set the current amount of cash you have. This will overwrite the calculated balance.
                    </Text>

                    {/* Amount Input */}
                    <Text style={styles.label}>Current Cash Amount</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="0.00"
                        placeholderTextColor={theme.icon}
                        keyboardType="decimal-pad"
                        value={balance}
                        onChangeText={setBalance}
                        autoFocus
                    />

                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                    >
                        <Text style={styles.saveButtonText}>Update Balance</Text>
                    </TouchableOpacity>
                </View>
            </Pressable>
        </Modal>
    );
}
