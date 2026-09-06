import { Loader2 } from 'lucide-react';
export default function LoadingSpinner({ size = 'md' }) {
    const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
    return (<div className="flex items-center justify-center py-12">
      <Loader2 className={`${sizes[size]} text-blue-600 animate-spin`}/>
    </div>);
}
export function FullPageSpinner() {
    return (<div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto"/>
        <p className="mt-4 text-sm text-gray-500">Loading...</p>
      </div>
    </div>);
}
