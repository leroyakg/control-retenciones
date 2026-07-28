export type RetencionRecord = {
  id: number;
  rtn: string;
  cai: string;
  correlativo: string | null;
  proveedor: string;
  fecha_documento: string;
  fecha_emision: string;
  firma: string | null;
  cai_proveedor: string | null;
  correlativo_proveedor: string | null;
  create_time: string;
  update_time: string;
  procesado: boolean;
};

export type RetencionDetalleRecord = {
  id: number;
  retencion_id: number;
  descripcion: string | null;
  base_imponible: number;
  porcentaje_imponible: number | null;
  importe_total: number;
};
