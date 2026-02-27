import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils';

interface Props {
  language: string;
  onNext: (soilColor: string) => void;
  onBack: () => void;
}

const soilTypes = [
  { id: 'black', mr: 'काळा', hi: 'काली', en: 'Black', color: 'bg-zinc-900' },
  { id: 'red', mr: 'लाल', hi: 'लाल', en: 'Red', color: 'bg-red-800' },
  { id: 'alluvial', mr: 'गाळाचा', hi: 'जलोढ़', en: 'Alluvial', color: 'bg-amber-700' },
  { id: 'laterite', mr: 'जांभा', hi: 'लेटराइट', en: 'Laterite', color: 'bg-orange-900' },
  { id: 'sandy', mr: 'वाळूचा', hi: 'रेतीली', en: 'Sandy', color: 'bg-yellow-600' },
];

export function SoilColorStep({ language, onNext, onBack }: Props) {
  const [selectedSoil, setSelectedSoil] = useState<string | null>(null);

  const handleSubmit = () => {
    if (selectedSoil) {
      onNext(selectedSoil);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-md mx-auto w-full bg-white rounded-2xl shadow-xl p-6 md:p-8"
    >
      <h2 className="text-2xl font-bold text-emerald-900 mb-6 text-center">
        {language === 'mr' ? 'मातीचा प्रकार' : language === 'hi' ? 'मिट्टी का प्रकार' : 'Soil Type'}
      </h2>
      <p className="text-gray-600 mb-6 text-center text-sm">
        {language === 'mr' 
          ? 'तुमच्या शेतातील मातीचा रंग निवडा' 
          : language === 'hi' ? 'अपने खेत की मिट्टी का रंग चुनें' : 'Select the color of your soil'}
      </p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {soilTypes.map((soil) => (
          <button
            key={soil.id}
            onClick={() => setSelectedSoil(soil.id)}
            className={cn(
              "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all",
              selectedSoil === soil.id
                ? "border-emerald-500 bg-emerald-50"
                : "border-gray-200 hover:border-emerald-200"
            )}
          >
            <div className={cn("w-12 h-12 rounded-full mb-3 shadow-inner", soil.color)} />
            <span className="font-medium text-gray-800">
              {language === 'mr' ? soil.mr : language === 'hi' ? soil.hi : soil.en}
            </span>
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
        >
          {language === 'mr' ? 'मागे' : language === 'hi' ? 'पीछे' : 'Back'}
        </button>
        <button
          onClick={handleSubmit}
          disabled={!selectedSoil}
          className="flex-1 bg-emerald-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {language === 'mr' ? 'पुढे जा' : language === 'hi' ? 'आगे बढ़ें' : 'Continue'}
        </button>
      </div>
    </motion.div>
  );
}
