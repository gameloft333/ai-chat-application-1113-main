import React, { useState } from 'react';
import { MessageCircle, HelpCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { addFeedback } from '../services/feedback-service';
import { useLanguage } from '../contexts/LanguageContext';

interface FeedbackButtonProps {
  themeColor: string;
}

const FeedbackButton: React.FC<FeedbackButtonProps> = ({ themeColor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async () => {
    if (!currentUser) return;
    
    setIsSubmitting(true);
    try {
      await addFeedback({
        uid: currentUser.uid,
        email: currentUser.email || '',
        rating,
        feedback,
        createdAt: new Date().toISOString()
      });
      setIsOpen(false);
      setRating(0);
      setFeedback('');
      alert(t('feedback.submitSuccess'));
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert(t('feedback.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-3 rounded-full shadow-lg hover:opacity-90 transition-opacity"
        style={{ backgroundColor: themeColor }}
      >
        <div className="relative w-6 h-6">
          <MessageCircle className="w-6 h-6 text-white absolute inset-0" />
          <HelpCircle className="w-3 h-3 text-white absolute -top-1 -right-1" />
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              {t('feedback.title')}
            </h2>
            
            <div className="space-y-4">
              {/* 用户信息显示 */}
              <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t('feedback.email')}: {currentUser?.email}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t('feedback.uid')}: {currentUser?.uid}
                </p>
              </div>

              {/* 星级评分 */}
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="text-2xl focus:outline-none"
                    style={{ color: themeColor }}
                  >
                    {star <= rating ? '★' : '☆'}
                  </button>
                ))}
              </div>

              {/* 反馈文本框 */}
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={t('feedback.placeholder')}
                className="w-full h-32 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                style={{ focusRing: themeColor }}
              />

              {/* 按钮组 */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !rating || !feedback.trim()}
                  className="px-4 py-2 rounded-lg text-white disabled:opacity-50"
                  style={{ backgroundColor: themeColor }}
                >
                  {isSubmitting ? t('common.submitting') : t('common.submit')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FeedbackButton; 