// Simplified order statuses (no delivery/shipping stages).
// The shop contacts the customer via WhatsApp to arrange the rest.
export const ORDER_STATUSES = ["recebido", "em_contato", "confirmado", "concluido", "cancelado"] as const;

export const STATUS_LABEL: Record<string, string> = {
  recebido: "Pedido recebido",
  em_contato: "Em contato",
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
  // legacy values from older orders, so they still display
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  reembolsado: "Reembolsado",
};
