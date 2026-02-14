
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, useColorScheme, View, ScrollView, Platform } from 'react-native';

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
                    <TouchableOpacity activeOpacity={1} style={[styles.modalView, { backgroundColor: theme.cardBackground }]} onPress={() => { }}>

                        {/* Header with Icon */}
                        <View style={styles.header}>
                            <View style={[styles.iconContainer, { backgroundColor: theme.background }]}>
                                <Ionicons name={isExpense ? "arrow-up" : "arrow-down"} size={30} color={isExpense ? theme.text : theme.primary} />
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color={theme.icon} />
                            </TouchableOpacity>
                        </View>

                        {/* Amount & Recipient */}
                        <View style={styles.mainInfo}>
                            <Text style={[styles.recipient, { color: theme.text }]}>{transaction.recipient}</Text>
                            <Text style={[
                                styles.amount,
                                { color: isExpense ? theme.text : theme.secondary }
                            ]}>
                                {isExpense ? '' : '+ '}{new Intl.NumberFormat('de-DE', { style: 'currency', currency: transaction.currency }).format(transaction.amount)}
                            </Text>
                            <Text style={[styles.date, { color: theme.icon }]}>
                                {new Date(transaction.date).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
                            </Text>
                        </View>

                        <View style={[styles.separator, { backgroundColor: theme.border }]} />

                        {/* Details Scroll */}
                        <ScrollView style={styles.detailsContainer}>
                            <Text style={[styles.label, { color: theme.icon }]}>Description</Text>
                            <Text style={[styles.description, { color: theme.text }]}>
                                {transaction.description || 'No additional details provided.'}
                            </Text>

                            <View style={{ height: 20 }} />

                            <Text style={[styles.label, { color: theme.icon }]}>Transaction ID</Text>
                            <Text style={[styles.tinyId, { color: theme.icon }]}>{transaction.id}</Text>
                        </ScrollView>

                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    centeredView: {
        width: '100%',
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalView: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        padding: 5,
    },
    mainInfo: {
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    recipient: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 8,
    },
    amount: {
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 8,
    },
    date: {
        fontSize: 14,
        opacity: 0.7,
    },
    separator: {
        height: 1,
        width: '100%',
        marginBottom: 20,
    },
    detailsContainer: {
        maxHeight: 200,
    },
    label: {
        fontSize: 12,
        textTransform: 'uppercase',
        fontWeight: '600',
        marginBottom: 6,
        opacity: 0.7,
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
    },
    tinyId: {
        fontSize: 10,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        opacity: 0.5,
    },
});
