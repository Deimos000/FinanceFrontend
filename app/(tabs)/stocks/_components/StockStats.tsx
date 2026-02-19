import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stock } from '../_utils/types';
import { StatBox, formatPercent, formatLargeNumber } from './StockComponents';

interface StockStatsProps {
    stock: Stock;
    theme: any;
    isComparisonEnabled: boolean;
}

export function StockMarketData({ stock, theme, containerStyle }: { stock: Stock; theme: any; containerStyle?: any }) {
    return (
        <View style={[styles.section, containerStyle]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {stock.snapshotDate ? `Historical Data (${stock.snapshotDate})` : 'Market Data'}
            </Text>
            <View style={styles.statsGrid}>
                <StatBox label="OPEN" value={stock.open?.toFixed(2)} theme={theme} />
                <StatBox label="HIGH" value={stock.high?.toFixed(2)} theme={theme} />
                <StatBox label="LOW" value={stock.low?.toFixed(2)} theme={theme} />
                <StatBox label="CLOSE" value={stock.price?.toFixed(2)} theme={theme} />
                <StatBox label="PREV CLOSE" value={stock.previousClose?.toFixed(2)} theme={theme} />
                <StatBox label="52W HIGH" value={stock.fiftyTwoWeekHigh?.toFixed(2)} theme={theme} />
                <StatBox label="52W LOW" value={stock.fiftyTwoWeekLow?.toFixed(2)} theme={theme} />
                <StatBox
                    label="VOLUME"
                    value={formatLargeNumber(stock.volume)}
                    theme={theme}
                />
                <StatBox
                    label="MKT CAP"
                    value={formatLargeNumber(stock.marketCap)}
                    theme={theme}
                />
            </View>
        </View>
    );
}

export function StockValuation({ stock, theme, isComparisonEnabled, containerStyle }: StockStatsProps & { containerStyle?: any }) {
    return (
        <View style={[styles.section, containerStyle]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Valuation & Growth</Text>
            <View style={styles.statsGrid}>
                <StatBox
                    label="REVENUE"
                    value={formatLargeNumber(stock.comparison?.metrics.totalRevenue?.[0] || 0)}
                    theme={theme}
                    comparison={isComparisonEnabled ? stock.comparison?.metrics.totalRevenue : undefined}
                    years={stock.comparison?.years}
                />
                <StatBox
                    label="GROSS PROFIT"
                    value={formatLargeNumber(stock.comparison?.metrics.grossProfit?.[0] || 0)}
                    theme={theme}
                    comparison={isComparisonEnabled ? stock.comparison?.metrics.grossProfit : undefined}
                    years={stock.comparison?.years}
                />
                <StatBox
                    label="OP. INCOME"
                    value={formatLargeNumber(stock.comparison?.metrics.operatingIncome?.[0] || 0)}
                    theme={theme}
                    comparison={isComparisonEnabled ? stock.comparison?.metrics.operatingIncome : undefined}
                    years={stock.comparison?.years}
                />
                <StatBox
                    label="EBITDA"
                    value={formatLargeNumber(stock.comparison?.metrics.ebitda?.[0] || 0)}
                    theme={theme}
                    comparison={isComparisonEnabled ? stock.comparison?.metrics.ebitda : undefined}
                    years={stock.comparison?.years}
                />
                <StatBox
                    label="NET INCOME"
                    value={formatLargeNumber(stock.comparison?.metrics.netIncome?.[0] || 0)}
                    theme={theme}
                    comparison={isComparisonEnabled ? stock.comparison?.metrics.netIncome : undefined}
                    years={stock.comparison?.years}
                />
                <StatBox
                    label="EPS (BASIC)"
                    value={stock.comparison?.metrics.basicEPS?.[0]?.toFixed(2) || '-'}
                    theme={theme}
                    comparison={isComparisonEnabled ? stock.comparison?.metrics.basicEPS : undefined}
                    years={stock.comparison?.years}
                />
                <StatBox
                    label="EPS (DIL)"
                    value={stock.comparison?.metrics.dilutedEPS?.[0]?.toFixed(2) || '-'}
                    theme={theme}
                    comparison={isComparisonEnabled ? stock.comparison?.metrics.dilutedEPS : undefined}
                    years={stock.comparison?.years}
                />
                <StatBox label="EPS (FORWARD)" value={stock.forwardEps?.toFixed(2) || '-'} theme={theme} />
                <StatBox label="DIV YIELD" value={formatPercent(stock.dividendYield)} theme={theme} />
                <StatBox label="REV GROWTH" value={formatPercent(stock.revenueGrowth)} theme={theme} />
                <StatBox label="EARN GROWTH" value={formatPercent(stock.earningsGrowth)} theme={theme} />
                <StatBox label="BETA" value={stock.beta?.toFixed(2)} theme={theme} />
            </View>
        </View>
    );
}

export function StockRatios({ stock, theme, containerStyle }: { stock: Stock; theme: any; containerStyle?: any }) {
    return (
        <View style={[styles.section, containerStyle]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Valuation Ratios</Text>
            <View style={styles.statsGrid}>
                <StatBox label="P/E RATIO" value={stock.peRatio?.toFixed(2) || '-'} theme={theme} />
                <StatBox label="FORWARD P/E" value={stock.forwardPE?.toFixed(2) || '-'} theme={theme} />
                <StatBox label="P/B RATIO" value={stock.priceToBook?.toFixed(2) || '-'} theme={theme} />
                <StatBox label="P/S RATIO" value={stock.priceToSales?.toFixed(2) || '-'} theme={theme} />
                <StatBox label="EV/EBITDA" value={stock.enterpriseToEbitda?.toFixed(2) || '-'} theme={theme} />
                <StatBox label="PEG RATIO" value={stock.peRatioPEG?.toFixed(2) || '-'} theme={theme} />
            </View>
        </View>
    );
}

export function StockMargins({ stock, theme, containerStyle }: { stock: Stock; theme: any; containerStyle?: any }) {
    return (
        <View style={[styles.section, containerStyle]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Margins & Efficiency</Text>
            <View style={styles.statsGrid}>
                <StatBox label="GROSS MARGIN" value={formatPercent(stock.grossMargins)} theme={theme} />
                <StatBox label="OP. MARGIN" value={formatPercent(stock.operatingMargins)} theme={theme} />
                <StatBox label="PROFIT MARGIN" value={formatPercent(stock.profitMargins)} theme={theme} />
                <StatBox label="EBITDA MARGIN" value={formatPercent(stock.ebitdaMargins)} theme={theme} />
                <StatBox label="ROE" value={formatPercent(stock.returnOnEquity)} theme={theme} />
                <StatBox label="ROA" value={formatPercent(stock.returnOnAssets)} theme={theme} />
            </View>
        </View>
    );
}

export default function StockStats({ stock, theme, isComparisonEnabled }: StockStatsProps) {
    return (
        <View>
            <StockMarketData stock={stock} theme={theme} />
            <StockValuation stock={stock} theme={theme} isComparisonEnabled={isComparisonEnabled} />
            <StockRatios stock={stock} theme={theme} />
            <StockMargins stock={stock} theme={theme} />
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
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
});
