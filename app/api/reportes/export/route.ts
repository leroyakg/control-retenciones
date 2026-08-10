import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchReporte,
  formatPct,
  parseFilters,
  type ReporteSearchParamsValues,
} from "@/app/dashboard/reportes/data";

function formatDate(value: string | null) {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-");
  if (year && month && day) return `${day}/${month}/${year}`;
  return value;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: claims, error: authError } = await supabase.auth.getClaims();
  if (authError || !claims?.claims) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const params = Object.fromEntries(
    request.nextUrl.searchParams.entries(),
  ) as ReporteSearchParamsValues;
  const filters = parseFilters(params);

  const { error, rows } = await fetchReporte(filters);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Reporte");

  sheet.columns = [
    { header: "F. emisión", key: "fecha", width: 12 },
    { header: "Comprobante", key: "comprobante", width: 16 },
    { header: "Proveedor", key: "proveedor", width: 40 },
    { header: "Base imponible", key: "base", width: 16 },
    { header: "% Retenido", key: "pct", width: 12 },
    { header: "Valor retenido", key: "retenido", width: 16 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const r of rows) {
    const anulada = Boolean(r.fecha_anulacion);
    const row = sheet.addRow({
      fecha: formatDate(r.fecha_emision),
      comprobante:
        (r.correlativo ? r.correlativo.slice(-8) : "—") +
        (anulada ? " (Anulada)" : ""),
      proveedor: r.proveedor,
      base: anulada ? "—" : r.base,
      pct: anulada ? "—" : formatPct(r.base, r.retenido),
      retenido: anulada ? "—" : r.retenido,
    });
    if (!anulada) {
      row.getCell("base").numFmt = "#,##0.00";
      row.getCell("retenido").numFmt = "#,##0.00";
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="reporte-retenciones.xlsx"',
    },
  });
}
