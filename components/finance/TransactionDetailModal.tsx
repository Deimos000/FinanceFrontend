import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Modal, Text, TouchableOpacity, useColorScheme, View, ScrollView } from 'react-native';
import { createTransactionDetailModalStyles } from '@/app/styles/components/TransactionDetailModal.styles';

interface TransactionDetailModalProps {
    visible: boolean;
    onClose: () => void;
    transaction: {
        id: string;
        date: string; // ISO or formatted
        amount: number;
        currency: string;
        recipient: string; // Title / Name
        description: string; // Full remittance info
        category?: string;
    } | null;
}

export function TransactionDetailModal({ visible, onClose, transaction }: TransactionDetailModalProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const styles = useMemo(() => createTransactionDetailModalStyles(theme), [theme]);

    if (!transaction) return null;

    const isExpense = transaction.amount < 0;

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <View style={[styles.centeredView]}>
                    <TouchableOpacity activeOpacity={1} style={styles.modalView} onPress={() => { }}>

                        {/* Header with Icon */}
                        <View style={styles.header}>
                            <View style={styles.iconContainer}>
                                <Ionicons name={isExpense ? "arrow-up" : "arrow-down"} size={30} color={isExpense ? theme.text : theme.primary} />
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color={theme.icon} />
                            </TouchableOpacity>
                        </View>

                        {/* Amount & Recipient */}
                        <View style={styles.mainInfo}>
                            <Text style={styles.recipient}>{transaction.recipient}</Text>
                            <Text style={[
                                styles.amount,
                                { color: isExpense ? theme.text : theme.secondary }
                            ]}>
                                {isExpense ? '' : '+ '}{new Intl.NumberFormat('de-DE', { style: 'currency', currency: transaction.currency }).format(transaction.amount)}
                            </Text>
                            <Text style={styles.date}>
                                {new Date(transaction.date).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
                            </Text>
                        </View>

                        <View style={styles.separator} />

                        {/* Details Scroll */}
                        <ScrollView style={styles.detailsContainer}>
                            <Text style={styles.label}>Description</Text>
                            <Text style={styles.description}>
                                {transaction.description || 'No additional details provided.'}
                            </Text>

                            <View style={styles.spacer} />

                            <Text style={styles.label}>Transaction ID</Text>
                            <Text style={styles.tinyId}>{transaction.id}</Text>
                        </ScrollView>

                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}
