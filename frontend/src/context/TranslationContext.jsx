import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = "https://api.shramsetu.in";

// Translation context
const TranslationContext = createContext(null);

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

export const TranslationProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTranslations(language);
  }, [language]);

  const fetchTranslations = async (lang) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/translations/${lang}`);
      setTranslations(response.data);
    } catch (error) {
      console.error('Failed to fetch translations:', error);
      // Fallback to English
      setTranslations({});
    } finally {
      setLoading(false);
    }
  };

  const changeLanguage = async (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);

    // Update user preference if logged in
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await axios.patch(`${API_URL}/api/auth/language?language=${lang}`);
      } catch (error) {
        console.error('Failed to update language preference:', error);
      }
    }
  };

  const t = (key) => {
    return translations[key] || key;
  };

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
    { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' }
  ];

  return (
    <TranslationContext.Provider
      value={{
        language,
        translations,
        loading,
        changeLanguage,
        t,
        languages
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};
