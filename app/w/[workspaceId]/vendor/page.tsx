"use client";

import { useStore } from "@/lib/store";
import { Card, CardBody, Button, EmptyState } from "@/components/ui";
import { VendorStatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatRupiah } from "@/lib/derive";
import { Vendor } from "@/lib/types";
import { Phone, Plus } from "lucide-react";

const STATUS_OPTIONS: Vendor["status"][] = [
  "research",
  "contacted",
  "negotiation",
  "booked",
  "dp_paid",
  "fully_paid",
  "cancelled",
];

export default function VendorPage() {
  const { vendors, updateVendorStatus } = useStore();

  if (vendors.length === 0) {
    return (
      <EmptyState
        icon="🏪"
        title="Belum ada vendor."
        description="Tambahkan vendor pertama untuk mulai melacak kontrak dan pembayaran."
        actionLabel="+ Tambah Vendor"
        onAction={() => {}}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm">
          <Plus size={15} /> Tambah Vendor
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vendors.map((v) => (
          <Card key={v.id}>
            <CardBody className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-ink">{v.name}</p>
                  <p className="text-xs text-ink-faint">{v.category}</p>
                </div>
                <VendorStatusBadge status={v.status} />
              </div>

              <div className="space-y-1 text-sm text-ink-soft">
                <div className="flex justify-between">
                  <span>Harga</span>
                  <span className="text-ink">{formatRupiah(v.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span>DP</span>
                  <span className="text-ink">{formatRupiah(v.dpAmount)}</span>
                </div>
                {v.paymentDeadline ? (
                  <div className="flex justify-between">
                    <span>Deadline</span>
                    <span className="text-ink">{formatDate(v.paymentDeadline)}</span>
                  </div>
                ) : null}
              </div>

              {v.contactPerson ? (
                <p className="flex items-center gap-1.5 text-xs text-ink-faint">
                  <Phone size={12} /> {v.contactPerson} · {v.phone}
                </p>
              ) : null}

              <select
                value={v.status}
                onChange={(e) => updateVendorStatus(v.id, e.target.value as Vendor["status"])}
                className="w-full rounded-md border border-surface-border px-2.5 py-1.5 text-sm text-ink-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
