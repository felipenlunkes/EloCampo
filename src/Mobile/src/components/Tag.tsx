import { View, Text, StyleSheet } from 'react-native'
import { TAG } from '../theme/colors'

type TagVariant = 'green' | 'amber' | 'blue' | 'red'

interface TagProps {
  variant: TagVariant
  label: string
}

export function Tag({ variant, label }: TagProps) {
  const c = TAG[variant]
  return (
    <View style={[s.tag, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[s.text, { color: c.color }]}>{label}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  tag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, borderWidth: 0.5 },
  text: { fontSize: 10, fontWeight: '500' },
})
