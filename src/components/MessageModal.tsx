import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: 'error' | 'success';
}

export function MessageModal({ isOpen, onClose, title, message, type }: MessageModalProps) {
  const isError = type === 'error';
  const Icon = isError ? AlertCircle : CheckCircle2;
  const colorClass = isError ? 'text-red-500' : 'text-green-500';
  const bgClass = isError ? 'bg-red-50' : 'bg-green-50';
  const buttonClass = isError 
    ? 'bg-red-500 hover:bg-red-600 focus:ring-red-300' 
    : 'bg-green-500 hover:bg-green-600 focus:ring-green-300';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden z-20"
          >
            <div className={`p-6 flex flex-col items-center text-center ${bgClass}`}>
              <Icon className={`w-12 h-12 mb-4 ${colorClass}`} />
              <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-600 mb-6">{message}</p>
              
              <button
                onClick={onClose}
                className={`w-full text-white focus:ring-4 font-medium rounded-lg text-sm px-5 py-2.5 outline-none transition-colors ${buttonClass}`}
              >
                Chiudi
              </button>
            </div>
            
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-white/50 hover:bg-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
