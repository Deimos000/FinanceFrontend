import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stock } from '../_utils/types';
import { ProfileRow, formatLargeNumber } from './StockComponents';

interface FinancialHealthProps {
    stock: Stock;
    theme: any;
    isComparisonEnabled: boolean;
    containerStyle?: any;
}

export default function FinancialHealth({ stock, theme, isComparisonEnabled, containerStyle }: FinancialHealthProps) {
    return (
        <View style={[styles.section, containerStyle]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Financial Health</Text>
            <View style={[styles.profileGrid, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                <ProfileRow
                    label="Share Statistics"
                    value="" // Header-like behavior or empty
                    theme={theme}
                />
                <ProfileRow
                    label="Shares Outstanding"
                    value={formatLargeNumber(stock.sharesOutstanding)}
                    theme={theme}
                    comparison={isComparisonEnabled ? stock.comparison?.metrics.sharesOutstanding : undefined}
                    years={stock.comparison?.years}
                />
                <ProfileRow label="Float" value={formatLargeNumber(stock.floatShares)} theme={theme} />
                <ProfileRow label="Current Ratio" value={stock.currentRatio?.toFixed(2) ?? '-'} theme={theme} />
                <ProfileRow label="Quick Ratio" value={stock.quickRatio?.toFixed(2) ?? '-'} theme={theme} />

                <View style={{ height: 16 }} />

                <ProfileRow
                    label="Total Assets"
                    value={formatLargeNumber(stock.comparison?.metrics.totalAssets?.[0] || 0)}
                    theme={theme}
                    comparison={isComparisonEnabled ? stock.comparison?.metrics.totalAssets : undefined}
                    years={stock.comparison?.years}
                />
                <ProfileRow
                    label="Total Liabilities"
                    value={formatLargeNumber(stock.comparison?.metrics.totalLiabilities?.[0] || 0)}
                    theme={theme}
                    comparison={isComparisonEnabled ? stock.comparison?.metrics.totalLiabilities : undefined}
                    years={stock.comparison?.years}
                    isInverse
                />
                <ProfileRow
                    label="Total Cash"
                    value={formatLargeNumber(stock.comparison?.metrics.totalCash?.[0] || 0)}
                    theme={theme}
                    comparison={isComparisonEnabled ? stock.comparison?.metrics.totalCash : undefined}
                    years={stock.comparison?.years}
                />
                <ProfileRow
                    label="Total Debt"
                    value={formatLargeNumber(stock.comparison?.metrics.totalDebt?.[0] || 0)}
                    theme={theme}
                    comparison={isComparisonEnabled ? stock.comparison?.metrics.totalDebt : undefined}
                    years={stock.comparison?.years}
                    isInverse
                />
                <ProfileRow
                    label="Equity"
                    value={formatLargeNumber(stock.comparison?.metrics.equity?.[0] || 0)}
                    theme={theme}
                    comparison={isComparisonEnabled ? stock.comparison?.metrics.equity : undefined}
                    years={stock.comparison?.years}
                />
                <ProfileRow
                    label="Free Cash Flow"
                    value={formatLargeNumber(stock.comparison?.metrics.freeCashflow?.[0] || 0)}
                    theme={theme}
                    comparison={isComparisonEnabled ? stock.comparison?.metrics.freeCashflow : undefined}
                    years={stock.comparison?.years}
                />
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
    profileGrid: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
    },
});
