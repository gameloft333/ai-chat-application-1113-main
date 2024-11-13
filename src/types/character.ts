export interface Character {
  id: string;
  name: string;
  profile: string;
  image: string;
  promptFile: string;
  prompt?: string;
  avatarFile: string;
}

export const characters: Character[] = [
  { id: 'bertha', name: "Bertha", promptFile: 'bertha.txt', avatarFile: '/characters/bertha.png', image: '/characters/bertha.png' },
  { id: 'veronica', name: "Veronica", promptFile: 'veronica.txt', avatarFile: '/characters/veronica.png', image: '/characters/veronica.png' },
  { id: 'mary', name: "Mary", promptFile: 'mary.txt', avatarFile: '/characters/mary.png', image: '/characters/mary.png' },
  { id: 'dana', name: "Dana", promptFile: 'dana.txt', avatarFile: '/characters/dana.png', image: '/characters/dana.png' },
  { id: 'sophia', name: "Sophia", promptFile: 'sophia.txt', avatarFile: '/characters/sophia.png', image: '/characters/sophia.png' },
  { id: 'jing', name: "Jing", promptFile: 'jing.txt', avatarFile: '/characters/jing.png', image: '/characters/jing.png' },
  { id: 'lily', name: "Lily", promptFile: 'lily.txt', avatarFile: '/characters/lily.png', image: '/characters/lily.png' },
  { id: 'vivian', name: "Vivian", promptFile: 'vivian.txt', avatarFile: '/characters/vivian.png', image: '/characters/vivian.png' },
];
