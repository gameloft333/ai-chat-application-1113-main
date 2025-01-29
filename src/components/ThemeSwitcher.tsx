import { THEME_CONFIG } from '../config/theme-config';

const ThemeSwitcher: React.FC = () => {
  // If theme switcher is disabled, do not render anything
  if (!THEME_CONFIG.enableThemeSwitcher) {
    return null;
  }

  return (
    <button 
      className="p-2.5 rounded-full transition-all duration-300 hover:scale-110 
        bg-gray-700 hover:bg-gray-600 
        focus:outline-none focus:ring-2 focus:ring-offset-2 
        focus:ring-white dark:focus:ring-offset-gray-800"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" 
        fill="none" stroke="currentColor" strokeWidth="2" 
        strokeLinecap="round" strokeLinejoin="round" 
        className="lucide lucide-sun w-5 h-5 text-yellow-400"
      >
        {/* SVG Path */}
      </svg>
    </button>
  );
};

export default ThemeSwitcher;
