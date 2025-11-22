import { useEffect, useRef, useState } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface AdUnitProps {
  type: 'google' | 'amazon';
  format: 'horizontal' | 'vertical' | 'square';
  slot?: 'headerBanner' | 'sidebarTop' | 'sidebarBottom' | 'footerBanner';
  className?: string;
}

export function AdUnit({ type, format, slot, className = '' }: AdUnitProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const [adConfig, setAdConfig] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetchAdConfig();
  }, []);

  useEffect(() => {
    if (adConfig && adRef.current) {
      loadAd();
    }
  }, [adConfig, type, slot]);

  const fetchAdConfig = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/ad-config`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAdConfig(data);
      }
    } catch (error) {
      console.error('Error fetching ad config:', error);
    }
  };

  const loadAd = () => {
    if (!adRef.current) return;

    if (type === 'google' && adConfig?.googleAdSense?.enabled) {
      loadGoogleAd();
    } else if (type === 'amazon' && adConfig?.amazonAssociates?.enabled) {
      loadAmazonAd();
    }
  };

  const loadGoogleAd = () => {
    if (!adConfig?.googleAdSense?.clientId || !slot) return;

    const slotId = adConfig.googleAdSense.slots?.[slot];
    if (!slotId) return;

    // Load AdSense script if not already loaded
    if (!window.adsbygoogle) {
      const script = document.createElement('script');
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adConfig.googleAdSense.clientId}`;
      script.async = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }

    // Create ad element
    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', adConfig.googleAdSense.clientId);
    ins.setAttribute('data-ad-slot', slotId);
    
    if (format === 'horizontal') {
      ins.setAttribute('data-ad-format', 'horizontal');
      ins.setAttribute('data-full-width-responsive', 'true');
    } else if (format === 'vertical') {
      ins.setAttribute('data-ad-format', 'vertical');
    }

    if (adRef.current) {
      adRef.current.innerHTML = '';
      adRef.current.appendChild(ins);
      
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setIsLoaded(true);
      } catch (err) {
        console.error('AdSense error:', err);
      }
    }
  };

  const loadAmazonAd = () => {
    // Amazon affiliate link placeholder
    // In production, you would generate actual Amazon affiliate links
    setIsLoaded(true);
  };

  const getAdDimensions = () => {
    switch (format) {
      case 'horizontal':
        return 'h-24 md:h-32';
      case 'vertical':
        return 'h-64 md:h-96';
      case 'square':
        return 'h-64 w-64';
      default:
        return 'h-32';
    }
  };

  const getAdLabel = () => {
    if (type === 'google') {
      return 'Google Ad';
    } else {
      return 'Amazon Ad';
    }
  };

  // Don't render if ads are not enabled
  if (type === 'google' && !adConfig?.googleAdSense?.enabled) return null;
  if (type === 'amazon' && !adConfig?.amazonAssociates?.enabled) return null;

  return (
    <div className={`${className}`}>
      <div
        ref={adRef}
        className={`w-full ${getAdDimensions()} ${!isLoaded ? 'bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center' : ''}`}
      >
        {!isLoaded && (
          <div className="text-center">
            <p className="text-gray-400">{getAdLabel()}</p>
            <p className="text-gray-300 text-sm">{format}</p>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-1 text-center">Advertisement</p>
    </div>
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}