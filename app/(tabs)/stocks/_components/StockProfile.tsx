import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stock } from '../_utils/types';
import { ProfileRow, formatLargeNumber } from './StockComponents';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface StockProfileProps {
    stock: Stock;
    theme: any;
    alwaysExpanded?: boolean;
    containerStyle?: any;
}

export default function StockProfile({ stock, theme, alwaysExpanded = false, containerStyle }: StockProfileProps) {
    const [isDescrExpanded, setIsDescrExpanded] = useState(false);

    const toggleDescription = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsDescrExpanded(!isDescrExpanded);
    };

    // If alwaysExpanded is true, we force it to be expanded
    const showFullDescription = alwaysExpanded || isDescrExpanded;

    return (
        <View>
            {/* Company Profile Section */}
            {/* Company Profile Section */}
            <View style={[styles.section, { marginBottom: 40 }, containerStyle]}>
                <View style={[styles.profileGrid, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 4 }]}>Company Profile</Text>

                    {stock.city && stock.country && <ProfileRow label="Headquarters" value={`${stock.city}, ${stock.country}`} theme={theme} />}
                    {stock.employees && <ProfileRow label="Employees" value={stock.employees.toLocaleString()} theme={theme} />}
                    {stock.website && <ProfileRow label="Website" value={stock.website || '-'} theme={theme} />}
                    {stock.sector && <ProfileRow label="Sector" value={stock.sector || '-'} theme={theme} />}
                    {stock.industry && <ProfileRow label="Industry" value={stock.industry || '-'} theme={theme} />}
                    {stock.overallRisk && (
                        <View style={{ marginTop: 8, paddingHorizontal: 4 }}>
                            <ProfileRow label="Overall Risk" value={stock.overallRisk.toString()} theme={theme} />
                            <View style={styles.riskGrid}>
                                <View style={styles.riskItem}>
                                    <Text style={[styles.riskLabel, { color: theme.icon }]}>Audit</Text>
                                    <Text style={[styles.riskValue, { color: theme.text }]}>{stock.auditRisk || '-'}</Text>
                                </View>
                                <View style={styles.riskItem}>
                                    <Text style={[styles.riskLabel, { color: theme.icon }]}>Board</Text>
                                    <Text style={[styles.riskValue, { color: theme.text }]}>{stock.boardRisk || '-'}</Text>
                                </View>
                                <View style={styles.riskItem}>
                                    <Text style={[styles.riskLabel, { color: theme.icon }]}>Comp.</Text>
                                    <Text style={[styles.riskValue, { color: theme.text }]}>{stock.compensationRisk || '-'}</Text>
                                </View>
                            </View>
                        </View>
                    )}
                </View>
            </View>

            {stock.description && (
                <View style={styles.section}>
                    <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border, marginTop: 16, overflow: 'hidden', paddingBottom: showFullDescription ? 16 : 0 }]}>
                        <Text
                            style={[styles.description, { color: theme.text, lineHeight: 22, fontSize: 14 }]}
                            numberOfLines={showFullDescription ? undefined : 6}
                        >
                            {stock.description}
                        </Text>

                        {!showFullDescription && (
                            <LinearGradient
                                colors={['transparent', theme.cardBackground]}
                                style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: 100,
                                    justifyContent: 'flex-end',
                                    alignItems: 'center',
                                    paddingBottom: 8,
                                }}
                            >
                                <TouchableOpacity
                                    onPress={toggleDescription}
                                    style={{
                                        flexDirection: 'row',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        paddingVertical: 12,
                                        paddingHorizontal: 16,
                                    }}
                                >
                                    <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 13, marginRight: 4 }}>
                                        Show More
                                    </Text>
                                    <Ionicons
                                        name="chevron-down"
                                        size={14}
                                        color={theme.primary}
                                    />
                                </TouchableOpacity>
                            </LinearGradient>
                        )}

                        {!alwaysExpanded && showFullDescription && (
                            <TouchableOpacity
                                onPress={toggleDescription}
                                style={{
                                    marginTop: 12,
                                    paddingTop: 12,
                                    borderTopWidth: 1,
                                    borderTopColor: 'rgba(255,255,255,0.05)',
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}
                            >
                                <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 13, marginRight: 4 }}>
                                    Show Less
                                </Text>
                                <Ionicons
                                    name="chevron-up"
                                    size={14}
                                    color={theme.primary}
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}

            {stock.officers && stock.officers.length > 0 && (
                <View style={styles.section}>
                    <Text style={[styles.subSectionTitle, { color: theme.text, marginBottom: 12 }]}>Key Executives</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, paddingHorizontal: 20 }}>
                        {stock.officers.map((officer, i) => (
                            <View key={i} style={[styles.officerCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                                <Text style={[styles.officerName, { color: theme.text }]} numberOfLines={1}>{officer.name}</Text>
                                <Text style={[styles.officerTitle, { color: theme.icon }]} numberOfLines={2}>{officer.title}</Text>
                                {officer.totalPay && <Text style={[styles.officerPay, { color: theme.primary }]}>${formatLargeNumber(officer.totalPay)}</Text>}
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}
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
    subSectionTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    profileGrid: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
    },
    riskGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    riskItem: {
        alignItems: 'center',
        flex: 1,
    },
    riskLabel: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    riskValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    card: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
    },
    description: {
        fontSize: 15,
        lineHeight: 24,
    },
    officerCard: {
        width: 160,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginRight: 12,
    },
    officerName: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
    },
    officerTitle: {
        fontSize: 12,
        height: 32,
        lineHeight: 16,
        marginBottom: 8,
    },
    officerPay: {
        fontSize: 13,
        fontWeight: '800',
    },
});
