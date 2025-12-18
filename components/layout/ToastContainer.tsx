import React from 'react';

interface ToastProps {
  notifications: { message: string; type: 'success' | 'error' | 'info'; id: number }[];
}

const ToastContainer: React.FC<ToastProps> = ({ notifications }) => {
  return (
    <div className="fixed top-6 left-0 right-0 z-[100] flex flex-col items-center gap-2 px-6 pointer-events-none print:hidden">
      {notifications.map(n => (
        <div key={n.id} className="pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl glass-card animate-reveal border border-white/10">
          <div className={`w-2 h-2 rounded-full ${n.type === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : n.type === 'error' ? 'bg-rose-500' : 'bg-blue-500'}`} />
          <span className="text-xs font-bold tracking-tight text-white/90">{n.message}</span>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;