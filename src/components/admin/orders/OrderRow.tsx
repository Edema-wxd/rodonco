"use client";

import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import type { AdminOrder } from "@/lib/admin/orders";
import { formatNgn } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

import { OrderStatusSelect } from "./OrderStatusSelect";

export function OrderRow({
  order,
  expanded,
  onToggle,
}: {
  order: AdminOrder;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        aria-expanded={expanded}
        className="cursor-pointer border-b last:border-b-0 hover:bg-gray-50"
      >
        <td className="px-4 py-3 font-mono text-xs font-medium text-gray-900">{order.reference}</td>
        <td className="px-4 py-3">
          <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
          <div className="text-xs text-gray-500">{order.customer_email}</div>
        </td>
        <td className="px-4 py-3 text-gray-900">{order.customer_phone}</td>
        <td className="px-4 py-3 text-gray-900">
          {new Date(order.created_at).toLocaleDateString("en-NG")}
        </td>
        <td className="px-4 py-3 text-gray-900" onClick={(e) => e.stopPropagation()}>
          <div className="text-sm font-medium">{order.status}</div>
          <OrderStatusSelect orderId={order.id} initial={order.status} />
        </td>
        <td className="px-4 py-3 text-gray-900 tabular-nums">{formatNgn(order.total_ngn)}</td>
        <td className="px-4 py-3 text-right">
          <ChevronDown
            className={cn(
              "h-4 w-4 text-gray-400 transition-transform duration-150",
              expanded && "rotate-180",
            )}
          />
        </td>
      </tr>

      <AnimatePresence initial={false}>
        {expanded ? (
          <tr>
            <td colSpan={7} className="bg-gray-50 px-4 pb-4 pt-0">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <ul className="space-y-1 pt-3">
                  {order.items.map((item) => (
                    <li key={item.id} className="text-sm text-gray-700">
                      {item.product_name}
                      {item.variant_label ? ` (${item.variant_label})` : ""}
                      {" "}× {item.quantity}
                      {item.prep_option ? ` — ${item.prep_option}` : ""}
                    </li>
                  ))}
                </ul>

                {order.allergy_notes ? (
                  <p className="mt-2 text-sm italic text-gray-500">
                    Allergy notes: {order.allergy_notes}
                  </p>
                ) : null}

                <p className="mt-2 text-sm text-gray-600">Delivers to: {order.delivery_address}</p>
              </motion.div>
            </td>
          </tr>
        ) : null}
      </AnimatePresence>
    </>
  );
}

