"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import type { RetencionDetalleRecord, RetencionRecord } from "./types";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const currency = new Intl.NumberFormat("es-HN", {
  style: "currency",
  currency: "HNL",
  minimumFractionDigits: 2,
});

type CaiOption = {
  id: string;
  cai: string;
  bloque: string | null;
  prefijo: string | null;
  correlativo_actual: number | null;
};

const formatCorrelativo = (cai?: CaiOption) => {

  console.log({ Cai: cai })

  if (!cai) return "";
  const seq = String(cai.correlativo_actual ?? 0).padStart(8, "0");
  return `${cai.prefijo}-${seq}`
};

const CONCEPTOS = [
  { descripcion: "Ret por Servicios Honorarios Art # 50 I.S.R", porcentaje: 12.5 },
  { descripcion: "Ret Anticipo 1% Art # 19 DEC # 17 - 2010", porcentaje: 1 },
  { descripcion: "Ret I.S.V Articulo # 8 I.S.V", porcentaje: 15 },
] as const;

const calcImporte = (base: string, porcentaje: number) => {
  const b = Number(base);
  if (!b || !porcentaje) return "";
  return ((b * porcentaje) / 100).toFixed(2);
};

type DetalleRow = {
  id: number;
  descripcion: string;
  porcentaje: number;
  base_imponible: string;
  importe_total: string;
};

let rowSeq = 0;
const newRow = (): DetalleRow => ({
  id: rowSeq++,
  descripcion: "",
  porcentaje: 0,
  base_imponible: "",
  importe_total: "",
});

const rowFromDetalle = (d: RetencionDetalleRecord): DetalleRow => {
  const concepto = CONCEPTOS.find((c) => c.descripcion === d.descripcion);
  return {
    id: rowSeq++,
    descripcion: d.descripcion ?? "",
    porcentaje: concepto?.porcentaje ?? 0,
    base_imponible: String(d.base_imponible ?? ""),
    importe_total: String(d.importe_total ?? ""),
  };
};

