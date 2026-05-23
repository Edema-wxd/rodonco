import type { ReactNode } from "react";

import { formatNgn } from "@/lib/admin/format";

type CountProps = {
  variant: "count";
  label: string;
  value: number;
  sublabel?: string;
};

type CurrencyProps = {
  variant: "currency";
  label: string;
  value: number;
  sublabel?: string;
};

type ListProps = {
  variant: "list";
  label: string;
  items: Array<{ name: string; qty: number }>;
};

type BreakdownProps = {
  variant: "breakdown";
  label: string;
  items: Array<{ label: string; count: number }>;
};

export type StatCardProps = CountProps | CurrencyProps | ListProps | BreakdownProps;

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  paid: { bg: "bg-green-100", text: "text-green-800", dot: "bg-green-500" },
  processing: { bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500" },
  delivered: { bg: "bg-stone-100", text: "text-stone-600", dot: "bg-stone-400" },
};

function statusStyle(s: string) {
  return STATUS_STYLES[s] ?? { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };
}

export function StatCard(props: StatCardProps) {
  const isDark = props.variant === "currency";

  return (
    <div
      className={[
        "rounded-tl-[32px] rounded-tr-2xl rounded-bl-2xl rounded-br-[32px] p-8 shadow-sm",
        isDark
          ? "bg-green-800"
          : "bg-white outline outline-1 outline-stone-200/60",
      ].join(" ")}
    >
      <p
        className={[
          "text-xs font-black uppercase tracking-wider",
          isDark ? "text-green-300/70" : "text-stone-400",
        ].join(" ")}
        style={{ fontFamily: "var(--font-quicksand)" }}
      >
        {props.label}
      </p>
      <div className="mt-4">{renderBody(props)}</div>
    </div>
  );
}

function renderBody(props: StatCardProps): ReactNode {
  if (props.variant === "count") {
    return (
      <>
        <p
          className="text-5xl font-black leading-none text-zinc-800"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          {Number(props.value).toLocaleString("en-NG")}
        </p>
        {props.sublabel ? (
          <p
            className="mt-3 text-sm text-stone-400"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            {props.sublabel}
          </p>
        ) : null}
        <div className="mt-5 flex items-center gap-2">
          <span className="h-1 w-12 rounded-full bg-red-600" />
          <span className="h-1 w-4 rounded-full bg-stone-200" />
          <span className="h-1 w-4 rounded-full bg-stone-200" />
        </div>
      </>
    );
  }

  if (props.variant === "currency") {
    return (
      <>
        <p
          className="text-4xl font-black leading-none text-lime-100"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          {formatNgn(props.value)}
        </p>
        {props.sublabel ? (
          <p
            className="mt-3 text-sm text-green-300/70"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            {props.sublabel}
          </p>
        ) : null}
        <div className="mt-5 flex items-center gap-2">
          <span className="h-1 w-4 rounded-full bg-green-600" />
          <span className="h-1 w-12 rounded-full bg-green-300" />
          <span className="h-1 w-4 rounded-full bg-green-600" />
        </div>
      </>
    );
  }

  if (props.variant === "list") {
    if (props.items.length === 0) {
      return (
        <p
          className="text-sm text-stone-400"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          No data yet
        </p>
      );
    }

    return (
      <ol className="space-y-3">
        {props.items.slice(0, 5).map((item, i) => (
          <li
            key={`${item.name}-${i}`}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-100 text-[10px] font-black text-stone-400"
                style={{ fontFamily: "var(--font-quicksand)" }}
              >
                {i + 1}
              </span>
              <span
                className="truncate text-sm font-semibold text-zinc-800"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {item.name}
              </span>
            </div>
            <span
              className="ml-4 shrink-0 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-600 tabular-nums"
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              × {item.qty}
            </span>
          </li>
        ))}
      </ol>
    );
  }

  // breakdown
  if (props.items.length === 0) {
    return (
      <p
        className="text-sm text-stone-400"
        style={{ fontFamily: "var(--font-inter)" }}
      >
        No orders yet
      </p>
    );
  }

  const total = props.items.reduce((sum, s) => sum + s.count, 0);

  return (
    <ul className="space-y-4">
      {props.items.map((item, i) => {
        const st = statusStyle(item.label);
        const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
        return (
          <li key={`${item.label}-${i}`} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold capitalize ${st.bg} ${st.text}`}
                style={{ fontFamily: "var(--font-quicksand)" }}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                {item.label}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="text-sm font-bold tabular-nums text-zinc-800"
                  style={{ fontFamily: "var(--font-quicksand)" }}
                >
                  {item.count}
                </span>
                <span
                  className="text-xs text-stone-400"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {pct}%
                </span>
              </div>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
              <div
                className={`h-full rounded-full ${st.dot}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
