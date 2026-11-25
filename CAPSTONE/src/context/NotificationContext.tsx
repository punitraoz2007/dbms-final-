import React, { createContext, useContext, useState, useEffect } from 'react';
import { SimulatedEmail, Invitation } from '../types/index.ts';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface NotificationContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  simulatedEmails: SimulatedEmail[];
  addSimulatedEmail: (email: Omit<SimulatedEmail, 'id' | 'sentAt'>) => void;
  clearSimulatedEmails: () => void;
  selectedEmail: SimulatedEmail | null;
  setSelectedEmail: (email: SimulatedEmail | null) => void;
  isInboxOpen: boolean;
  setIsInboxOpen: (open: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [simulatedEmails, setSimulatedEmails] = useState<SimulatedEmail[]>(() => {
    try {
      const saved = localStorage.getItem('rentease_simulated_emails');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedEmail, setSelectedEmail] = useState<SimulatedEmail | null>(null);
  const [isInboxOpen, setIsInboxOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('rentease_simulated_emails', JSON.stringify(simulatedEmails));
    } catch {
      // ignore
    }
  }, [simulatedEmails]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = 'toast_' + Date.now() + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addSimulatedEmail = (email: Omit<SimulatedEmail, 'id' | 'sentAt'>) => {
    const newEmail: SimulatedEmail = {
      ...email,
      id: 'email_' + Date.now(),
      sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setSimulatedEmails((prev) => [newEmail, ...prev]);
    addToast({
      type: 'info',
      title: 'Email Sent to ' + email.recipientEmail,
      message: 'Click the Email Inbox simulator icon in top bar to view & test link.',
    });
  };

  const clearSimulatedEmails = () => {
    setSimulatedEmails([]);
    localStorage.removeItem('rentease_simulated_emails');
  };

  return (
    <NotificationContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        simulatedEmails,
        addSimulatedEmail,
        clearSimulatedEmails,
        selectedEmail,
        setSelectedEmail,
        isInboxOpen,
        setIsInboxOpen,
      }}
    >
      {children}

      {/* Global Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border transition-all transform duration-200 animate-in fade-in slide-in-from-bottom-5 ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : toast.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : toast.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{toast.title}</h4>
              {toast.message && <p className="text-xs mt-0.5 opacity-90">{toast.message}</p>}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-700 text-sm font-bold"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
