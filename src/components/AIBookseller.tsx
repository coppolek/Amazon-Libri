import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { getAmazonAffiliateLink } from '../lib/amazon';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Il titolo del libro consigliato" },
    author: { type: Type.STRING, description: "L'autore del libro" },
    description: { type: Type.STRING, description: "Una motivazione accattivante del perché lo stai consigliando (max 3 frasi)" }
  },
  required: ["title", "author", "description"]
};

export function AIBookseller() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<{title: string, author: string, description: string} | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setRecommendation(null);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Sei un libraio esperto, appassionato e con un'ottima cultura letteraria. 
Il cliente chiede: "${query}". 
Consiglia UN SOLO libro in lingua italiana perfetto per questa richiesta. Fornisci la risposta in JSON strutturato come richiesto.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        }
      });

      if (response.text) {
        setRecommendation(JSON.parse(response.text));
      }
    } catch (error) {
      console.error("Errore generativo:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-xl mt-12 mb-16">
      {/* Decoro di background */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-white">Chiedi al Libraio AI</h2>
            <p className="text-sm text-slate-400">Non sai cosa leggere? Descrivi cosa stai cercando.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="es. Un thriller ambientato a Londra..."
            disabled={loading}
            className="flex-grow bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-base md:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:hover:bg-amber-500 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Consigliami'}
          </button>
        </form>

        <AnimatePresence>
          {recommendation && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="bg-slate-800 rounded-xl p-5 border border-slate-700"
            >
              <h3 className="text-lg font-serif font-bold text-white mb-1">
                {recommendation.title}
              </h3>
              <p className="text-amber-400 font-medium mb-3">di {recommendation.author}</p>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                {recommendation.description}
              </p>
              
              <a
                href={getAmazonAffiliateLink(recommendation.title, recommendation.author)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-amber-500 hover:text-amber-400 transition-colors"
              >
                Cercalo su Amazon <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
