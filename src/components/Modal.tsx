'use client';

import { useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  wide?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ open, onClose, title, wide, children, footer }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKey);
      return () => document.removeEventListener('keydown', handleKey);
    }
  }, [open, handleKey]);

  return (
    <div className={`overlay${open ? ' on' : ''}`} onClick={onClose}>
      <div
        ref={modalRef}
        className={`modal${wide ? ' wide' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-h">
          <h3>{title}</h3>
          <button className="modal-x" onClick={onClose}>
            <X size={16} strokeWidth={2} />
          </button>
        </div>
        <div className="modal-b">{children}</div>
        {footer && <div className="modal-f">{footer}</div>}
      </div>
    </div>
  );
}
