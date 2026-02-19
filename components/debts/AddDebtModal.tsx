import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { X, ChevronLeft } from 'lucide-react-native';
import { useDebtsDatabase } from '../../hooks/useDebtsDatabase';
import { useTheme } from '@/context/ThemeContext';
import { createAddDebtModalStyles } from '@/app/styles/components/AddDebtModal.styles';

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
    const styles = useMemo(() => createAddDebtModalStyles(theme), [theme]);

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

    const inputOutlineStyle = Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {};

    return (
        <Modal visible={visible} animationType="slide" transparent>
            {/* Backdrop */}
            <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

            {/* Bottom Sheet */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.sheet}
            >
                {/* Handle bar */}
                <View style={styles.handleContainer}>
                    <View style={styles.handle} />
                </View>

                {/* Header */}
                <View style={styles.header}>
                    {step === 'DETAILS' ? (
                        <TouchableOpacity onPress={handleBackToPerson} style={styles.headerBtn}>
                            <ChevronLeft color={theme.primary} size={22} />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.headerBtn} />
                    )}
                    <Text style={styles.title} numberOfLines={1}>
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
                                style={[styles.input, inputOutlineStyle]}
                                placeholder="Add new person..."
                                placeholderTextColor={theme.icon}
                                value={personName}
                                onChangeText={setPersonName}
                                onSubmitEditing={handleCreatePerson}
                            />
                            <TouchableOpacity
                                style={[styles.addBtn, !personName.trim() && styles.addBtnDisabled]}
                                onPress={handleCreatePerson}
                                disabled={!personName.trim()}
                            >
                                <Text style={styles.addBtnText}>Add</Text>
                            </TouchableOpacity>
                        </View>

                        {people.length > 0 && (
                            <ScrollView style={styles.peopleScroll} showsVerticalScrollIndicator={false}>
                                <Text style={styles.label}>Or select existing:</Text>
                                {people.map(p => (
                                    <TouchableOpacity
                                        key={p.id}
                                        style={styles.personItem}
                                        onPress={() => handleSelectPerson(p.id, p.name)}
                                    >
                                        <Text style={styles.personName}>{p.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                ) : (
                    <View style={styles.content}>
                        {/* Type Toggle */}
                        <View style={styles.typeToggle}>
                            <TouchableOpacity
                                style={[styles.typeOption, type === 'OWED_TO_ME' && styles.typeOptionActive]}
                                onPress={() => setType('OWED_TO_ME')}
                            >
                                <Text style={[styles.typeText, type === 'OWED_TO_ME' && styles.typeTextActive]}>Owes me</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeOption, type === 'OWED_BY_ME' && styles.typeOptionActive]}
                                onPress={() => setType('OWED_BY_ME')}
                            >
                                <Text style={[styles.typeText, type === 'OWED_BY_ME' && styles.typeTextActive]}>I owe</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Amount & Description in one row area */}
                        <View style={styles.inputRow}>
                            <TextInput
                                style={[styles.amountInput, inputOutlineStyle]}
                                placeholder="0.00"
                                placeholderTextColor={theme.icon}
                                keyboardType="numeric"
                                value={amount}
                                onChangeText={setAmount}
                                autoFocus
                            />
                            <Text style={styles.currency}>€</Text>
                        </View>

                        <TextInput
                            style={[styles.input, inputOutlineStyle]}
                            placeholder="Description (optional)"
                            placeholderTextColor={theme.icon}
                            value={desc}
                            onChangeText={setDesc}
                        />

                        <TouchableOpacity
                            style={[styles.submitBtn, !amount && styles.submitBtnDisabled]}
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
