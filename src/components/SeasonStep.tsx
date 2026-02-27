import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, CloudRain, Snowflake } from 'lucide-react';

interface Props {
  language: string;
  onNext: (season: string) => void;
  onBack: () => void;
}

const seasons = [
  { id: 'kharif', mr: 'खरीप (पावसाळा)', hi: 'खरीफ (मानसून)', en: 'Kharif (Monsoon)', icon: CloudRain, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'rabi', mr: 'रब्बी (हिवाळा)', hi: 'रबी ( सर्दी)', en: 'Rabi (Winter)', icon: Snowflake, color: 'text-cyan-500', bg: 'bg-cyan-50' },
  { id: 'zaid', mr: 'उन्हाळी', hi: 'ज़ैद (गर्मी)', en: 'Zaid (Summer)', icon: Sun, color: 'text-orange-500', bg: 'bg-orange-50' },
];

export function SeasonStep({ language, onNext, onBack }: Props) {
  const [selectedSeason, setSelectedSeason] = useState('');

  const handleSubmit = () => {
    if (selectedSeason) {
      onNext(selectedSeason);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-md mx-auto w-full bg-white rounded-2xl shadow-xl p-6 md:p-8"
    >
      <h2 className="text-2xl font-bold text-emerald-900 mb-6 text-center">
        {language === 'mr' ? 'हंगाम निवडा' : language === 'hi' ? 'मौसम चुनें' : 'Select Season'}
      </h2>
      <p className="text-gray-600 mb-6 text-center text-sm">
        {language === 'mr' 
          ? 'तुम्ही कोणत्या हंगामात पीक घेऊ इच्छिता?' 
          : language === 'hi' ? 'आप किस मौसम में फसल लगाना चाहते हैं?' : 'In which season do you want to plant crops?'}
      </p>

      <div className="space-y-4 mb-8">
        {seasons.map((season) => {
          const Icon = season.icon;
          return (
            <button
              key={season.id}
              onClick={() => setSelectedSeason(season.id)}
              className={`w-full flex items-center p-4 rounded-xl border-2 transition-all ${
                selectedSeason === season.id
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-gray-200 hover:border-emerald-200 hover:bg-gray-50"
              }`}
            >
              <div className={`p-3 rounded-full mr-4 ${season.bg} ${season.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="font-medium text-gray-800 text-lg">
                {language === 'mr' ? season.mr : language === 'hi' ? season.hi : season.en}
              </span>
            </button>
          );
        })}
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
          disabled={!selectedSeason}
          className="flex-1 bg-emerald-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {language === 'mr' ? 'पुढे जा' : language === 'hi' ? 'आगे बढ़ें' : 'Continue'}
        </button>
      </div>
    </motion.div>
  );
}
