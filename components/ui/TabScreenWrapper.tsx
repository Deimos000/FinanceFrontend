import React from 'react';
import { View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

interface Props {
    children: React.ReactNode;
    unmountOnBlur?: boolean;
}

export default function TabScreenWrapper({ children, unmountOnBlur = true }: Props) {
    const isFocused = useIsFocused();

    // If we should unmount it completely to save memory
    if (unmountOnBlur && !isFocused) {
        return null;
    }

    // Otherwise, keep it mounted but hide it so it doesn't pile up
    return (
        <View style={[{ flex: 1 }, !isFocused && { display: 'none' }]}>
            {children}
        </View>
    );
}
