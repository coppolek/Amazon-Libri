import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User as UserIcon } from 'lucide-react';
import { UserProfile } from '../types';
import { User } from 'firebase/auth';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  profile: UserProfile | null;
  onUnfollowAuthor: (author: string) => void;
  onUnfollowCategory: (category: string) => void;
}

export function UserProfileModal({ isOpen, onClose, user, profile, onUnfollowAuthor, onUnfollowCategory }: UserProfileModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="profile-modal-wrapper"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
        >
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <UserIcon className="w-6 h-6 text-amber-500" />
              Profilo Utente
            </h2>
            <button
              onClick={onClose}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-8 flex-1">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">Email associata</p>
              <p className="text-slate-900 font-medium">{user.email || 'Utente Anonimo'}</p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Autori Seguiti</h3>
              {(!profile?.followedAuthors || profile.followedAuthors.length === 0) ? (
                <p className="text-slate-500 text-sm italic">Non segui nessun autore.</p>
              ) : (
                <ul className="space-y-2">
                  {profile.followedAuthors.map((author, i) => (
                    <li key={`author-${i}`} className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                      <span className="font-medium text-slate-700">{author}</span>
                      <button 
                        onClick={() => onUnfollowAuthor(author)}
                        className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                      >
                        Smetti di seguire
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Categorie Seguite</h3>
              {(!profile?.followedCategories || profile.followedCategories.length === 0) ? (
                <p className="text-slate-500 text-sm italic">Non segui nessuna categoria.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.followedCategories.map((cat, i) => (
                    <span key={`cat-${i}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-sm font-medium">
                      {cat}
                      <button 
                        onClick={() => onUnfollowCategory(cat)}
                        className="hover:bg-amber-200 rounded-full p-0.5 transition-colors"
                        title="Smetti di seguire"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
