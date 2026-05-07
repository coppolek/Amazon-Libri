import React, { useState, useRef, useEffect } from 'react';
import { Facebook, Twitter, MessageCircle, Share2, Link2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ShareButtonsProps {
  title: string;
  url: string;
}

export function ShareButtons({ title, url }: ShareButtonsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(`Guarda questo fantastico libro: ${title}`);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Guarda questo fantastico libro: ${title}`,
          url: url,
        });
      } catch (err) {
        console.log('Errore nella condivisione:', err);
      }
    } else {
      setIsOpen(!isOpen);
    }
  };

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative flex items-center" ref={menuRef}>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleShare}
        className="flex items-center justify-center p-3 sm:p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-full transition-colors"
        aria-label="Condividi"
      >
        <Share2 className="w-5 h-5 sm:w-4 sm:h-4" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute bottom-full left-0 mb-2 p-2 bg-white rounded-lg shadow-xl border border-slate-100 flex items-center gap-1 z-30"
          >
            <a
              href={shareLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
              className="p-3 sm:p-2 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-md transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="w-5 h-5 sm:w-4 sm:h-4" />
            </a>
            <a
              href={shareLinks.twitter}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
              className="p-3 sm:p-2 hover:bg-sky-50 text-slate-600 hover:text-sky-500 rounded-md transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5 sm:w-4 sm:h-4" />
            </a>
            <a
              href={shareLinks.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
              className="p-3 sm:p-2 hover:bg-green-50 text-slate-600 hover:text-green-600 rounded-md transition-colors"
              aria-label="WhatsApp"
            >
              <MessageCircle className="w-5 h-5 sm:w-4 sm:h-4" />
            </a>
            <div className="w-px h-6 sm:h-4 bg-slate-200 mx-1"></div>
            <button
              onClick={copyToClipboard}
              className="p-3 sm:p-2 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-md transition-colors relative"
              aria-label="Copia link"
            >
              {copied ? <Check className="w-5 h-5 sm:w-4 sm:h-4 text-green-500" /> : <Link2 className="w-5 h-5 sm:w-4 sm:h-4" />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
