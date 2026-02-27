import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Leaf } from 'lucide-react';

import { SplashScreen } from './components/SplashScreen';
import { LoginStep } from './components/LoginStep';
import { RegisterStep } from './components/RegisterStep';
import { LanguageLocationStep } from './components/LanguageLocationStep';
import { SoilColorStep } from './components/SoilColorStep';
import { SeasonStep } from './components/SeasonStep';
import { CropSuggestionsStep } from './components/CropSuggestionsStep';
import { CropDetailsStep } from './components/CropDetailsStep';
import { LoadingStep } from './components/LoadingStep';

import {
  getCropSuggestions,
  getCropDetails,
  CropSuggestionResponse,
  CropDetailsResponse,
} from './services/geminiService';

type Step = 
  | 'SPLASH'
  | 'LOGIN'
  | 'REGISTER'
  | 'LOCATION'
  | 'SOIL'
  | 'SEASON'
  | 'LOADING_SUGGESTIONS'
  | 'SUGGESTIONS'
  | 'LOADING_DETAILS'
  | 'DETAILS';

export default function App() {
  const [step, setStep] = useState<Step>('SPLASH');
  
  // State
  const [language, setLanguage] = useState<'mr' | 'hi' | 'en'>('mr');
  const [location, setLocation] = useState('');
  const [latLng, setLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [soilColor, setSoilColor] = useState('');
  const [season, setSeason] = useState('');
  const [suggestions, setSuggestions] = useState<CropSuggestionResponse | null>(null);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [cropDetails, setCropDetails] = useState<CropDetailsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSplashFinish = () => {
    setStep('LOGIN');
  };

  const handleLogin = () => {
    setStep('LOCATION');
  };

  const handleRegisterSuccess = (loc: string, ll: { lat: number; lng: number } | null) => {
    if (loc) {
      setLocation(loc);
      setLatLng(ll);
    }
    setStep('LOCATION');
  };

  const handleLocationNext = (lang: string, loc: string, ll: { lat: number; lng: number } | null) => {
    setLanguage(lang as 'mr' | 'hi' | 'en');
    setLocation(loc);
    setLatLng(ll);
    setStep('SOIL');
  };

  const handleSoilNext = (color: string) => {
    setSoilColor(color);
    setStep('SEASON');
  };

  const handleSeasonNext = async (selectedSeason: string) => {
    setSeason(selectedSeason);
    setStep('LOADING_SUGGESTIONS');
    setError(null);
    try {
      const data = await getCropSuggestions(language, location, soilColor, selectedSeason);
      setSuggestions(data);
      setStep('SUGGESTIONS');
    } catch (err) {
      console.error(err);
      setError(language === 'mr' ? 'माहिती मिळवण्यात त्रुटी आली. कृपया पुन्हा प्रयत्न करा.' : language === 'hi' ? 'जानकारी प्राप्त करने में त्रुटि। कृपया पुनः प्रयास करें।' : 'Error fetching information. Please try again.');
      setStep('SEASON');
    }
  };

  const handleSelectCrop = async (cropName: string) => {
    setSelectedCrop(cropName);
    setStep('LOADING_DETAILS');
    setError(null);
    try {
      const data = await getCropDetails(language, location, latLng, cropName);
      setCropDetails(data);
      setStep('DETAILS');
    } catch (err) {
      console.error(err);
      setError(language === 'mr' ? 'माहिती मिळवण्यात त्रुटी आली. कृपया पुन्हा प्रयत्न करा.' : language === 'hi' ? 'जानकारी प्राप्त करने में त्रुटि। कृपया पुनः प्रयास करें।' : 'Error fetching information. Please try again.');
      setStep('SUGGESTIONS');
    }
  };

  const handleRestart = () => {
    setStep('LOCATION');
    setSuggestions(null);
    setCropDetails(null);
    setError(null);
  };

  const handleLogout = () => {
    setStep('LOGIN');
    setLocation('');
    setLatLng(null);
    setSuggestions(null);
    setCropDetails(null);
    setError(null);
  };

  if (step === 'SPLASH') {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <div className="min-h-screen bg-emerald-50/50 text-gray-900 font-sans selection:bg-emerald-200 relative">
      {(step === 'LOGIN' || step === 'REGISTER') && (
        <div 
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1586771107445-d3af2845233d?q=80&w=2070&auto=format&fit=crop")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-emerald-900/60 backdrop-blur-[2px]"></div>
        </div>
      )}

      {/* Header */}
      <header className={`${(step === 'LOGIN' || step === 'REGISTER') ? 'bg-transparent border-none absolute w-full' : 'bg-white border-b border-emerald-100 sticky'} top-0 z-20 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className={`flex items-center gap-2 ${(step === 'LOGIN' || step === 'REGISTER') ? 'text-white' : 'text-emerald-700'}`}>
            <Leaf className="w-6 h-6" />
            <h1 className="text-xl font-bold tracking-tight">Smart Shetkari</h1>
          </div>
          {step !== 'LOGIN' && step !== 'REGISTER' && (
            <div className="flex items-center gap-4">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'mr' | 'hi' | 'en')}
                className="text-sm font-medium bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="mr">मराठी</option>
                <option value="hi">हिंदी</option>
                <option value="en">English</option>
              </select>
              {step !== 'LOCATION' && (
                <button
                  onClick={handleRestart}
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-800"
                >
                  {language === 'mr' ? 'सुरुवातीला जा' : language === 'hi' ? 'शुरुआत में जाएं' : 'Go to Start'}
                </button>
              )}
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-red-600 hover:text-red-800"
              >
                {language === 'mr' ? 'लॉग आउट' : language === 'hi' ? 'लॉग आउट' : 'Logout'}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 relative z-10">
        {error && (
          <div className="max-w-md mx-auto mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 'LOGIN' && (
            <LoginStep 
              key="login" 
              onLogin={handleLogin} 
              onGoToRegister={() => setStep('REGISTER')} 
            />
          )}

          {step === 'REGISTER' && (
            <RegisterStep 
              key="register" 
              onRegisterSuccess={handleRegisterSuccess} 
              onGoToLogin={() => setStep('LOGIN')} 
            />
          )}

          {step === 'LOCATION' && (
            <LanguageLocationStep key="location" onNext={handleLocationNext} />
          )}
          
          {step === 'SOIL' && (
            <SoilColorStep 
              key="soil" 
              language={language} 
              onNext={handleSoilNext} 
              onBack={() => setStep('LOCATION')} 
            />
          )}

          {step === 'SEASON' && (
            <SeasonStep 
              key="season" 
              language={language} 
              onNext={handleSeasonNext} 
              onBack={() => setStep('SOIL')} 
            />
          )}

          {step === 'LOADING_SUGGESTIONS' && (
            <LoadingStep 
              key="loading-suggestions"
              language={language}
              messageMr="तुमच्यासाठी सर्वोत्तम पिके शोधत आहोत..."
              messageHi="आपके लिए सर्वोत्तम फसलें खोज रहे हैं..."
              messageEn="Finding the best crops for you..."
            />
          )}

          {step === 'SUGGESTIONS' && suggestions && (
            <CropSuggestionsStep
              key="suggestions"
              language={language}
              data={suggestions}
              onSelectCrop={handleSelectCrop}
              onBack={() => setStep('SEASON')}
            />
          )}

          {step === 'LOADING_DETAILS' && (
            <LoadingStep 
              key="loading-details"
              language={language}
              messageMr="सविस्तर माहिती आणि दुकाने शोधत आहोत..."
              messageHi="विस्तृत जानकारी और दुकानें खोज रहे हैं..."
              messageEn="Fetching details and nearby shops..."
            />
          )}

          {step === 'DETAILS' && cropDetails && (
            <CropDetailsStep
              key="details"
              language={language}
              cropName={selectedCrop}
              details={cropDetails}
              location={location}
              onBack={() => setStep('SUGGESTIONS')}
              onRestart={handleRestart}
              onSearch={handleSelectCrop}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
