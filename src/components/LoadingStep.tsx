import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface Props {
  language: string;
  messageMr: string;
  messageHi: string;
  messageEn: string;
}

export function LoadingStep({ language, messageMr, messageHi, messageEn }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-xl max-w-md mx-auto w-full"
    >
      <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-6" />
      <h3 className="text-xl font-bold text-emerald-900 text-center">
        {language === 'mr' ? messageMr : language === 'hi' ? messageHi : messageEn}
      </h3>
      <p className="text-gray-500 text-sm mt-2 text-center">
        {language === 'mr' ? 'कृपया प्रतीक्षा करा...' : language === 'hi' ? 'कृपया प्रतीक्षा करें...' : 'Please wait...'}
      </p>
    </motion.div>
  );
}
