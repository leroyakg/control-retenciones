import { createClient } from "@/lib/supabase/server";
import type { RetencionRecord } from "../retenciones/types";

export const MAX_ROWS = 1000;

export type ReporteFilters = {
  desde: string;
  hasta: string;
  comprobante: string;
  proveedor: string;
  baseMin: string;
  baseMax: string;
  retMin: string;
  retMax: string;
  anuladas: boolean;
};

export type ReporteSearchParamsValues = {
  desde?: string;
  hasta?: string;
  comprobante?: string;
  proveedor?: string;
  base_min?: string;
  base_max?: string;
  ret_min?: string;
  ret_max?: string;
  anuladas?: string;
};

export type ReporteRow = {
  id: number;
  proveedor: string;
  rtn: string;
  correlativo: string | null;
  fecha_emision: string;
  fecha_anulacion: string | null;
  base: number;
  retenido: number;
};

export type ReporteResult = {
  error: string | null;
  rows: ReporteRow[];
  totalBase: number;
  totalRetenido: number;
  truncated: boolean;
};

type ReporteQueryRow = RetencionRecord & {
  retenciones_detalle: { base_imponible: number; importe_total: number }[];
};

export function parseFilters(params: ReporteSearchParamsValues): ReporteFilters {
  return {
    desde: params.desde ?? "",
    hasta: params.hasta ?? "",
    comprobante: params.comprobante ?? "",
    proveedor: params.proveedor ?? "",
    baseMin: params.base_min ?? "",
    baseMax: params.base_max ?? "",
    retMin: params.ret_min ?? "",
    retMax: params.ret_max ?? "",
    anuladas: params.anuladas === "on",
  };
}

export function filtersToQueryString(filters: ReporteFilters): string {
  const params = new URLSearchParams();
  if (filters.desde) params.set("desde", filters.desde);
  if (filters.hasta) params.set("hasta", filters.hasta);
  if (filters.comprobante) params.set("comprobante", filters.comprobante);
  if (filters.proveedor) params.set("proveedor", filters.proveedor);
  if (filters.baseMin) params.set("base_min", filters.baseMin);
  if (filters.baseMax) params.set("base_max", filters.baseMax);
  if (filters.retMin) params.set("ret_min", filters.retMin);
  if (filters.retMax) params.set("ret_max", filters.retMax);
  if (filters.anuladas) params.set("anuladas", "on");
  return params.toString();
}

export function formatPct(base: number, retenido: number): string {
  if (!base) return "—";
  return `${((retenido / base) * 100).toFixed(2)}%`;
}

function parseAmount(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

export async function fetchReporte(
  filters: ReporteFilters,
): Promise<ReporteResult> {
  const supabase = await createClient();

  let query = supabase
    .from("retenciones")
    .select(
      "id, proveedor, rtn, correlativo, fecha_emision, fecha_anulacion, retenciones_detalle(base_imponible, importe_total)",
    )
    .order("fecha_emision", { ascending: false })
    .order("correlativo", { ascending: false })
    .limit(MAX_ROWS);

  if (filters.desde) query = query.gte("fecha_emision", filters.desde);
  if (filters.hasta) query = query.lte("fecha_emision", filters.hasta);
  if (filters.comprobante)
    query = query.ilike("correlativo", `%${filters.comprobante}%`);
  if (filters.proveedor)
    query = query.ilike("proveedor", `%${filters.proveedor}%`);
  if (!filters.anuladas) query = query.is("fecha_anulacion", null);

  const { data, error } = await query;

  if (error) {
    return {
      error: error.message,
      rows: [],
      totalBase: 0,
      totalRetenido: 0,
      truncated: false,
    };
  }

  const baseMin = parseAmount(filters.baseMin);
  const baseMax = parseAmount(filters.baseMax);
  const retMin = parseAmount(filters.retMin);
  const retMax = parseAmount(filters.retMax);

  // The amounts live in the detail rows, so aggregate per retención and
  // apply the amount filters over the aggregated values.
  const rows = ((data ?? []) as unknown as ReporteQueryRow[])
    .map((r) => {
      const base = r.retenciones_detalle.reduce(
        (sum, d) => sum + (Number(d.base_imponible) || 0),
        0,
      );
      const retenido = r.retenciones_detalle.reduce(
        (sum, d) => sum + (Number(d.importe_total) || 0),
        0,
      );
      return {
        id: r.id,
        proveedor: r.proveedor,
        rtn: r.rtn,
        correlativo: r.correlativo,
        fecha_emision: r.fecha_emision,
        fecha_anulacion: r.fecha_anulacion,
        base,
        retenido,
      };
    })
    .filter((r) => {
      if (baseMin !== null && r.base < baseMin) return false;
      if (baseMax !== null && r.base > baseMax) return false;
      if (retMin !== null && r.retenido < retMin) return false;
      if (retMax !== null && r.retenido > retMax) return false;
      return true;
    });

  return {
    error: null,
    rows,
    totalBase: rows.reduce((sum, r) => sum + r.base, 0),
    totalRetenido: rows.reduce((sum, r) => sum + r.retenido, 0),
    truncated: (data?.length ?? 0) >= MAX_ROWS,
  };
}
