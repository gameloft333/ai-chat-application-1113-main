import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

const Terms = () => {
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
      <h1 className="text-2xl font-bold mb-4">{t('terms.title')}</h1>
      <p className="mb-2">{t('terms.effective')}</p>
      <p className="mb-2">{t('terms.intro')}</p>
      <h2 className="text-lg font-semibold mt-6 mb-2">{t('terms.accept')}</h2>
      <p className="mb-2">{t('terms.accept1')}</p>
      <h2 className="text-lg font-semibold mt-6 mb-2">{t('terms.use')}</h2>
      <ul className="list-disc pl-6 mb-2">
        <li>{t('terms.use1')}</li>
        <li>{t('terms.use2')}</li>
        <li>{t('terms.use3')}</li>
      </ul>
      <h2 className="text-lg font-semibold mt-6 mb-2">{t('terms.account')}</h2>
      <ul className="list-disc pl-6 mb-2">
        <li>{t('terms.account1')}</li>
        <li>{t('terms.account2')}</li>
        <li>{t('terms.account3')}</li>
      </ul>
      <h2 className="text-lg font-semibold mt-6 mb-2">{t('terms.ip')}</h2>
      <p className="mb-2">{t('terms.ip1')}</p>
      <h2 className="text-lg font-semibold mt-6 mb-2">{t('terms.userContent')}</h2>
      <ul className="list-disc pl-6 mb-2">
        <li>{t('terms.userContent1')}</li>
        <li>{t('terms.userContent2')}</li>
      </ul>
      <h2 className="text-lg font-semibold mt-6 mb-2">{t('terms.payments')}</h2>
      <ul className="list-disc pl-6 mb-2">
        <li>{t('terms.payments1')}</li>
        <li>{t('terms.payments2')}</li>
      </ul>
      <h2 className="text-lg font-semibold mt-6 mb-2">{t('terms.disclaimer')}</h2>
      <p className="mb-2">{t('terms.disclaimer1')}</p>
      <h2 className="text-lg font-semibold mt-6 mb-2">{t('terms.termination')}</h2>
      <p className="mb-2">{t('terms.termination1')}</p>
      <h2 className="text-lg font-semibold mt-6 mb-2">{t('terms.changes')}</h2>
      <p className="mb-2">{t('terms.changes1')}</p>
      <h2 className="text-lg font-semibold mt-6 mb-2">{t('terms.law')}</h2>
      <p className="mb-2">{t('terms.law1')}</p>
      <h2 className="text-lg font-semibold mt-6 mb-2">{t('terms.contact')}</h2>
      <p className="mb-2">{t('terms.contact1')}</p>
    </div>
  );
};

export default Terms; 