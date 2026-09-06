import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
const ToastContext = createContext(undefined);
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const toast = useCallback((message, type = 'info') => {
        const id = Math.random().toString(36).slice(2);
        setToasts((prev) => [...prev, { id, type, message }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);
    const remove = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));
    const icons = {
        success: <CheckCircle className="w-5 h-5 text-emerald-500"/>,
        error: <XCircle className="w-5 h-5 text-red-500"/>,
        warning: <AlertCircle className="w-5 h-5 text-amber-500"/>,
        info: <Info className="w-5 h-5 text-blue-500"/>,
    };
    const borders = {
        success: 'border-l-emerald-500',
        error: 'border-l-red-500',
        warning: 'border-l-amber-500',
        info: 'border-l-blue-500',
    };
    return (<ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (<div key={t.id} className={`flex items-start gap-3 bg-white border border-l-4 ${borders[t.type]} rounded-lg shadow-lg p-4 animate-slide-in`}>
            {icons[t.type]}
            <p className="text-sm text-gray-700 flex-1">{t.message}</p>
            <button onClick={() => remove(t.id)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4"/>
            </button>
          </div>))}
      </div>
    </ToastContext.Provider>);
}
export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx)
        throw new Error('useToast must be used within ToastProvider');
    return ctx;
}
