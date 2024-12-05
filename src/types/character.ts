export type BorderColor = 'none' | 'white' | 'green' | 'blue' | 'purple' | 'orange';

export interface Character {
  id: string;
  name: string;
  profile: string;
  image: string;
  promptFile: string;
  prompt?: string;
  avatarFile: string;
  gender?: 'male' | 'female';
  borderColor?: BorderColor;
}

export const characters: Character[] = [
  {
    id: 'santaclaus',
    name: "Santa Claus",
    profile: "The jolly and generous gift-giver, bringing joy and wonder to children worldwide",
    promptFile: 'santaclaus.txt',
    avatarFile: '/characters/santaclaus.png',
    image: '/characters/santaclaus.png',
    gender: 'male'
  },
  {
    id: 'elonmusk',
    name: "Elon Musk",
    profile: "Innovation-driven tech leader revolutionizing space exploration and sustainable energy",
    promptFile: 'elonmusk.txt',
    avatarFile: '/characters/elonmusk.png',
    image: '/characters/elonmusk.png',
    gender: 'male'
  },
  {
    id: 'bertha',
    name: "Bertha",
    promptFile: 'bertha.txt',
    avatarFile: '/characters/bertha.png',
    image: '/characters/bertha.png',
    gender: 'female'
  },
  {
    id: 'veronica',
    name: "Veronica",
    promptFile: 'veronica.txt',
    avatarFile: '/characters/veronica.png',
    image: '/characters/veronica.png',
    gender: 'female'
  },
  {
    id: 'mary',
    name: "Mary",
    promptFile: 'mary.txt',
    avatarFile: '/characters/mary.png',
    image: '/characters/mary.png',
    gender: 'female'
  },
  {
    id: 'dana',
    name: "Dana",
    promptFile: 'dana.txt',
    avatarFile: '/characters/dana.png',
    image: '/characters/dana.png',
    gender: 'female'
  },
  {
    id: 'sophia',
    name: "Sophia",
    promptFile: 'sophia.txt',
    avatarFile: '/characters/sophia.png',
    image: '/characters/sophia.png',
    gender: 'female'
  },
  {
    id: 'jing',
    name: "Jing",
    promptFile: 'jing.txt',
    avatarFile: '/characters/jing.png',
    image: '/characters/jing.png',
    gender: 'female'
  },
  {
    id: 'lily',
    name: "Lily",
    promptFile: 'lily.txt',
    avatarFile: '/characters/lily.png',
    image: '/characters/lily.png',
    gender: 'female'
  },
  {
    id: 'vivian',
    name: "Vivian",
    promptFile: 'vivian.txt',
    avatarFile: '/characters/vivian.png',
    image: '/characters/vivian.png',
    gender: 'female'
  },
];