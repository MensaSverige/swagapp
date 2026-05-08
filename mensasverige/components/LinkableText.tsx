import React from 'react';
import { Text, Linking, StyleProp, TextStyle, useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

interface Props {
    children: string;
    style?: StyleProp<TextStyle>;
}

// Matches Swedish phone numbers (e.g. "0730-22 13 90") and email addresses
const LINKABLE = /(0\d{2,3}[-\s]\d{2,3}(?:[\s\d]*\d)?|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

function toUrl(text: string): string {
    return text.includes('@') ? `mailto:${text}` : `tel:${text.replace(/[\s-]/g, '')}`;
}

export function LinkableText({ children, style }: Props) {
    const colorScheme = useColorScheme();
    const linkColor = Colors[colorScheme ?? 'light'].primary500;
    const parts = children.split(LINKABLE);

    return (
        <Text style={style}>
            {parts.map((part, i) =>
                i % 2 === 1 ? (
                    <Text
                        key={i}
                        style={{ color: linkColor, textDecorationLine: 'underline' }}
                        onPress={() => Linking.openURL(toUrl(part))}
                        accessibilityRole="link"
                    >
                        {part}
                    </Text>
                ) : part || undefined
            )}
        </Text>
    );
}
