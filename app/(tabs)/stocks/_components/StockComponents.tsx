import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const formatPercent = (num?: number) => {
    if (num === undefined || num === null) return '-';
    return `${(num * 100).toFixed(2)}%`;
};

export const formatLargeNumber = (num?: number) => {
    if (!num) return '-';
    const absNum = Math.abs(num);
    let result = '';
    if (absNum >= 1e12) result = (absNum / 1e12).toFixed(2) + 'T';
    else if (absNum >= 1e9) result = (absNum / 1e9).toFixed(2) + 'B';
    else if (absNum >= 1e6) result = (absNum / 1e6).toFixed(2) + 'M';
    else if (absNum >= 1e3) result = (absNum / 1e3).toFixed(2) + 'K';
    else result = absNum.toString();

    return num < 0 ? `-${result}` : result;
};

export const StatBox = ({ label, value, theme, comparison, years, isInverse }: {
    label: string,
    value?: string | number,
    theme: any,
    comparison?: (number | null)[],
    years?: string[],
    isInverse?: boolean
}) => {
    const hasComparison = comparison && comparison.length >= 2 && years && years.length >= 2;

    // Determine colors
    let mainColor = theme.text;
    let compColor = theme.icon;

    if (hasComparison) {
        const v1 = comparison[0] || 0;
        const v2 = comparison[1] || 0;
        const improved = isInverse ? v1 < v2 : v1 > v2;
        mainColor = improved ? theme.secondary : theme.danger;
        compColor = improved ? theme.danger : theme.secondary;
    }

    return (
        <View style={[styles.statBox, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <Text style={[styles.statLabel, { color: theme.icon }]}>{label}</Text>
            {hasComparison ? (
                <View>
                    <View style={styles.compRow}>
                        <Text style={[styles.statValue, { color: mainColor, fontSize: 13 }]} numberOfLines={1}>{formatLargeNumber(comparison[0] || 0)}</Text>
                        <Text style={[styles.yearLabel, { color: theme.icon }]}>{years[0]}</Text>
                    </View>
                    <View style={styles.compRow}>
                        <Text style={[styles.statValue, { color: compColor, fontSize: 13 }]} numberOfLines={1}>{formatLargeNumber(comparison[1] || 0)}</Text>
                        <Text style={[styles.yearLabel, { color: theme.icon }]}>{years[1]}</Text>
                    </View>
                </View>
            ) : (
                <Text style={[styles.statValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>{value || '-'}</Text>
            )}
        </View>
    );
};

export const ProfileRow = ({ label, value, theme, comparison, years, isInverse, isPercent }: {
    label: string,
    value: string | number,
    theme: any,
    comparison?: (number | null)[],
    years?: string[],
    isInverse?: boolean,
    isPercent?: boolean
}) => {
    const hasComparison = comparison && comparison.length >= 2 && years && years.length >= 2;

    // Determine colors
    let mainColor = theme.text;
    let compColor = theme.icon;

    if (hasComparison) {
        const v1 = comparison[0] || 0;
        const v2 = comparison[1] || 0;
        const improved = isInverse ? v1 < v2 : v1 > v2;
        mainColor = improved ? theme.secondary : theme.danger;
        compColor = improved ? theme.danger : theme.secondary;
    }

    const formatter = isPercent ? formatPercent : formatLargeNumber;

    return (
        <View style={[styles.profileRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.profileLabel, { color: theme.icon }]}>{label}</Text>
            {hasComparison ? (
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.profileValue, { color: mainColor }]}>{formatter(comparison[0] || 0)}</Text>
                        <Text style={[styles.yearLabelMini, { color: theme.icon }]}>{years[0]}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.profileValue, { color: compColor }]}>{formatter(comparison[1] || 0)}</Text>
                        <Text style={[styles.yearLabelMini, { color: theme.icon }]}>{years[1]}</Text>
                    </View>
                </View>
            ) : (
                <Text style={[styles.profileValue, { color: theme.text }]}>{value || '-'}</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    statBox: {
        width: '31.3%',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        aspectRatio: 1.1,
        justifyContent: 'center',
    },
    statLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    statValue: {
        fontSize: 15,
        fontWeight: '800',
    },
    compRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 2,
    },
    yearLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        opacity: 0.7,
    },
    yearLabelMini: {
        fontSize: 8,
        fontWeight: 'bold',
        opacity: 0.6,
        marginTop: -2,
    },
    profileRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    profileLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    profileValue: {
        fontSize: 14,
        fontWeight: '700',
    },
});
