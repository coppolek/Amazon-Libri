import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface AppConfig {
  defaultSearchQuery: string;
}

export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'searchSettings'), (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data() as AppConfig);
      } else {
        setConfig({ defaultSearchQuery: "Le novità più interessanti in Libri" });
      }
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching AppConfig', error);
      setConfig({ defaultSearchQuery: "Le novità più interessanti in Libri" });
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  return { config, isLoading };
}
