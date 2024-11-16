import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface GenderSelectorProps {
    selectedGender: string;
    onGenderChange: (gender: string) => void;
    themeColor: string;
}

const GenderSelector: React.FC<GenderSelectorProps> = ({
    selectedGender,
    onGenderChange,
    themeColor
}) => {
    const { t } = useLanguage();

    return (
        <div className="flex space-x-2">
            {['male', 'female'].map((gender) => (
                <button
                    key={gender}
                    onClick={() => onGenderChange(gender)}
                    className={`px-4 py-2 rounded-lg transition-colors ${selectedGender === gender
                            ? `bg-opacity-100 text-white`
                            : `bg-opacity-20 hover:bg-opacity-30 text-gray-300`
                        }`}
                    style={{ backgroundColor: selectedGender === gender ? themeColor : `${themeColor}40` }}
                >
                    {t(`gender.${gender}`)}
                </button>
            ))}
        </div>
    );
};

export default GenderSelector;