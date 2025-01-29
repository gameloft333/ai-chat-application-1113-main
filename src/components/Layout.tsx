import { THEME_CONFIG } from '../config/app-config';
import ThemeSwitcher from './ThemeSwitcher';

const Layout: React.FC = () => {
  return (
    <div className="flex items-center space-x-3">
      <ChoosePlan />
      {THEME_CONFIG.enableThemeSwitcher && <ThemeSwitcher />}
      <LanguageSwitcher />
      <UserAvatar />
    </div>
  );
}; 