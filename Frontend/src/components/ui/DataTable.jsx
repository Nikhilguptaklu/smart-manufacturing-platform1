import EmptyState from './EmptyState';
import { SearchX } from 'lucide-react';
export default function DataTable({ columns, data, loading, emptyTitle = 'No data found', emptyDescription = 'There are no records to display.', onRowClick, }) {
    if (loading) {
        return (<div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-100 border-b border-gray-200"/>
          {[...Array(5)].map((_, i) => (<div key={i} className="h-14 border-b border-gray-100 px-4 flex gap-4 items-center">
              {[...Array(columns.length)].map((_, j) => (<div key={j} className="h-4 bg-gray-200 rounded flex-1" style={{ maxWidth: `${100 / columns.length}%` }}/>))}
            </div>))}
        </div>
      </div>);
    }
    if (data.length === 0) {
        return (<div className="bg-white rounded-xl border border-gray-200">
        <EmptyState icon={SearchX} title={emptyTitle} description={emptyDescription}/>
      </div>);
    }
    return (<div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((col) => (<th key={col.key} className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${col.className ?? ''}`}>
                  {col.header}
                </th>))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row) => (<tr key={row.id} onClick={() => onRowClick?.(row)} className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}>
                {columns.map((col) => (<td key={col.key} className={`px-4 py-3.5 text-sm text-gray-700 ${col.className ?? ''}`}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>))}
              </tr>))}
          </tbody>
        </table>
      </div>
    </div>);
}
