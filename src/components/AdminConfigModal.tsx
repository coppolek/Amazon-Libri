import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Save, Shield } from 'lucide-react';
import { useAppConfig } from '../hooks/useAppConfig';
import { doc, updateDoc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';

interface AdminConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminConfigModal({ isOpen, onClose }: AdminConfigModalProps) {
  const { config, isLoading } = useAppConfig();
  const { user } = useAuth();
  const [defaultSearch, setDefaultSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (config?.defaultSearchQuery) {
      setDefaultSearch(config.defaultSearchQuery);
    }
  }, [config]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setError('');
    setSuccess('');
    
    if (!user || user.email !== 'coppolek@gmail.com') { // Hardcoded admin check matching firestore rules
      setError('Non hai i permessi per eseguire questa operazione.');
      return;
    }

    try {
      const ref = doc(db, 'config', 'searchSettings');
      const snap = await getDoc(ref);
      
      const payload = {
        defaultSearchQuery: defaultSearch.trim(),
        updatedAt: serverTimestamp()
      };

      if (snap.exists()) {
        await updateDoc(ref, payload);
      } else {
        await setDoc(ref, payload);
      }

      setSuccess('Configurazione salvata con successo!');
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError('Errore durante il salvataggio: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-xl font-bold font-serif text-slate-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" />
            Configurazione Admin
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <p className="text-slate-500">Caricamento configurazione...</p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Termine di Ricerca di Default
                </label>
                <input
                  type="text"
                  value={defaultSearch}
                  onChange={(e) => setDefaultSearch(e.target.value)}
                  placeholder="Es. Le novità più interessanti in Libri"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-sm focus:ring-amber-500 focus:border-amber-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Questo termine verrà usato nella home page se l'utente non ha impostato altri filtri.
                </p>
              </div>

              {error && <p className="text-red-500 text-sm font-medium mt-2">{error}</p>}
              {success && <p className="text-green-500 text-sm font-medium mt-2">{success}</p>}

              <button
                onClick={handleSave}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors mt-4"
              >
                <Save className="w-5 h-5" />
                Salva Configurazioni
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
