import { Colors } from '@/constants/Colors';
import { addCashTransaction } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useMemo } from 'react';
import { Keyboard, Modal, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { createCashTransactionModalStyles } from '@/app/styles/components/CashTransactionModal.styles';

interface CashTransactionModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: () => void;
}

export function CashTransactionModal({ visible, onClose, onSave }: CashTransactionModalProps) {
    const { colors: theme } = useTheme();
    const styles = useMemo(() => createCashTransactionModalStyles(theme), [theme]);

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
                    style={styles.container}
                    onPress={(e) => e.stopPropagation()}
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>Add Transaction</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.icon} />
                        </TouchableOpacity>
                    </View>

                    {/* Type Switcher */}
                    <View style={styles.segmentContainer}>
                        <TouchableOpacity
                            style={[styles.segment, type === 'expense' && styles.segmentActive]}
                            onPress={() => setType('expense')}
                        >
                            <Text style={[styles.segmentText, { color: type === 'expense' ? 'red' : theme.icon }]}>Expense</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.segment, type === 'income' && styles.segmentActive]}
                            onPress={() => setType('income')}
                        >
                            <Text style={[styles.segmentText, { color: type === 'income' ? 'green' : theme.icon }]}>Income</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Name Input */}
                    <Text style={styles.label}>Name (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Lunch, Taxi"
                        placeholderTextColor={theme.icon}
                        value={name}
                        onChangeText={setName}
                    />

                    {/* Amount Input */}
                    <Text style={styles.label}>Amount</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="0.00"
                        placeholderTextColor={theme.icon}
                        keyboardType="decimal-pad"
                        value={amount}
                        onChangeText={setAmount}
                        autoFocus
                    />

                    {/* Description Input */}
                    <Text style={styles.label}>Description (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. delicious burger"
                        placeholderTextColor={theme.icon}
                        value={description}
                        onChangeText={setDescription}
                    />

                    <TouchableOpacity
                        style={[styles.saveButton, { opacity: !amount ? 0.5 : 1 }]}
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
