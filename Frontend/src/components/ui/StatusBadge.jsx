const STATUS_STYLES = {
    // General
    active: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-gray-100 text-gray-600',
    preferred: 'bg-blue-100 text-blue-700',
    prospect: 'bg-amber-100 text-amber-700',
    discontinued: 'bg-gray-100 text-gray-600',
    prototype: 'bg-purple-100 text-purple-700',
    draft: 'bg-gray-100 text-gray-600',
    released: 'bg-emerald-100 text-emerald-700',
    deprecated: 'bg-red-100 text-red-700',
    healthy: 'bg-emerald-100 text-emerald-700',
    low_stock: 'bg-amber-100 text-amber-700',
    critical: 'bg-red-100 text-red-700',
    // Production
    pending: 'bg-amber-100 text-amber-700',
    in_production: 'bg-blue-100 text-blue-700',
    on_hold: 'bg-orange-100 text-orange-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
    // Sales orders
    processing: 'bg-blue-100 text-blue-700',
    production: 'bg-indigo-100 text-indigo-700',
    shipped: 'bg-cyan-100 text-cyan-700',
    // Machines
    running: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    maintenance: 'bg-orange-100 text-orange-700',
    stopped: 'bg-red-100 text-red-700',
};
export default function StatusBadge({ status, variant = 'default' }) {
    const normalized = status.toLowerCase().replace(/\s+/g, '_');
    const style = STATUS_STYLES[normalized] || 'bg-gray-100 text-gray-600';
    const displayLabel = normalized.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return (<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${style}`}>
      {displayLabel}
    </span>);
}
