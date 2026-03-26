import React from 'react';
import { useTranslation } from '../context/TranslationContext';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Globe, Check } from 'lucide-react';

const LanguageSelector = ({ variant = 'default' }) => {
  const { language, changeLanguage, languages } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant === 'ghost' ? 'ghost' : 'outline'}
          size="sm"
          className="gap-2"
          data-testid="language-selector"
        >
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline">
            {languages.find(l => l.code === language)?.nativeName || 'English'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className="gap-2"
            data-testid={`lang-${lang.code}`}
          >
            {language === lang.code && <Check className="w-4 h-4" />}
            <span className={language !== lang.code ? 'pl-6' : ''}>
              {lang.nativeName} ({lang.name})
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
