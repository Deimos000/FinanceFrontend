
import { Colors } from '@/constants/Colors';
import { addCashTransaction } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Keyboard, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';

interface CashTransactionModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: () => void;
}

export function CashTransactionModal({ visible, onClose, onSave }: CashTransactionModalProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const [amount, setAmount] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<'expense' | 'income'>('expense');

    const handleSave = async () => {
        if (!amount) return;

        const numAmount = parseFloat(amount.replace(',', '.'));
        if (isNaN(numAmount)) return;

        const finalAmount = type === 'expense' ? -Math.abs(numAmount) : Math.abs(numAmount);

        await addCashTransaction({
            amount: finalAmount,
            name,
            description,
        });

        // Reset and close
        setAmount('');
        setName('');
        setDescription('');
        setType('expense');
        onSave();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <Pressable onPress={Keyboard.dismiss} style={styles.overlay}>
                <Pressable
                    style={[styles.container, { backgroundColor: theme.cardBackground }]}
                    onPress={(e) => e.stopPropagation()}
                >
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text }]}>Add Transaction</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.icon} />
                        </TouchableOpacity>
                    </View>

                    {/* Type Switcher */}
                    <View style={[styles.segmentContainer, { backgroundColor: theme.background }]}>
                        <TouchableOpacity
                            style={[styles.segment, type === 'expense' && { backgroundColor: theme.cardBackground, shadowOpacity: 0.1 }]}
                            onPress={() => setType('expense')}
                        >
                            <Text style={[styles.segmentText, { color: type === 'expense' ? 'red' : theme.icon }]}>Expense</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.segment, type === 'income' && { backgroundColor: theme.cardBackground, shadowOpacity: 0.1 }]}
                            onPress={() => setType('income')}
                        >
                            <Text style={[styles.segmentText, { color: type === 'income' ? 'green' : theme.icon }]}>Income</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Name Input */}
                    <Text style={[styles.label, { color: theme.text }]}>Name (Optional)</Text>
                    <TextInput
                        style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                        placeholder="e.g. Lunch, Taxi"
                        placeholderTextColor={theme.icon}
                        value={name}
                        onChangeText={setName}
                    />

                    {/* Amount Input */}
                    <Text style={[styles.label, { color: theme.text }]}>Amount</Text>
                    <TextInput
                        style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                        placeholder="0.00"
                        placeholderTextColor={theme.icon}
                        keyboardType="decimal-pad"
                        value={amount}
                        onChangeText={setAmount}
                        autoFocus
                    />

                    {/* Description Input */}
                    <Text style={[styles.label, { color: theme.text }]}>Description (Optional)</Text>
                    <TextInput
                        style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                        placeholder="e.g. delicious burger"
                        placeholderTextColor={theme.icon}
                        value={description}
                        onChangeText={setDescription}
                    />

                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: theme.primary, opacity: !amount ? 0.5 : 1 }]}
                        onPress={handleSave}
                        disabled={!amount}
                    >
                        <Text style={styles.saveButtonText}>Add Transaction</Text>
                    </TouchableOpacity>
                </Pressable>
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
    segmentContainer: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 12,
        marginBottom: 20,
    },
    segment: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    segmentText: {
        fontSize: 16,
        fontWeight: '600',
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
