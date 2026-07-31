import { NextResponse, type NextRequest } from "next/server";
// import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CaiRecord } from "@/app/dashboard/cai/types";

type ExpiredCai = Pick<
  CaiRecord,
  "id" | "cai" | "bloque" | "prefijo" | "fecha_expiracion"
>;

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  // If no secret is configured, allow the call (useful in local/dev). In
  // production set CRON_SECRET — Vercel Cron sends it as a Bearer token.
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

// function buildEmailHtml(cais: ExpiredCai[], todayStr: string) {
//   const rows = cais
//     .map(
//       (c) => `
//         <tr>
//           <td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:monospace;">${c.cai}</td>
//           <td style="padding:8px 12px;border-bottom:1px solid #eee;">${c.bloque ?? "—"}</td>
//           <td style="padding:8px 12px;border-bottom:1px solid #eee;">${c.prefijo ?? "—"}</td>
//           <td style="padding:8px 12px;border-bottom:1px solid #eee;">${c.fecha_expiracion ?? "—"}</td>
//         </tr>`,
//     )
//     .join("");

//   return `
//     <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#111;">
//       <h2 style="margin:0 0 8px;">CAI vencido${cais.length > 1 ? "s" : ""}</h2>
//       <p style="margin:0 0 16px;color:#444;">
//         Al ${todayStr} ${cais.length === 1 ? "el siguiente CAI ha vencido" : `los siguientes ${cais.length} CAIs han vencido`}
//         y se marcaron como <strong>vencido</strong> automáticamente.
//         Por favor genere un nuevo CAI para continuar emitiendo retenciones.
//       </p>
//       <table style="border-collapse:collapse;width:100%;font-size:14px;">
//         <thead>
//           <tr style="text-align:left;background:#f6f6f6;">
//             <th style="padding:8px 12px;border-bottom:2px solid #ddd;">CAI</th>
//             <th style="padding:8px 12px;border-bottom:2px solid #ddd;">Bloque</th>
//             <th style="padding:8px 12px;border-bottom:2px solid #ddd;">Prefijo</th>
//             <th style="padding:8px 12px;border-bottom:2px solid #ddd;">Vencimiento</th>
//           </tr>
//         </thead>
//         <tbody>${rows}</tbody>
//       </table>
//       <p style="margin:20px 0 0;color:#888;font-size:12px;">
//         Mensaje automático — Control de Retenciones.
//       </p>
//     </div>`;
// }

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const todayStr = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

  // Find active, non-deleted CAIs whose expiration date is today or earlier.
  const { data: expiring, error: selectError } = await supabase
    .from("cais")
    .select("id, cai, bloque, prefijo, fecha_expiracion")
    .eq("estatus", "activo")
    .is("delete_time", null)
    .not("fecha_expiracion", "is", null)
    .lte("fecha_expiracion", todayStr);

  if (selectError) {
    return NextResponse.json(
      { error: `Error al consultar CAIs: ${selectError.message}` },
      { status: 500 },
    );
  }

  const expired = (expiring ?? []) as ExpiredCai[];

  if (expired.length === 0) {
    return NextResponse.json({ ok: true, expired: 0, message: "Sin CAIs vencidos." });
  }

  // Mark them vencido.
  const ids = expired.map((c) => c.id);
  const { error: updateError } = await supabase
    .from("cais")
    .update({ estatus: "vencido", update_time: new Date().toISOString() })
    .in("id", ids);

  if (updateError) {
    return NextResponse.json(
      { error: `Error al actualizar CAIs: ${updateError.message}` },
      { status: 500 },
    );
  }

  // Notify.
  // const apiKey = process.env.RESEND_API_KEY;
  // const to = process.env.NOTIFY_EMAIL;
  // const from = process.env.FROM_EMAIL || "onboarding@resend.dev";

  // let emailSent = false;
  // let emailError: string | null = null;

  // if (!apiKey || !to) {
  //   emailError = "Falta RESEND_API_KEY o NOTIFY_EMAIL; se omitió el envío del correo.";
  // } else {
  //   try {
  //     const resend = new Resend(apiKey);
  //     const subject =
  //       expired.length === 1
  //         ? `CAI vencido: ${expired[0].cai}`
  //         : `${expired.length} CAIs vencidos`;
  //     const { error } = await resend.emails.send({
  //       from,
  //       to: to.split(",").map((s) => s.trim()),
  //       subject,
  //       html: buildEmailHtml(expired, todayStr),
  //     });
  //     if (error) emailError = error.message;
  //     else emailSent = true;
  //   } catch (err) {
  //     emailError = err instanceof Error ? err.message : "Error desconocido al enviar correo.";
  //   }
  // }

  return NextResponse.json({
    ok: true,
    expired: expired.length,
    ids,
    // emailSent,
    // emailError,
  });
}
