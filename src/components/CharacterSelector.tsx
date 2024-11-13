import React, { useState } from 'react';
import { Character, characters } from '../types/character';

interface CharacterSelectorProps {
  onSelectCharacter: (character: Character) => void;
  maxCharacters?: number;
}

const shuffleArray = (array: Character[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const CharacterSelector: React.FC<CharacterSelectorProps> = ({
  onSelectCharacter,
  maxCharacters = characters.length
}) => {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [popularityText, setPopularityText] = useState<string>('');

  const shuffledCharacters = shuffleArray([...characters]).slice(0, maxCharacters);

  const handleCharacterSelect = (characterId: string) => {
    setSelectedCharacterId(characterId);
    
    const character = characters.find(c => c.id === characterId);
    if (character) {
      setPopularityText(`${character.name} 是我们最受欢迎的AI伴侣之一`);
    }
  };

  return (
    <div className="grid grid-cols-4 gap-4">
      {shuffledCharacters.map((character) => (
        <div
          key={character.id}
          className="cursor-pointer transition-all duration-300 transform hover:scale-105"
          onClick={() => onSelectCharacter(character)}
        >
          <img
            src={character.avatarFile}
            alt={character.name}
            className="w-full h-auto rounded-lg shadow-lg"
            style={{ aspectRatio: '9 / 16', objectFit: 'cover' }}
          />
          <p className="text-center text-white mt-2 font-serif">{character.name}</p>
        </div>
      ))}
      <div className="text-center mt-4">
        {popularityText || "请选择您想要交谈的AI伴侣"}
      </div>
    </div>
  );
};

export default CharacterSelector;
