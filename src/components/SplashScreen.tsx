import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { generateLogoImage } from '../services/geminiService';
import { Sprout } from 'lucide-react';

interface Props {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: Props) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchLogo = async () => {
      const cachedLogo = localStorage.getItem('smart_shetkari_logo');
      if (cachedLogo) {
        if (isMounted) setLogoUrl(cachedLogo);
        return;
      }
      
      try {
        const url = await generateLogoImage();
        if (isMounted) {
          if (url) {
            setLogoUrl(url);
            localStorage.setItem('smart_shetkari_logo', url);
          } else {
            setLogoUrl("https://picsum.photos/seed/smart-shetkari-logo/400/400");
          }
        }
      } catch (e) {
        console.error(e);
        if (isMounted) {
          setLogoUrl("https://picsum.photos/seed/smart-shetkari-logo/400/400");
        }
      }
    };

    fetchLogo();

    const timer = setTimeout(() => {
      onFinish();
    }, 5000); // Show splash screen for 5 seconds
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [onFinish]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      className="fixed inset-0 bg-emerald-50 flex flex-col items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
        className="flex flex-col items-center text-center px-4"
      >
        <div className="w-48 h-48 md:w-64 md:h-64 bg-white rounded-full shadow-2xl flex items-center justify-center mb-8 overflow-hidden border-4 border-emerald-100 relative">
          {logoUrl ? (
            <motion.img 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              src={logoUrl} 
              alt="Smart Shetkari Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex flex-col items-center text-emerald-600/60">
              <Sprout className="w-12 h-12 mb-2 animate-pulse" />
              <span className="text-xs font-medium">Generating Logo...</span>
            </div>
          )}
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-emerald-900 mb-4 tracking-tight">
          Smart Shetkari
        </h1>
        <p className="text-emerald-700 text-lg md:text-xl font-medium max-w-md">
          Empowering Farmers with Smart Technology
        </p>
      </motion.div>
    </motion.div>
  );
}
