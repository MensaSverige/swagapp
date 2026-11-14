import React from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, useColorScheme } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { filterHtml } from '@/features/common/functions/filterHtml';
import { extractLinks } from '@/features/common/functions/extractLinks';
import { themeColors, typeScale } from '../../styles/typeScale';

const openLink = (url: string) => {
  Linking.openURL(url).catch(err => console.error('Error opening link:', err));
};

/** The event's own text, with any links in it as tappable lines below. */
const EventDescription: React.FC<{ description?: string | null }> = ({ description }) => {
  const dark = useColorScheme() === 'dark';
  const text = description ? filterHtml(description) : '';
  if (!description || !text) return null;
  const links = extractLinks(description) ?? [];

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.text, { color: dark ? Colors.coolGray100 : '#11181C' }]}>{text}</ThemedText>
      {links.map((link, index) => (
        <TouchableOpacity key={index} onPress={() => openLink(link.url)} style={styles.link} accessibilityRole="link">
          <ThemedText style={[styles.linkText, { color: themeColors(dark).link }]}>
            {link.name}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 16 },
  text: { ...typeScale.body },
  link: { minHeight: 44, justifyContent: 'center' },
  linkText: { ...typeScale.link },
});

export default EventDescription;
