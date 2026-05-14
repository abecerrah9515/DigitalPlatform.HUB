export interface ProyectosFilterParams {
  Cliente?: string[];
  CodProyecto?: string[];
  Industria?: string[];
  Area?: string[];
  Sociedad?: string[];
  Moneda?: string;
  Año?: number[];
  Mes?: number[];
  Pagina?: number;
  TamañoPagina?: number;
}

export interface ProyectoDto {
  año: number;
  mes: number;
  industria: string | null;
  cliente: string | null;
  codProyecto: string | null;
  ceBe: string | null;
  responsable: string | null;
  area: string | null;
  sociedad: string | null;
  ingreso: number;
  costo: number;
  gm: number;
  gmPorcentaje: number;
  horas: number;
  tarifaEntrega: number;
}
