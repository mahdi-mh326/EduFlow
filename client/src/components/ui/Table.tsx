import { type ReactNode } from 'react'

type TableProps = {
  headers: string[]
  rows: (string | ReactNode)[][]
  emptyState?: ReactNode
  onRowClick?: (row: (string | ReactNode)[], index: number) => void
  className?: string
}

export function Table({ headers, rows, emptyState, onRowClick, className = '' }: TableProps) {
  if (rows.length === 0 && emptyState) {
    return <div className={className}>{emptyState}</div>
  }

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full min-w-[640px] divide-y divide-border">
        <thead>
          <tr className="bg-background">
            {headers.map((header) => (
              <th
                key={header}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface">
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={onRowClick ? 'cursor-pointer hover:bg-background transition-colors duration-150' : ''}
              onClick={() => onRowClick?.(row, rowIndex)}
              onKeyDown={(event) => {
                if (onRowClick && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault()
                  onRowClick(row, rowIndex)
                }
              }}
              tabIndex={onRowClick ? 0 : undefined}
              role={onRowClick ? 'button' : undefined}
            >
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 text-sm text-text">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
