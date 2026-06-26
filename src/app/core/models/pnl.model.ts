export interface PnlFiltrosOpciones {
  clientes: string[];
  proyectos: string[];
  verticales: string[];
  anios: number[];
}

export interface PnlFiltros {
  clientes: string[];
  proyectos: string[];
  verticales: string[];
  anio: number | null;
}

export interface PnlLineaDto {
  id: string;
  parentId: string | null;
  account: string;
  level: number;
  months: { [mes: number]: number };
  acum: number;
  children?: PnlLineaDto[];
}
