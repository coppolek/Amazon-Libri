import React, { useState, useEffect } from 'react';
import { AppNotification } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Check, Book, BellRing } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useUserProfile } from '../hooks/useUserProfile';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBook?: (bookId: string) => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isOpen, onClose, onSelectBook }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { profile, requestPushPermission } = useUserProfile();
  const [permState, setPermState] = useState<string>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermState(Notification.permission);
    }
  }, [isOpen]);

  const handleEnablePush = async () => {
    const granted = await requestPushPermission();
    if (granted) {
      setPermState('granted');
      alert('Notifiche push attivate!');
    } else {
      setPermState(Notification.permission);
      alert('Impossibile attivare le notifiche push. Assicurati che non siano bloccate dal browser.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm sm:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="fixed top-16 right-4 left-4 sm:absolute sm:top-12 sm:bottom-auto sm:left-auto sm:right-0 mt-2 sm:w-80 md:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="p-4 border-b border-slate-100 flex flex-col gap-3 bg-slate-50">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800 font-serif">Notifiche ({unreadCount})</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-amber-600 hover:text-amber-800 font-medium flex items-center gap-1"
                  >
                    <Check size={14} />
                    Segna tutte come lette
                  </button>
                )}
              </div>
              
              {permState !== 'granted' && (
                <div className="bg-amber-100/50 rounded-lg p-3 flex items-start gap-3 border border-amber-200/50">
                  <div className="text-amber-600 mt-0.5"><BellRing size={16} /></div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-700 mb-1">Attiva le notifiche sul dispositivo per non perdere le ultime novità.</p>
                    <button 
                      onClick={handleEnablePush}
                      className="text-xs font-semibold text-amber-700 hover:text-amber-800 underline"
                    >
                      Attiva Notifiche Push
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="overflow-y-auto flex-grow p-2 space-y-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Nessuna notifica</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (!notif.read) markAsRead(notif.id);
                      if (notif.bookId && onSelectBook) {
                        onSelectBook(notif.bookId);
                        onClose();
                      }
                    }}
                    className={`p-3 rounded-lg cursor-pointer flex gap-3 items-start transition-colors ${notif.read ? 'bg-white hover:bg-slate-50' : 'bg-amber-50 hover:bg-amber-100 border border-amber-100'}`}
                  >
                    <div className={`mt-0.5 p-2 rounded-full flex-shrink-0 ${notif.read ? 'bg-slate-100 text-slate-400' : 'bg-amber-200 text-amber-700'}`}>
                      <Book size={16} />
                    </div>
                    <div>
                      <h4 className={`text-sm tracking-tight ${notif.read ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>{notif.title}</h4>
                      <p className={`text-xs mt-1 leading-relaxed ${notif.read ? 'text-slate-500' : 'text-slate-700'}`}>{notif.body}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
