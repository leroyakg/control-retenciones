export const ESTATUS = ["activo", "vencido", "agotado", "anulado"] as const;

export type CaiEstatus = (typeof ESTATUS)[number];

export type CaiRecord = {
  id: string;
  cai: string;
  bloque: string | null;
  prefijo: string | null;
  rango_inicial: number;
  rango_final: number;
  fecha_emision: string | null;
  fecha_expiracion: string | null;
  estatus: CaiEstatus;
};
