import React from 'react';
import { Image, StyleSheet, View, TouchableOpacity, Linking } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

/**
 * Pull <img src="..." /> and ![](url) refs out of a feedback body and
 * render them inline as actual Images, with the surrounding text in
 * between. The same body string is what gets sent to GitHub, so the
 * raw tags also render there.
 */

const TAG_REGEX = /(<img[^>]*src=["']([^"']+)["'][^>]*\/?>(?:<\/img>)?)|(!\[[^\]]*\]\(([^)]+)\))/g;

type Segment = { type: 'text'; value: string } | { type: 'image'; url: string };

const parseBody = (body: string): Segment[] => {
  const segments: Segment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  TAG_REGEX.lastIndex = 0;
  while ((m = TAG_REGEX.exec(body)) !== null) {
    if (m.index > last) {
      segments.push({ type: 'text', value: body.slice(last, m.index) });
    }
    const url = m[2] ?? m[4];
    if (url) segments.push({ type: 'image', url });
    last = TAG_REGEX.lastIndex;
  }
  if (last < body.length) {
    segments.push({ type: 'text', value: body.slice(last) });
  }
  return segments;
};

type Props = {
  body: string;
  textStyle?: object;
};

const FeedbackBody: React.FC<Props> = ({ body, textStyle }) => {
  const segments = parseBody(body);
  return (
    <View>
      {segments.map((seg, idx) => {
        if (seg.type === 'image') {
          return (
            <TouchableOpacity
              key={`img-${idx}`}
              onPress={() => Linking.openURL(seg.url)}
              activeOpacity={0.85}>
              <Image
                source={{ uri: seg.url }}
                style={styles.image}
                resizeMode="contain"
              />
            </TouchableOpacity>
          );
        }
        const trimmed = seg.value.replace(/^\s*\n+/, '').replace(/\n+\s*$/, '');
        if (!trimmed) return null;
        return (
          <ThemedText key={`txt-${idx}`} style={[styles.text, textStyle]}>
            {trimmed}
          </ThemedText>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    lineHeight: 21,
  },
  image: {
    width: '100%',
    height: 240,
    borderRadius: 8,
    marginVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
});

export default FeedbackBody;
