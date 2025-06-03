import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

const Privacy = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <button
        onClick={() => navigate('/')}
        className="mb-4 px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm"
      >
        {t('common.back')}
      </button>
      <h1 className="text-2xl font-bold mb-4">{t('privacy.title')}</h1>
      <p className="mb-2">{t('privacy.effective')}</p>
      <p className="mb-2">{t('privacy.intro')}</p>
      <h2 className="text-lg font-semibold mt-6 mb-2">{t('privacy.collect')}</h2>
      <ul className="list-disc pl-6 mb-2">
        <li>{t('privacy.personal')}</li>
        <li>{t('privacy.usage')}</li>
        <li>{t('privacy.auth')}</li>
        <li>{t('privacy.location')}</li>
        <li>{t('privacy.analytics')}</li>
      </ul>
      <h2 className="text-lg font-semibold mt-6 mb-2">{t('privacy.use')}</h2>
      <ul className="list-disc pl-6 mb-2">
        <li>{t('privacy.use1')}</li>
        <li>{t('privacy.use2')}</li>
        <li>{t('privacy.use3')}</li>
        <li>{t('privacy.use4')}</li>
        <li>{t('privacy.use5')}</li>
        <li>{t('privacy.use6')}</li>
      </ul>
      <h2 className="text-lg font-semibold mt-6 mb-2">{t('privacy.share')}</h2>
      <p className="mb-2">{t('privacy.share1')}</p>
      <h2 className="text-lg font-semibold mt-6 mb-2">{t('privacy.retention')}</h2>
      <p className="mb-2">{t('privacy.retention1')}</p>
      <h2 className="text-lg font-semibold mt-6 mb-2">{t('privacy.security')}</h2>
      <p className="mb-2">{t('privacy.security1')}</p>
      <h2 className="text-lg font-semibold mt-6 mb-2">{t('privacy.children')}</h2>
      <p className="mb-2">{t('privacy.children1')}</p>
      <h2 className="text-lg font-semibold mt-6 mb-2">{t('privacy.rights')}</h2>
      <p className="mb-2">{t('privacy.rights1')}</p>
      <h2 className="text-lg font-semibold mt-6 mb-2">{t('privacy.changes')}</h2>
      <p className="mb-2">{t('privacy.changes1')}</p>
      <h2 className="text-lg font-semibold mt-6 mb-2">{t('privacy.contact')}</h2>
      <p className="mb-2">{t('privacy.contact1')}</p>
    </div>
  );
};

export default Privacy; 