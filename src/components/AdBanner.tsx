import React, { useEffect, useRef } from 'react';

export const AdBanner: React.FC = () => {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (adRef.current && !adRef.current.hasAttribute('data-adsbygoogle-status')) {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err: any) {
        if (err.message && err.message.includes('already have ads in them')) {
          // Ignore strict mode double-renders
        } else if (err.message && err.message.includes('No slot size')) {
          // Ignore when width is not yet calculated
        } else {
          console.error('Errore nel caricamento dell\'annuncio AdSense:', err);
        }
      }
    }
  }, []);

  return (
    <div className="w-full text-center overflow-hidden py-4 my-8 min-h-[100px] min-w-[250px] flex justify-center items-center">
      {/* Altervista-ilmakeup-auto_block */}
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client="ca-pub-5738943819550045"
        data-ad-slot="3500759983"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};
