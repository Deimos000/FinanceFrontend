import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stock } from '../_utils/types';

interface AnalystRatingsProps {
    stock: Stock;
    theme: any;
    containerStyle?: any;
}

export default function AnalystRatings({ stock, theme, containerStyle }: AnalystRatingsProps) {
    if (!stock.recommendationKey) return null;

    return (
        <View style={[styles.section, containerStyle]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Analyst Ratings</Text>
            <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                <View style={styles.ratingHeader}>
                    <View>
                        <Text style={[styles.ratingLabel, { color: theme.icon }]}>Recommendation</Text>
                        <Text style={[styles.ratingValue, { color: theme.primary, textTransform: 'capitalize' }]}>
                            {stock.recommendationKey.replace('_', ' ')}
                        </Text>
                    </View>
                    <View style={styles.ratingBadge}>
                        <Text style={styles.ratingBadgeText}>{stock.recommendationMean?.toFixed(1)}</Text>
                    </View>
                </View>

                <View style={styles.targetGrid}>
                    <View style={styles.targetItem}>
                        <Text style={[styles.targetLabel, { color: theme.icon }]}>Mean Target</Text>
                        <Text style={[styles.targetValue, { color: theme.text }]}>${stock.targetMeanPrice?.toFixed(2)}</Text>
                    </View>
                    <View style={styles.targetItem}>
                        <Text style={[styles.targetLabel, { color: theme.icon }]}>High Target</Text>
                        <Text style={[styles.targetValue, { color: theme.text }]}>${stock.targetHighPrice?.toFixed(2)}</Text>
                    </View>
                    <View style={styles.targetItem}>
                        <Text style={[styles.targetLabel, { color: theme.icon }]}>Low Target</Text>
                        <Text style={[styles.targetValue, { color: theme.text }]}>${stock.targetLowPrice?.toFixed(2)}</Text>
                    </View>
                </View>
                <Text style={[styles.analystCount, { color: theme.icon }]}>Based on {stock.numberOfAnalystOpinions} analyst opinions</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        paddingHorizontal: 20,
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    card: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
    },
    ratingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    ratingLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    ratingValue: {
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    ratingBadge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    ratingBadgeText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '800',
    },
    targetGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    targetItem: {
        flex: 1,
    },
    targetLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 4,
    },
    targetValue: {
        fontSize: 16,
        fontWeight: '700',
    },
    analystCount: {
        fontSize: 12,
        fontStyle: 'italic',
        marginTop: 8,
    },
});
