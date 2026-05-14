export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
  errors: string[] | null;
}

export interface PagedResult<T> {
  items: T[];
  totalRegistros: number;
  pagina: number;
  tamañoPagina: number;
  totalPaginas: number;
}
