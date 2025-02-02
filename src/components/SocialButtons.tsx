import React from 'react';
import { Twitter, Youtube, Facebook, Send } from 'lucide-react';

interface SocialButtonsProps {
  className?: string;
}

export const SocialButtons: React.FC<SocialButtonsProps> = ({ className }) => {
  const socialLinks = [
    {
      name: 'X',
      icon: Twitter,
      url: 'https://x.com/Lunagamesnow',
      color: '#000000',
      hoverColor: '#1DA1F2'
    },
    {
      name: 'YouTube',
      icon: Youtube,
      url: 'https://www.youtube.com/@lunagamesnow',
      color: '#FF0000',
      hoverColor: '#CC0000'
    },
    {
      name: 'Facebook',
      icon: Facebook,
      url: 'https://www.facebook.com/profile.php?id=61562587281549',
      color: '#1877F2',
      hoverColor: '#0E5FC1'
    },
    {
      name: 'Telegram',
      icon: Send,
      url: 'https://t.me/lunagamesnow',
      color: '#26A5E4',
      hoverColor: '#0088CC'
    }
  ];

  return (
    <div className={`fixed bottom-24 right-6 flex flex-col gap-3 ${className}`}>
      {socialLinks.map((social) => (
        <a
          key={social.name}
          href={social.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative"
          aria-label={`Follow us on ${social.name}`}
        >
          <button
            className="w-12 h-12 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110"
            style={{ backgroundColor: social.color }}
          >
            <social.icon className="w-6 h-6 text-white" />
          </button>
          <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-gray-800 text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {social.name}
          </span>
        </a>
      ))}
    </div>
  );
}; 