function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-20 flex items-center justify-center">

      {/* Modal Box */}
      <div className="w-full max-w-lg bg-white rounded-lg shadow-lg">

        {/* Header */}
        <div className="px-6 py-4 bg-primaryDark text-white rounded-t-lg flex justify-between items-center">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-xl hover:opacity-80"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {children}
        </div>

      </div>
    </div>
  );
}

export default Modal;
