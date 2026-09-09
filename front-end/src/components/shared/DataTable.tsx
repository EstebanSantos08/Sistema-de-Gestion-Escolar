import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

export interface Column<T> {
  header: string;
  key?: keyof T;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  getRowId?: (row: T) => number | string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  emptyMessage = 'Sin registros disponibles',
  page,
  totalPages,
  onPageChange,
  getRowId,
}: DataTableProps<T>) {
  return (
    <div className="nk-card nk-section overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col, i) => (
                <TableHead key={i} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-school-muted-readable">
                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-turquoise border-t-transparent" />
                    <span className="text-sm font-medium">Cargando información...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-1.5 py-4 text-school-muted-readable">
                    <Inbox className="h-8 w-8 text-school-muted-readable/50" />
                    <p className="text-sm font-medium">{emptyMessage}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => {
                const key = getRowId
                  ? getRowId(row)
                  : ((row as Record<string, unknown>)?.id as number | string | undefined) ??
                    ((row as Record<string, unknown>)?.enrollmentId as number | string | undefined) ??
                    index;

                return (
                  <TableRow key={key}>
                    {columns.map((col, ci) => (
                      <TableCell key={ci} className={col.className}>
                        {col.render
                          ? col.render(row)
                          : col.key !== undefined
                            ? String(row[col.key] ?? '')
                            : null}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {page !== undefined && totalPages !== undefined && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-school-border px-4 py-3 bg-school-bg/50">
          <p className="text-sm text-school-muted-readable">
            Página <span className="font-semibold text-school-heading">{page}</span> de{' '}
            <span className="font-semibold text-school-heading">{totalPages}</span>
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
              aria-label="Página anterior"
              className="h-9 px-3"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
              aria-label="Página siguiente"
              className="h-9 px-3"
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
