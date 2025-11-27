import { Badge } from "@/components/ui/badge";

interface PaymentStatusBadgeProps {
  status: "pending" | "paid" | "overdue";
}

export const PaymentStatusBadge = ({ status }: PaymentStatusBadgeProps) => {
  const statusConfig = {
    paid: {
      label: "Pago",
      variant: "default" as const,
      className: "bg-green-500 hover:bg-green-600 text-white",
    },
    pending: {
      label: "Pendente",
      variant: "secondary" as const,
      className: "bg-yellow-500 hover:bg-yellow-600 text-white",
    },
    overdue: {
      label: "Atrasado",
      variant: "destructive" as const,
      className: "bg-red-500 hover:bg-red-600 text-white",
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
};
