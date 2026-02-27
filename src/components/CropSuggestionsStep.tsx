import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CloudRain, Sprout, ArrowRight, Search, Thermometer, Droplets, CloudLightning, Image as ImageIcon, Share2, Volume2, VolumeX, AlertTriangle } from 'lucide-react';
import { CropSuggestionResponse, generateCropImage } from '../services/geminiService';

interface Props {
  language: string;
  data: CropSuggestionResponse;
  onSelectCrop: (cropName: string) => void;
  onBack: () => void;
}

function CropCard({ crop, language, onClick }: { crop: any, language: string, onClick: () => void }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    generateCropImage(crop.name, "16:9").then(url => {
      if (isMounted) {
        setImageUrl(url || `https://image.pollinations.ai/prompt/realistic%20close%20up%20photo%20of%20${encodeURIComponent(crop.name)}%20crop%20in%20a%20farm%20field?width=800&height=450&nologo=true`);
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, [crop.name]);

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md hover:border-emerald-300 overflow-hidden transition-all flex flex-col group"
    >
      <div className="h-40 bg-emerald-50 relative overflow-hidden w-full border-b border-emerald-50">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-emerald-600/40">
             <ImageIcon className="w-8 h-8 mb-2 animate-pulse" />
             <span className="text-xs font-medium">Loading image...</span>
          </div>
        ) : imageUrl ? (
          <img src={imageUrl} alt={crop.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" referrerPolicy="no-referrer" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
             <ImageIcon className="w-8 h-8 text-emerald-200" />
          </div>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col w-full relative">
        <div className="absolute top-5 right-5 p-2 bg-emerald-50 text-emerald-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight className="w-4 h-4" />
        </div>
        <h4 className="text-xl font-bold text-emerald-900 mb-2 pr-8">
          {crop.name}
        </h4>
        <p className="text-gray-600 text-sm leading-relaxed mb-4 flex-1">
          {crop.reason}
        </p>
        
        {crop.expectedYield && crop.profitability && (
          <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-emerald-50">
            <div>
              <span className="block text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
                {language === 'mr' ? 'अपेक्षित उत्पन्न' : language === 'hi' ? 'अपेक्षित उपज' : 'Expected Yield'}
              </span>
              <span className="text-sm font-medium text-gray-800">{crop.expectedYield}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
                {language === 'mr' ? 'नफा / मागणी' : language === 'hi' ? 'लाभ / मांग' : 'Profitability'}
              </span>
              <span className="text-sm font-medium text-gray-800">{crop.profitability}</span>
            </div>
          </div>
        )}
      </div>
    </motion.button>
  );
}

export function CropSuggestionsStep({ language, data, onSelectCrop, onBack }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSelectCrop(searchQuery.trim());
    }
  };

  const handleShare = async () => {
    const cropNames = data.suggestedCrops.map(c => c.name).join(', ');
    const text = language === 'mr' 
      ? `स्मार्ट शेतकरी ॲपवर या पिकांच्या शिफारशी पहा: ${cropNames}`
      : language === 'hi'
      ? `स्मार्ट किसान ऐप पर इन फसल सुझावों को देखें: ${cropNames}`
      : `Check out these crop suggestions on the Smart Shetkari App: ${cropNames}`;
      
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Smart Shetkari',
          text: text,
          url: window.location.href,
        });
      } else {
        alert(text);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handlePlayWeatherAudio = () => {
    if (!('speechSynthesis' in window)) {
      alert(language === 'mr' ? 'तुमचा ब्राउझर ऑडिओला सपोर्ट करत नाही.' : language === 'hi' ? 'आपका ब्राउज़र ऑडियो का समर्थन नहीं करता है।' : 'Audio is not supported in your browser.');
      return;
    }
    
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const text = language === 'mr' 
      ? `हवामान अंदाज: ${data.weatherForecast}. तापमान: ${data.weatherDetails.temperature}. आर्द्रता: ${data.weatherDetails.humidity}. पावसाची शक्यता: ${data.weatherDetails.rainChance}.`
      : language === 'hi'
      ? `मौसम का पूर्वानुमान: ${data.weatherForecast}. तापमान: ${data.weatherDetails.temperature}. नमी: ${data.weatherDetails.humidity}. बारिश की संभावना: ${data.weatherDetails.rainChance}.`
      : `Weather Forecast: ${data.weatherForecast}. Temperature: ${data.weatherDetails.temperature}. Humidity: ${data.weatherDetails.humidity}. Chance of rain: ${data.weatherDetails.rainChance}.`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.9; // Slightly slower for clarity
    
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const rainChanceNum = parseInt(data.weatherDetails?.rainChance?.replace(/\D/g, '') || '0');
  const isCriticalWeather = rainChanceNum > 50 || data.weatherForecast.toLowerCase().includes('heavy') || data.weatherForecast.includes('मुसळधार') || data.weatherForecast.includes('भारी');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="max-w-4xl mx-auto w-full"
    >
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative flex items-center">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-emerald-600" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'mr' ? 'कोणतेही पीक, खत किंवा कीटकनाशक शोधा...' : 
                language === 'hi' ? 'कोई भी फसल, उर्वरक या कीटनाशक खोजें...' : 
                'Search for crops, fertilizers, or prices...'
              }
              className="block w-full pl-12 pr-24 py-4 bg-emerald-50/50 border-2 border-emerald-100 rounded-2xl focus:ring-emerald-500 focus:border-emerald-500 shadow-sm text-gray-800 placeholder-gray-500 transition-all"
            />
            <button
              type="submit"
              disabled={!searchQuery.trim()}
              className="absolute right-2 top-2 bottom-2 px-4 md:px-6 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {language === 'mr' ? 'शोधा' : language === 'hi' ? 'खोजें' : 'Search'}
            </button>
          </div>
        </form>

        <div className={`p-6 rounded-2xl border ${isCriticalWeather ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-100'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${isCriticalWeather ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                {isCriticalWeather ? <AlertTriangle className="w-6 h-6" /> : <CloudRain className="w-6 h-6" />}
              </div>
              <h3 className={`text-xl font-bold ${isCriticalWeather ? 'text-orange-900' : 'text-blue-900'}`}>
                {language === 'mr' ? 'हवामान अंदाज' : language === 'hi' ? 'मौसम का पूर्वानुमान' : 'Weather Forecast'}
              </h3>
            </div>
            <button
              onClick={handlePlayWeatherAudio}
              className={`p-2 rounded-full transition-colors flex items-center gap-2 px-4 border shadow-sm ${
                isCriticalWeather 
                  ? 'bg-orange-600 text-white hover:bg-orange-700 border-orange-700' 
                  : 'bg-white text-blue-600 hover:bg-blue-100 border-blue-200'
              } ${isPlaying ? 'animate-pulse' : ''}`}
              aria-label="Play Audio Alert"
            >
              {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span className="text-sm font-medium hidden sm:inline">
                {isPlaying 
                  ? (language === 'mr' ? 'थांबवा' : language === 'hi' ? 'रोकें' : 'Stop')
                  : (language === 'mr' ? 'ऐका' : language === 'hi' ? 'सुनें' : 'Listen')}
              </span>
            </button>
          </div>
          
          {data.weatherDetails && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className={`bg-white p-3 rounded-xl border flex flex-col items-center text-center ${isCriticalWeather ? 'border-orange-100' : 'border-blue-100'}`}>
                <Thermometer className="w-6 h-6 text-orange-500 mb-1" />
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">
                  {language === 'mr' ? 'तापमान' : language === 'hi' ? 'तापमान' : 'Temp'}
                </span>
                <span className="font-bold text-gray-900">{data.weatherDetails.temperature}</span>
              </div>
              <div className={`bg-white p-3 rounded-xl border flex flex-col items-center text-center ${isCriticalWeather ? 'border-orange-100' : 'border-blue-100'}`}>
                <Droplets className="w-6 h-6 text-blue-500 mb-1" />
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">
                  {language === 'mr' ? 'आर्द्रता' : language === 'hi' ? 'नमी' : 'Humidity'}
                </span>
                <span className="font-bold text-gray-900">{data.weatherDetails.humidity}</span>
              </div>
              <div className={`bg-white p-3 rounded-xl border flex flex-col items-center text-center ${isCriticalWeather ? 'border-orange-100' : 'border-blue-100'}`}>
                <CloudLightning className="w-6 h-6 text-indigo-500 mb-1" />
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">
                  {language === 'mr' ? 'पाऊस' : language === 'hi' ? 'बारिश' : 'Rain'}
                </span>
                <span className="font-bold text-gray-900">{data.weatherDetails.rainChance}</span>
              </div>
            </div>
          )}

          <p className={`${isCriticalWeather ? 'text-orange-800 font-medium' : 'text-blue-800'} leading-relaxed`}>
            {data.weatherForecast}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-full text-emerald-600 shadow-sm">
              <Sprout className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-emerald-900">
              {language === 'mr' ? 'सुचवलेली पिके' : language === 'hi' ? 'सुझाई गई फसलें' : 'Suggested Crops'}
            </h3>
          </div>
          <button
            onClick={handleShare}
            className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-full transition-colors flex items-center gap-2 px-4 bg-white border border-emerald-200 shadow-sm"
            aria-label="Share"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">
              {language === 'mr' ? 'शेअर करा' : language === 'hi' ? 'शेयर करें' : 'Share'}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.suggestedCrops.map((crop, index) => (
            <CropCard 
              key={index} 
              crop={crop} 
              language={language} 
              onClick={() => onSelectCrop(crop.name)} 
            />
          ))}
        </div>
      </div>

      <div className="flex justify-center mt-8">
        <button
          onClick={onBack}
          className="py-3 px-8 border border-gray-300 bg-white rounded-xl text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors shadow-sm"
        >
          {language === 'mr' ? 'मागे' : language === 'hi' ? 'पीछे' : 'Back'}
        </button>
      </div>
    </motion.div>
  );
}
