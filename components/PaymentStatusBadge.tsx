import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type PaymentStatus = 'paid' | 'pending' | 'overdue';

const statusConfig: Record<PaymentStatus, { label: string; bg: string; color: string }> = {
  paid: { label: 'Pago', bg: '#f0fdf4', color: '#16a34a' },
  pending: { label: 'Pendente', bg: '#fffbeb', color: '#d97706' },
  overdue: { label: 'Atrasado', bg: '#fef2f2', color: '#dc2626' },
};

export const PaymentStatusBadge = ({ status }: { status: PaymentStatus }) => {
  const config = statusConfig[status] ?? statusConfig.pending;
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
