import React from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Stock } from '../_utils/types';
import { Ionicons } from '@expo/vector-icons';

interface StockDetailProps {
    visible: boolean;
    stock: Stock | null;
    onClose: () => void;
}

export default function StockDetail({ visible, stock, onClose }: StockDetailProps) {
    const { colors } = useTheme();

    if (!stock) return null;

    return (
        <Modal animationType="slide" presentationStyle="pageSheet" visible={visible} onRequestClose={onClose}>
            <View style={[styles.container, { backgroundColor: '#000000' }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={28} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: colors.text }]}>{stock.symbol}</Text>
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <View style={[styles.priceCard, { backgroundColor: colors.cardBackground }]}>
                        <Text style={[styles.price, { color: colors.text }]}>${stock.price.toFixed(2)}</Text>
                        <Text style={{
                            color: stock.change >= 0 ? '#4cd964' : colors.danger,
                            fontSize: 16,
                            fontWeight: 'bold'
                        }}>
                            {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Stats</Text>
                        <View style={styles.statsGrid}>
                            <StatItem label="Open" value={stock.open?.toFixed(2)} colors={colors} />
                            <StatItem label="High" value={stock.high?.toFixed(2)} colors={colors} />
                            <StatItem label="Low" value={stock.low?.toFixed(2)} colors={colors} />
                            <StatItem label="Vol" value={stock.volume?.toLocaleString()} colors={colors} />
                            <StatItem label="Mkt Cap" value={stock.marketCap ? `$${(stock.marketCap / 1e9).toFixed(2)}B` : '-'} colors={colors} />
                            <StatItem label="P/E" value={stock.peRatio?.toFixed(2)} colors={colors} />
                        </View>
                    </View>

                    {stock.description && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
                            <Text style={{ color: colors.secondary, lineHeight: 20 }}>{stock.description}</Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        </Modal>
    );
}

const StatItem = ({ label, value, colors }: { label: string, value?: string, colors: any }) => (
    <View style={styles.statItem}>
        <Text style={{ color: colors.secondary, fontSize: 12 }}>{label}</Text>
        <Text style={{ color: colors.text, fontWeight: 'bold' }}>{value || '-'}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 15 },
    closeButton: { marginRight: 15 },
    title: { fontSize: 20, fontWeight: 'bold' },
    content: { padding: 20 },
    priceCard: { padding: 20, borderRadius: 12, marginBottom: 20, alignItems: 'center' },
    price: { fontSize: 32, fontWeight: 'bold', marginBottom: 5 },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    statItem: { width: '30%', padding: 5 }
});
