import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false, }) {
    return (<Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${danger ? 'bg-red-100' : 'bg-amber-100'}`}>
          <AlertTriangle className={`w-5 h-5 ${danger ? 'text-red-600' : 'text-amber-600'}`}/>
        </div>
        <p className="text-sm text-gray-600">{message}</p>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
          Cancel
        </button>
        <button onClick={onConfirm} className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
          {confirmLabel}
        </button>
      </div>
    </Modal>);
}
