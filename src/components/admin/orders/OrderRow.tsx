"use client";

import { AlertTriangle, Check, ChevronDown, Loader2, Mail, MapPin, MessageCircle, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import type { AdminOrder } from "@/lib/admin/orders";
import { buildRecoveryWhatsAppLink, firstName, recoveryCheckoutUrl } from "@/lib/admin/cartRecovery";
import { formatNgn } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

import { OrderStatusSelect } from "./OrderStatusSelect";

export function OrderRow({
  order,
  expanded,
  onToggle,
  onDelete,
  deleting = false,
  onEmailReminder,
  emailState = "idle",
}: {
  order: AdminOrder;
  expanded: boolean;
  onToggle: () => void;
  /** Only offered for pending (unpaid) orders, which used to live on /admin/pending. */
  onDelete?: () => void;
  deleting?: boolean;
  /** Emails the customer a reminder to finish paying. Pending orders only. */
  onEmailReminder?: () => void;
  emailState?: "idle" | "sending" | "sent";
}) {
  const isPending = order.status === "pending";
  const canDelete = isPending && !!onDelete;
  const whatsappLink = isPending
    ? buildRecoveryWhatsAppLink(order, recoveryCheckoutUrl(process.env.NEXT_PUBLIC_APP_URL))
    : null;

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
                <div className="sticky left-6 max-w-[calc(100vw-5rem)] rounded-2xl bg-stone-50 p-5 outline outline-1 outline-stone-100 sm:static sm:max-w-none">
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
                      Delivers to: {order.delivery_area ? `${order.delivery_area} — ` : ""}{order.delivery_address}
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

                  {isPending ? (
                    <div className="mt-4 space-y-3 border-t border-stone-100 pt-4">
                      <p
                        className="text-xs text-stone-500"
                        style={{ fontFamily: "var(--font-inter)" }}
                      >
                        Checkout started but payment was never completed. Remind{" "}
                        {firstName(order.customer_name)} to finish it:
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {whatsappLink ? (
                          <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Message ${order.customer_name} on WhatsApp about order ${order.reference}`}
                            className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-green-700"
                            style={{ fontFamily: "var(--font-quicksand)" }}
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            WhatsApp
                          </a>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-4 py-2 text-xs font-bold text-stone-400"
                            title="No usable phone number on this order"
                            style={{ fontFamily: "var(--font-quicksand)" }}
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            No WhatsApp number
                          </span>
                        )}

                        {onEmailReminder ? (
                          <button
                            type="button"
                            aria-label={`Email ${order.customer_name} a reminder about order ${order.reference}`}
                            disabled={emailState !== "idle"}
                            onClick={onEmailReminder}
                            className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                            style={{ fontFamily: "var(--font-quicksand)" }}
                          >
                            {emailState === "sending" ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : emailState === "sent" ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <Mail className="h-3.5 w-3.5" />
                            )}
                            {emailState === "sending" ? "Sending…" : emailState === "sent" ? "Email sent" : "Email"}
                          </button>
                        ) : null}

                        {canDelete ? (
                          <button
                            type="button"
                            aria-label={`Delete order ${order.reference}`}
                            disabled={deleting}
                            onClick={onDelete}
                            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-red-600 sm:ml-auto transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                            style={{ fontFamily: "var(--font-quicksand)" }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {deleting ? "Deleting…" : "Delete unpaid order"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </motion.div>
            </td>
          </tr>
        ) : null}
      </AnimatePresence>
    </>
  );
}
