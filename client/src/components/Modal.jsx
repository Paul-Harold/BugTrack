export default function Modal({ title, onClose, children, wide = false }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-16"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} rounded-xl border border-slate-700 bg-slate-900 shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
