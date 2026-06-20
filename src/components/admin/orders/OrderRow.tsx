"use client";

import { ChevronDown, MapPin, AlertTriangle } from "lucide-react";
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
        className="cursor-pointer transition-colors hover:bg-stone-50/60"
      >
        <td className="px-6 py-4">
          <span
            className="font-bold text-red-600"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            {order.reference}
          </span>
        </td>

        <td className="px-6 py-4">
          <p
            className="font-semibold text-zinc-800"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            {order.customer_name}
          </p>
          <p className="text-xs text-stone-400">{order.customer_email}</p>
        </td>

        <td
          className="hidden px-6 py-4 text-sm text-stone-500 sm:table-cell"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          {order.customer_phone}
        </td>

        <td
          className="hidden px-6 py-4 text-sm text-stone-500 sm:table-cell"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          {new Date(order.created_at).toLocaleDateString("en-NG")}
        </td>

        <td className="px-6 py-4">
          <OrderStatusSelect orderId={order.id} initial={order.status} />
        </td>

        <td
          className="px-6 py-4 font-bold tabular-nums text-zinc-800"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          {formatNgn(order.total_ngn)}
        </td>

        <td className="px-6 py-4 text-right">
          <ChevronDown
            className={cn(
              "ml-auto h-4 w-4 text-stone-300 transition-transform duration-150",
              expanded && "rotate-180",
            )}
          />
        </td>
      </tr>

      <AnimatePresence initial={false}>
        {expanded ? (
          <tr>
            <td colSpan={7} className="px-6 pb-5 pt-0">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="rounded-2xl bg-stone-50 p-5 outline outline-1 outline-stone-100">
                  {/* Line items */}
                  <ul className="space-y-2">
                    {order.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span
                          className="font-medium text-zinc-800"
                          style={{ fontFamily: "var(--font-inter)" }}
                        >
                          {item.product_name}
                          {item.variant_label ? ` (${item.variant_label})` : ""}
                          {item.prep_option ? (
                            <span className="ml-1 text-stone-400">— {item.prep_option}</span>
                          ) : null}
                        </span>
                        <span
                          className="ml-4 tabular-nums text-stone-500"
                          style={{ fontFamily: "var(--font-inter)" }}
                        >
                          ×{item.quantity}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 space-y-2 border-t border-stone-100 pt-4">
                    <p
                      className="flex items-start gap-1.5 text-xs text-stone-500"
                      style={{ fontFamily: "var(--font-inter)" }}
                    >
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-400" />
                      Delivers to: {order.delivery_address}
                    </p>

                    {order.allergy_notes ? (
                      <p
                        className="flex items-start gap-1.5 text-xs text-amber-700"
                        style={{ fontFamily: "var(--font-inter)" }}
                      >
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        Allergy notes: {order.allergy_notes}
                      </p>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            </td>
          </tr>
        ) : null}
      </AnimatePresence>
    </>
  );
}
