import React from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, Dimensions, Text } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface BottomSheetProps {
    visible: boolean;
    onClose: () => void;
    height?: number;
    children: React.ReactNode;
}

export default function BottomSheet({ visible, onClose, height = 400, children }: BottomSheetProps) {
    const { colors } = useTheme();

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={{ flex: 1 }} />
            </TouchableOpacity>

            <View style={[styles.sheet, { height, backgroundColor: colors.cardBackground, borderTopColor: colors.border }]}>
                <View style={styles.handleContainer}>
                    <View style={[styles.handle, { backgroundColor: colors.border }]} />
                </View>
                {children}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        borderTopWidth: 1,
        // Shadow for elevation
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 10,
    },
    handleContainer: {
        alignItems: 'center',
        marginBottom: 10,
    },
    handle: {
        width: 40,
        height: 5,
        borderRadius: 2.5,
    },
});
