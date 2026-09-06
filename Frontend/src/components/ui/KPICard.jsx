const COLORS = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-100' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100' },
    red: { bg: 'bg-red-50', text: 'text-red-600', ring: 'ring-red-100' },
    teal: { bg: 'bg-teal-50', text: 'text-teal-600', ring: 'ring-teal-100' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', ring: 'ring-indigo-100' },
    cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', ring: 'ring-cyan-100' },
};
export default function KPICard({ label, value, icon: Icon, trend, color = 'blue', subtitle }) {
    const c = COLORS[color];
    return (<div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <div className="mt-1">{subtitle}</div>}
          {trend && (<p className={`text-xs font-medium mt-2 ${trend.positive ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </p>)}
        </div>
        <div className={`w-11 h-11 rounded-xl ${c.bg} ${c.text} flex items-center justify-center ring-4 ${c.ring} flex-shrink-0`}>
          <Icon className="w-5 h-5"/>
        </div>
      </div>
    </div>);
}
