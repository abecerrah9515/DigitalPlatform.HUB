export interface PnlNodoDto {
  lineItemId: string;
  etiqueta: string;
  parentId: string | null;
  nivel: number;
  tieneHijos: boolean;
  tieneFormula: boolean;
  esHoja: boolean;
  sinMovimientos: boolean;
  valores: number[];   // [0]=Ene … [11]=Dic
  acum: number;
  descuadre: number;
  tipoFinanciero: string;
}

export interface PnlRespuesta {
  requiereAnio: boolean;
  moneda: string;
  anio: number | null;
  nodos: PnlNodoDto[];
}

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
  moneda: 'COP' | 'USD';
}
