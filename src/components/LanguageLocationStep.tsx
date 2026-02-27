import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation } from 'lucide-react';
import { cn } from '../utils';

interface Props {
  onNext: (language: string, location: string, latLng: { lat: number, lng: number } | null) => void;
}

export function LanguageLocationStep({ onNext }: Props) {
  const [language, setLanguage] = useState<'mr' | 'hi' | 'en'>('mr');
  const [location, setLocation] = useState('');
  const [latLng, setLatLng] = useState<{ lat: number, lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const handleGetLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatLng({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocation(`Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`);
          setIsLocating(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert(language === 'mr' ? 'स्थान मिळवण्यात त्रुटी' : language === 'hi' ? 'स्थान प्राप्त करने में त्रुटि' : 'Error getting location');
          setIsLocating(false);
        }
      );
    } else {
      alert(language === 'mr' ? 'तुमच्या ब्राउझरमध्ये भौगोलिक स्थान समर्थित नाही' : language === 'hi' ? 'आपके ब्राउज़र में जियोलोकेशन समर्थित नहीं है' : 'Geolocation is not supported by your browser');
      setIsLocating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (location.trim()) {
      onNext(language, location, latLng);
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
        {language === 'mr' ? 'स्वागत आहे' : language === 'hi' ? 'स्वागत है' : 'Welcome'}
      </h2>

      <div className="space-y-6">
        {/* Language Selection */}
        <div>
          <label className="block text-sm font-medium text-emerald-800 mb-2">
            {language === 'mr' ? 'भाषा निवडा' : language === 'hi' ? 'भाषा चुनें' : 'Select Language'}
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setLanguage('mr')}
              className={cn(
                "py-3 px-2 rounded-xl border-2 transition-all font-medium text-sm",
                language === 'mr'
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 text-gray-600 hover:border-emerald-200"
              )}
            >
              मराठी
            </button>
            <button
              type="button"
              onClick={() => setLanguage('hi')}
              className={cn(
                "py-3 px-2 rounded-xl border-2 transition-all font-medium text-sm",
                language === 'hi'
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 text-gray-600 hover:border-emerald-200"
              )}
            >
              हिंदी
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={cn(
                "py-3 px-2 rounded-xl border-2 transition-all font-medium text-sm",
                language === 'en'
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 text-gray-600 hover:border-emerald-200"
              )}
            >
              English
            </button>
          </div>
        </div>

        {/* Location Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-emerald-800 mb-2">
              {language === 'mr' ? 'तुमचे गाव किंवा शहर' : language === 'hi' ? 'आपका गाँव या शहर' : 'Your Village or City'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={language === 'mr' ? 'उदा. पुणे, महाराष्ट्र' : language === 'hi' ? 'उदा. पुणे, महाराष्ट्र' : 'e.g. Pune, Maharashtra'}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {language === 'mr' ? 'किंवा' : language === 'hi' ? 'या' : 'or'}
            </span>
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={isLocating}
              className="flex items-center text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              <Navigation className="h-4 w-4 mr-1" />
              {isLocating 
                ? (language === 'mr' ? 'स्थान शोधत आहे...' : language === 'hi' ? 'स्थान खोज रहा है...' : 'Locating...') 
                : (language === 'mr' ? 'माझे स्थान वापरा' : language === 'hi' ? 'मेरे स्थान का उपयोग करें' : 'Use my location')}
            </button>
          </div>

          <button
            type="submit"
            disabled={!location.trim()}
            className="w-full bg-emerald-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {language === 'mr' ? 'पुढे जा' : language === 'hi' ? 'आगे बढ़ें' : 'Continue'}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
