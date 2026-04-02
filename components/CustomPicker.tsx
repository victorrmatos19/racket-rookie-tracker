import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

export interface PickerOption {
  label: string;
  value: string;
}

interface CustomPickerProps {
  options: PickerOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export const CustomPicker: React.FC<CustomPickerProps> = ({
  options,
  value,
  onValueChange,
  placeholder = 'Selecione...',
  label,
}) => {
  const [visible, setVisible] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity style={styles.trigger} onPress={() => setVisible(true)}>
        <Text style={selected ? styles.triggerText : styles.placeholder}>
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <SafeAreaView style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label ?? placeholder}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.option, item.value === value && styles.optionSelected]}
                  onPress={() => {
                    onValueChange(item.value);
                    setVisible(false);
                  }}
                >
                  <Text style={[styles.optionText, item.value === value && styles.optionTextSelected]}>
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <Ionicons name="checkmark" size={18} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 6,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  triggerText: {
    fontSize: 15,
    color: Colors.text,
    flex: 1,
  },
  placeholder: {
    fontSize: 15,
    color: Colors.textMuted,
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.muted,
  },
  optionSelected: {
    backgroundColor: Colors.primaryBg,
  },
  optionText: {
    fontSize: 15,
    color: Colors.text,
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
