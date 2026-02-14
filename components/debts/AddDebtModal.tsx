import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert, ScrollView, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { X, ChevronLeft } from 'lucide-react-native';
import { useDebtsDatabase } from '../../hooks/useDebtsDatabase';
import { useTheme } from '@/context/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AddDebtModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddDebtModal({ visible, onClose, onSuccess }: AddDebtModalProps) {
    const { isReady, getPeopleSummary, createPerson, createDebt } = useDebtsDatabase();
    const [step, setStep] = useState<'PERSON' | 'DETAILS'>('PERSON');
    const [personName, setPersonName] = useState('');
    const [people, setPeople] = useState<{ id: number, name: string }[]>([]);
    const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
    const [selectedPersonName, setSelectedPersonName] = useState('');
    const { colors: theme } = useTheme();

    // Debt Details
    const [amount, setAmount] = useState('');
    const [desc, setDesc] = useState('');
    const [type, setType] = useState<'OWED_TO_ME' | 'OWED_BY_ME'>('OWED_TO_ME');

    useEffect(() => {
        if (visible && isReady) {
            resetModal();
            fetchPeople();
        }
    }, [visible, isReady]);

    const resetModal = () => {
        setStep('PERSON');
        setPersonName('');
        setAmount('');
        setDesc('');
        setSelectedPersonId(null);
        setSelectedPersonName('');
        setType('OWED_TO_ME');
    };

    const fetchPeople = async () => {
        try {
            const data = await getPeopleSummary();
            setPeople(data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreatePerson = async () => {
        if (!personName.trim()) return;
        try {
            const data = await createPerson(personName.trim());
            if (data.id) {
                await fetchPeople();
                setSelectedPersonId(data.id);
                setSelectedPersonName(personName.trim());
                setPersonName('');
                setStep('DETAILS');
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to create person. Name may already exist.');
        }
    };

    const handleSelectPerson = (id: number, name: string) => {
        setSelectedPersonId(id);
        setSelectedPersonName(name);
        setStep('DETAILS');
    };

    const handleBackToPerson = () => {
        setStep('PERSON');
        setAmount('');
        setDesc('');
    };

    const handleSubmit = async () => {
        if (!amount || !selectedPersonId) return;

        try {
            await createDebt(
                selectedPersonId,
                type,
                parseFloat(amount),
                desc || 'Debt'
            );
            onSuccess();
            onClose();
        } catch (e) {
            Alert.alert('Error', 'Failed to save debt');
        }
    };

    const inputBaseStyle = {
        backgroundColor: theme.background,
        color: theme.text,
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            {/* Backdrop */}
            <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

            {/* Bottom Sheet */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={[styles.sheet, { backgroundColor: theme.cardBackground }]}
            >
                {/* Handle bar */}
                <View style={styles.handleContainer}>
                    <View style={[styles.handle, { backgroundColor: theme.icon }]} />
                </View>

                {/* Header */}
                <View style={[styles.header, { borderBottomColor: theme.border }]}>
                    {step === 'DETAILS' ? (
                        <TouchableOpacity onPress={handleBackToPerson} style={styles.headerBtn}>
                            <ChevronLeft color={theme.primary} size={22} />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.headerBtn} />
                    )}
                    <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                        {step === 'PERSON' ? 'New Debt' : selectedPersonName}
                    </Text>
                    <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
                        <X color={theme.icon} size={20} />
                    </TouchableOpacity>
                </View>

                {step === 'PERSON' ? (
                    <View style={styles.content}>
                        {/* New Person Input */}
                        <View style={styles.row}>
                            <TextInput
                                style={[styles.input, inputBaseStyle, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                                placeholder="Add new person..."
                                placeholderTextColor={theme.icon}
                                value={personName}
                                onChangeText={setPersonName}
                                onSubmitEditing={handleCreatePerson}
                            />
                            <TouchableOpacity
                                style={[styles.addBtn, { backgroundColor: theme.primary }, !personName.trim() && { backgroundColor: theme.border }]}
                                onPress={handleCreatePerson}
                                disabled={!personName.trim()}
                            >
                                <Text style={styles.addBtnText}>Add</Text>
                            </TouchableOpacity>
                        </View>

                        {people.length > 0 && (
                            <ScrollView style={styles.peopleScroll} showsVerticalScrollIndicator={false}>
                                <Text style={[styles.label, { color: theme.icon }]}>Or select existing:</Text>
                                {people.map(p => (
                                    <TouchableOpacity
                                        key={p.id}
                                        style={[styles.personItem, { backgroundColor: theme.background }]}
                                        onPress={() => handleSelectPerson(p.id, p.name)}
                                    >
                                        <Text style={[styles.personName, { color: theme.text }]}>{p.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                ) : (
                    <View style={styles.content}>
                        {/* Type Toggle */}
                        <View style={[styles.typeToggle, { backgroundColor: theme.background }]}>
                            <TouchableOpacity
                                style={[styles.typeOption, type === 'OWED_TO_ME' && { backgroundColor: theme.primary }]}
                                onPress={() => setType('OWED_TO_ME')}
                            >
                                <Text style={[styles.typeText, { color: theme.icon }, type === 'OWED_TO_ME' && { color: '#fff' }]}>Owes me</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeOption, type === 'OWED_BY_ME' && { backgroundColor: theme.primary }]}
                                onPress={() => setType('OWED_BY_ME')}
                            >
                                <Text style={[styles.typeText, { color: theme.icon }, type === 'OWED_BY_ME' && { color: '#fff' }]}>I owe</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Amount & Description in one row area */}
                        <View style={[styles.inputRow, { backgroundColor: theme.background }]}>
                            <TextInput
                                style={[styles.amountInput, { color: theme.text }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                                placeholder="0.00"
                                placeholderTextColor={theme.icon}
                                keyboardType="numeric"
                                value={amount}
                                onChangeText={setAmount}
                                autoFocus
                            />
                            <Text style={[styles.currency, { color: theme.icon }]}>€</Text>
                        </View>

                        <TextInput
                            style={[styles.input, inputBaseStyle, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                            placeholder="Description (optional)"
                            placeholderTextColor={theme.icon}
                            value={desc}
                            onChangeText={setDesc}
                        />

                        <TouchableOpacity
                            style={[styles.submitBtn, { backgroundColor: theme.primary }, !amount && { backgroundColor: theme.border }]}
                            onPress={handleSubmit}
                            disabled={!amount}
                        >
                            <Text style={styles.submitText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)'
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: SCREEN_HEIGHT * 0.55,
        paddingBottom: 34
    },
    handleContainer: {
        alignItems: 'center',
        paddingVertical: 12
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 14,
        borderBottomWidth: 1,
    },
    headerBtn: {
        width: 36,
        justifyContent: 'center',
        alignItems: 'center'
    },
    title: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center'
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 16
    },
    row: {
        flexDirection: 'row',
        gap: 8
    },
    input: {
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 12,
        fontSize: 15,
        borderWidth: 0
    },
    addBtn: {
        paddingHorizontal: 18,
        justifyContent: 'center',
        borderRadius: 12
    },
    addBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14
    },
    label: {
        fontSize: 13,
        marginBottom: 10,
        marginTop: 14
    },
    peopleScroll: {
        maxHeight: 180
    },
    personItem: {
        padding: 14,
        borderRadius: 12,
        marginBottom: 8
    },
    personName: {
        fontSize: 15
    },
    typeToggle: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 4,
        marginBottom: 16
    },
    typeOption: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10
    },
    typeText: {
        fontWeight: '600',
        fontSize: 14
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 14,
        marginBottom: 12
    },
    amountInput: {
        flex: 1,
        fontSize: 28,
        fontWeight: '600',
        paddingVertical: 14,
        borderWidth: 0
    },
    currency: {
        fontSize: 22,
        fontWeight: '500'
    },
    submitBtn: {
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8
    },
    submitText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600'
    }
});