export function RetencionForm({
  action,
  cais,
  retencion,
  detalles,
  submitLabel = "Guardar",
}: {
  action: (formData: FormData) => void;
  cais: CaiOption[];
  retencion?: RetencionRecord;
  detalles?: RetencionDetalleRecord[];
  submitLabel?: string;
}) {
  const [rows, setRows] = useState<DetalleRow[]>(() =>
    detalles && detalles.length > 0 ? detalles.map(rowFromDetalle) : [newRow()],
  );

  // Preselect the retención's own CAI when editing, otherwise the most
  // recent active CAI (first row of the query).
  const [selectedCai, setSelectedCai] = useState(
    retencion?.cai ?? cais[0]?.cai ?? "",
  );
  const [correlativo, setCorrelativo] = useState(
    retencion?.correlativo ?? formatCorrelativo(cais[0]),
  );

  const onCaiChange = (value: string) => {
    setSelectedCai(value);
    setCorrelativo(formatCorrelativo(cais.find((c) => c.cai === value)));
  };

  const updateRow = (id: number, patch: Partial<DetalleRow>) =>
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );

  const addRow = () => setRows((prev) => [...prev, newRow()]);

  const removeRow = (id: number) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));

  const totalGeneral = rows.reduce(
    (sum, r) => sum + (Number(r.importe_total) || 0),
    0,
  );

  return (
    <form action={action} className="flex flex-col gap-8">
      {/* ---- Retención (maestro) ---- */}
      <section className="flex flex-col gap-5">
        <h2 className="text-lg font-medium">Comprobante de retención</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="cai">Bloque</Label>
            <select
              id="cai"
              name="cai"
              required
              className={selectClass}
              value={selectedCai}
              onChange={(e) => onCaiChange(e.target.value)}
            >
              <option value="" disabled>
                Seleccionar ...
              </option>
              {cais.map((c) => (
                <option key={c.id} value={c.cai}>
                  {c.cai}
                  {c.bloque ? ` — ${c.bloque}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="correlativo">Correlativo</Label>
            <Input
              id="correlativo"
              name="correlativo"
              placeholder="000-001-01-00000251"
              value={correlativo}
              readOnly
              onChange={(e) => setCorrelativo(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="proveedor">Proveedor</Label>
            <Input
              id="proveedor"
              name="proveedor"
              placeholder="Nombre del proveedor"
              defaultValue={retencion?.proveedor ?? ""}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="rtn">RTN</Label>
            <Input
              id="rtn"
              name="rtn"
              placeholder="08011999123456"
              defaultValue={retencion?.rtn ?? ""}
              required
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="fecha_documento">Fecha del documento</Label>
            <Input
              id="fecha_documento"
              name="fecha_documento"
              type="date"
              defaultValue={retencion?.fecha_documento?.slice(0, 10) ?? ""}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="fecha_emision">Fecha de emisión</Label>
            <Input
              id="fecha_emision"
              name="fecha_emision"
              type="date"
              defaultValue={retencion?.fecha_emision?.slice(0, 10) ?? ""}
              required
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="cai_proveedor">CAI del proveedor</Label>
            <Input
              id="cai_proveedor"
              name="cai_proveedor"
              placeholder="CAI del proveedor"
              defaultValue={retencion?.cai_proveedor ?? ""}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="correlativo_proveedor">Correlativo del proveedor</Label>
            <Input
              id="correlativo_proveedor"
              name="correlativo_proveedor"
              placeholder="Correlativo del proveedor"
              defaultValue={retencion?.correlativo_proveedor ?? ""}
            />
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="firma">Firma</Label>
            <Input
              id="firma"
              name="firma"
              placeholder="Firma autorizada"
              defaultValue={retencion?.firma ?? ""}
            />
          </div>
        </div>
      </section>

      {/* ---- Detalle (uno a muchos) ---- */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">Detalle</h2>
            <p className="text-sm text-foreground/60">
              Agregá uno o varios registros de detalle.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={addRow}>
            <Plus className="size-4" />
            Agregar fila
          </Button>
        </div>

        <div className="overflow-x-auto rounded-md border border-foreground/10">
          <table className="w-full text-sm">
            <thead className="border-b border-foreground/10 text-left text-foreground/60">
              <tr>
                <th className="p-3 font-medium">#</th>
                <th className="p-3 font-medium min-w-56">Descripción</th>
                <th className="p-3 font-medium">Base imponible</th>
                <th className="p-3 font-medium">Porcentaje</th>
                <th className="p-3 font-medium">Importe total</th>
                <th className="p-3 font-medium text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={row.id}
                  className="border-b border-foreground/5 last:border-0"
                >
                  <td className="p-3 text-foreground/60">{index + 1}</td>
                  <td className="p-2">
                    <select
                      name="descripcion"
                      className={selectClass}
                      value={row.descripcion}
                      onChange={(e) => {
                        const concepto = CONCEPTOS.find(
                          (c) => c.descripcion === e.target.value,
                        );
                        const porcentaje = concepto?.porcentaje ?? 0;
                        updateRow(row.id, {
                          descripcion: e.target.value,
                          porcentaje,
                          importe_total: calcImporte(
                            row.base_imponible,
                            porcentaje,
                          ),
                        });
                      }}
                      required
                    >
                      <option value="" disabled>
                        Seleccionar concepto
                      </option>
                      {CONCEPTOS.map((c) => (
                        <option key={c.descripcion} value={c.descripcion}>
                          {c.descripcion} - {c.porcentaje}%
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <Input
                      name="det_base_imponible"
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="0.00"
                      value={row.base_imponible}
                      onChange={(e) =>
                        updateRow(row.id, {
                          base_imponible: e.target.value,
                          importe_total: calcImporte(
                            e.target.value,
                            row.porcentaje,
                          ),
                        })
                      }
                      required
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      name="det_porcentaje_imponible"
                      readOnly
                      tabIndex={-1}
                      className="bg-muted/50"
                      value={row.porcentaje ? `${row.porcentaje}` : ""}
                      placeholder="—"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      name="det_importe_total"
                      type="number"
                      step="0.01"
                      min={0}
                      readOnly
                      tabIndex={-1}
                      className="bg-muted/50"
                      placeholder="0.00"
                      value={row.importe_total}
                      required
                    />
                  </td>
                  <td className="p-2">
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        title="Quitar fila"
                        className="text-destructive hover:text-destructive disabled:opacity-30"
                        onClick={() => removeRow(row.id)}
                        disabled={rows.length === 1}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-foreground/10">
              <tr>
                <td className="p-3 font-medium" colSpan={4}>
                  Total retenido
                </td>
                <td className="p-3 font-medium tabular-nums" colSpan={2}>
                  {currency.format(totalGeneral)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <div className="flex gap-3 pt-2">
        <Button type="submit">{submitLabel}</Button>
        <Button asChild variant="outline" type="button">
          <Link href="/dashboard/retenciones">Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
