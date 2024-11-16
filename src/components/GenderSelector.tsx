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

    const genderOptions = [
        { value: 'female', label: t('gender.female') },
        { value: 'male', label: t('gender.male') }
    ];

    return (
        <div className="flex space-x-2">
            {genderOptions.map((gender) => (
                <button
                    key={gender.value}
                    onClick={() => onGenderChange(gender.value)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                        selectedGender === gender.value
                            ? 'bg-opacity-100 text-white shadow-lg scale-105'
                            : 'bg-opacity-20 hover:bg-opacity-30 text-gray-600 dark:text-gray-300'
                    }`}
                    style={{
                        backgroundColor: selectedGender === gender.value 
                            ? themeColor 
                            : 'transparent',
                        border: `2px solid ${themeColor}`,
                        transform: selectedGender === gender.value ? 'scale(1.05)' : 'scale(1)'
                    }}
                >
                    {gender.label}
                </button>
            ))}
        </div>
    );
};

export default GenderSelector;