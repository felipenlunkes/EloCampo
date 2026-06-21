import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native'

interface BtnProps {
  label: string
  onPress?: () => void
  variant?: 'primary' | 'ghost' | 'danger'
  bg?: string
  border?: string
  color?: string
  loading?: boolean
  disabled?: boolean
  style?: object
}

export function Btn({ label, onPress, variant = 'primary', bg, border, color, loading, disabled, style }: BtnProps) {
  const vs = VARIANTS[variant]
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        s.btn,
        {
          backgroundColor: bg ?? vs.bg,
          borderColor: border ?? vs.border,
          opacity: disabled || loading ? 0.6 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color ?? vs.color} />
      ) : (
        <Text style={[s.text, { color: color ?? vs.color }]}>{label}</Text>
      )}
    </TouchableOpacity>
  )
}

const VARIANTS = {
  primary: { bg: '#2f6433', border: '#4a9050', color: '#d4f0d5' },
  ghost:   { bg: 'transparent', border: '#2a4a2c', color: '#6a9a6c' },
  danger:  { bg: '#3a1010', border: '#7a2020', color: '#e07070' },
}

const s = StyleSheet.create({
  btn: {
    height: 40,
    borderRadius: 8,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  text: { fontSize: 13, fontWeight: '600' },
})
