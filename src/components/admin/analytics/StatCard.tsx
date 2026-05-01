import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
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

export function StatCard(props: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-sm uppercase tracking-wide text-gray-500">{props.label}</div>
        <div className="mt-2">{renderBody(props)}</div>
      </CardContent>
    </Card>
  );
}

function renderBody(props: StatCardProps): ReactNode {
  if (props.variant === "count") {
    return (
      <>
        <div className="text-[28px] font-semibold leading-tight text-gray-900 tabular-nums">
          {Number(props.value).toLocaleString("en-NG")}
        </div>
        {props.sublabel ? <div className="mt-1 text-sm text-gray-400">{props.sublabel}</div> : null}
      </>
    );
  }

  if (props.variant === "currency") {
    return (
      <>
        <div className="text-[28px] font-semibold leading-tight text-gray-900 tabular-nums">
          {formatNgn(props.value)}
        </div>
        {props.sublabel ? <div className="mt-1 text-sm text-gray-400">{props.sublabel}</div> : null}
      </>
    );
  }

  if (props.variant === "list") {
    if (props.items.length === 0) {
      return <div className="text-sm text-gray-400">No data yet</div>;
    }

    return (
      <ol className="space-y-2">
        {props.items.slice(0, 5).map((item, i) => (
          <li key={`${item.name}-${i}`} className="flex items-center justify-between text-sm text-gray-700">
            <span className="truncate">{item.name}</span>
            <span className="ml-2 tabular-nums text-gray-500">× {item.qty}</span>
          </li>
        ))}
      </ol>
    );
  }

  // breakdown
  if (props.items.length === 0) {
    return <div className="text-sm text-gray-400">No orders yet</div>;
  }

  return (
    <ul className="space-y-2">
      {props.items.map((item, i) => (
        <li key={`${item.label}-${i}`} className="flex items-center justify-between text-sm text-gray-700">
          <span className="capitalize">{item.label}</span>
          <span className="tabular-nums text-gray-500">{item.count}</span>
        </li>
      ))}
    </ul>
  );
}

