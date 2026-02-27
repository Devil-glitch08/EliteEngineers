import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Info, ArrowLeft, Image as ImageIcon, Search, TrendingUp, Share2, Volume2, VolumeX } from 'lucide-react';
import Markdown from 'react-markdown';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CropDetailsResponse, generateCropImage, getCropPriceTrends, PriceTrendData } from '../services/geminiService';

interface Props {
  language: string;
  cropName: string;
  details: CropDetailsResponse;
  location: string;
  onBack: () => void;
  onRestart: () => void;
  onSearch: (query: string) => void;
}

export function CropDetailsStep({ language, cropName, details, location, onBack, onRestart, onSearch }: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceTrends, setPriceTrends] = useState<PriceTrendData[] | null>(null);
  const [loadingTrends, setLoadingTrends] = useState(true);
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
      onSearch(searchQuery.trim());
      setSearchQuery('');
    }
  };

  const handleShare = async () => {
    const text = language === 'mr' 
      ? `स्मार्ट शेतकरी ॲपवर ${cropName} ची सविस्तर माहिती आणि बाजारभाव पहा.`
      : language === 'hi'
      ? `स्मार्ट किसान ऐप पर ${cropName} की विस्तृत जानकारी और बाजार मूल्य देखें।`
      : `Check out the detailed information and market prices for ${cropName} on the Smart Shetkari App.`;
      
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

  const handlePlayPriceAudio = () => {
    if (!('speechSynthesis' in window) || !priceTrends || priceTrends.length === 0) {
      alert(language === 'mr' ? 'तुमचा ब्राउझर ऑडिओला सपोर्ट करत नाही.' : language === 'hi' ? 'आपका ब्राउज़र ऑडियो का समर्थन नहीं करता है।' : 'Audio is not supported in your browser.');
      return;
    }
    
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const latest = priceTrends[priceTrends.length - 1];
    const text = language === 'mr' 
      ? `बाजारभाव कल: ${latest.month} मध्ये ${cropName} ची किंमत ${latest.price} रुपये आहे.`
      : language === 'hi'
      ? `बाजार मूल्य रुझान: ${latest.month} में ${cropName} का मूल्य ${latest.price} रुपये है.`
      : `Market Price Trends: The price of ${cropName} in ${latest.month} is ${latest.price} rupees.`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.9;
    
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    let isMounted = true;
    
    const fetchImage = async () => {
      setLoadingImage(true);
      const url = await generateCropImage(cropName);
      if (isMounted) {
        setImageUrl(url || `https://image.pollinations.ai/prompt/realistic%20close%20up%20photo%20of%20${encodeURIComponent(cropName)}%20crop%20in%20a%20farm%20field?width=1200&height=675&nologo=true`);
        setLoadingImage(false);
      }
    };

    const fetchTrends = async () => {
      setLoadingTrends(true);
      try {
        const trends = await getCropPriceTrends(language, location, cropName);
        if (isMounted) {
          setPriceTrends(trends);
          setLoadingTrends(false);
        }
      } catch (e) {
        console.error("Failed to fetch price trends", e);
        if (isMounted) setLoadingTrends(false);
      }
    };

    fetchImage();
    fetchTrends();

    return () => {
      isMounted = false;
    };
  }, [cropName, language, location]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto w-full bg-white rounded-2xl shadow-xl overflow-hidden"
    >
      <div className="bg-emerald-600 p-6 md:p-8 text-white relative">
        <button
          onClick={onBack}
          className="absolute top-6 left-6 p-2 bg-emerald-700/50 hover:bg-emerald-700 rounded-full transition-colors z-10"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={handleShare}
          className="absolute top-6 right-6 p-2 bg-emerald-700/50 hover:bg-emerald-700 rounded-full transition-colors z-10"
          aria-label="Share"
        >
          <Share2 className="w-5 h-5" />
        </button>
        <div className="text-center mt-2 relative z-10">
          <h2 className="text-3xl font-bold mb-2">{cropName}</h2>
          <p className="text-emerald-100 opacity-90">
            {language === 'mr' ? 'सविस्तर माहिती आणि कृती आराखडा' : language === 'hi' ? 'विस्तृत जानकारी और कार्य योजना' : 'Detailed Information & Action Plan'}
          </p>
        </div>
      </div>

      {/* AI Generated Image Section */}
      <div className="w-full h-48 md:h-64 bg-emerald-50 relative overflow-hidden flex items-center justify-center border-b border-emerald-100">
        {loadingImage ? (
          <div className="flex flex-col items-center text-emerald-600/60">
            <ImageIcon className="w-8 h-8 mb-2 animate-pulse" />
            <span className="text-sm font-medium">
              {language === 'mr' ? 'चित्र तयार करत आहे...' : language === 'hi' ? 'छवि उत्पन्न कर रहा है...' : 'Generating image...'}
            </span>
          </div>
        ) : imageUrl ? (
          <motion.img 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            src={imageUrl} 
            alt={cropName} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex flex-col items-center text-emerald-600/40">
            <ImageIcon className="w-8 h-8 mb-2" />
            <span className="text-sm">Image unavailable</span>
          </div>
        )}
      </div>

      <div className="p-6 md:p-8">
        {/* Search Bar for Pesticides/Fertilizers */}
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

        {/* Price Trends Chart */}
        {!loadingTrends && priceTrends && priceTrends.length > 0 && (
          <div className="mb-10 p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {language === 'mr' ? 'बाजारभाव कल (मागील ६ महिने)' : language === 'hi' ? 'बाजार मूल्य रुझान (पिछले 6 महीने)' : 'Market Price Trends (Last 6 Months)'}
              </h3>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceTrends} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`₹${value}`, language === 'mr' ? 'किंमत' : language === 'hi' ? 'मूल्य' : 'Price']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4, stroke: '#ffffff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="prose prose-emerald max-w-none prose-headings:text-emerald-900 prose-a:text-emerald-600 hover:prose-a:text-emerald-500">
          <Markdown>{details.markdown}</Markdown>
        </div>

        {details.mapLinks && details.mapLinks.length > 0 && (
          <div className="mt-8 p-6 bg-gray-50 rounded-2xl border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {language === 'mr' ? 'जवळची दुकाने' : language === 'hi' ? 'आसपास की दुकानें' : 'Nearby Shops'}
              </h3>
            </div>
            <ul className="space-y-3">
              {details.mapLinks.map((link, i) => (
                <li key={i}>
                  <a
                    href={link.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all group"
                  >
                    <span className="flex-1 font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                      {link.title}
                    </span>
                    <MapPin className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <button
            onClick={onRestart}
            className="py-3 px-8 bg-emerald-100 text-emerald-800 font-bold rounded-xl hover:bg-emerald-200 transition-colors"
          >
            {language === 'mr' ? 'नवीन शोध सुरू करा' : language === 'hi' ? 'नई खोज शुरू करें' : 'Start New Search'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
