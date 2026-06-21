import { View, Text, TextInput, StyleSheet } from 'react-native'

interface InputProps {
  label?: string
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
  secureTextEntry?: boolean
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad'
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  multiline?: boolean
  numberOfLines?: number
  bg?: string
  border?: string
  textColor?: string
  labelColor?: string
  style?: object
  editable?: boolean
}

export function Input({
  label, value, onChangeText, placeholder, secureTextEntry,
  keyboardType = 'default', autoCapitalize = 'sentences',
  multiline, numberOfLines,
  bg = '#111f12', border = '#2a4a2c', textColor = '#a8dca9',
  labelColor = '#6a9a6c', style, editable = true,
}: InputProps) {
  return (
    <View style={[{ marginBottom: 10 }, style]}>
      {label && <Text style={[s.label, { color: labelColor }]}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#3d6b3f"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        numberOfLines={numberOfLines}
        editable={editable}
        style={[
          s.input,
          { backgroundColor: bg, borderColor: border, color: textColor },
          multiline && { height: 64, textAlignVertical: 'top', paddingTop: 8 },
        ]}
      />
    </View>
  )
}

const s = StyleSheet.create({
  label: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  input: {
    height: 38,
    borderRadius: 7,
    borderWidth: 0.5,
    paddingHorizontal: 10,
    fontSize: 13,
  },
})
