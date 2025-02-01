export interface CharacterI18n {
  age: string;
  description: string;
}

export interface Character {
  id: string;
  name: string;
  profile: string;
  image: string;
  promptFile: string;
  avatarFile: string;
  gender: 'male' | 'female' | 'celebrity' | 'pet' | 'gods' | undefined;
  borderColor?: string;
  i18n: {
    en: CharacterI18n;
    zh: CharacterI18n;
  };
}