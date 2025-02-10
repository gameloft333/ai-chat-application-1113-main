import React, { useState } from 'react';
import { MessageCircle, X, Star } from 'lucide-react';
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

  {/* 提交反馈处理函数 */}
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
      {/* 悬浮反馈按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        // 定义反馈按钮的样式，包括位置、大小、圆角、阴影、过渡效果等
        // top-[calc(50%+9.4rem)]: 
        //   - 50% = 窗口高度的一半（垂直居中）
        //   - 9.4rem = 按钮距离窗口顶部的距离（可调整）
        // -translate-y-1/2: 
        //   - 向上移动按钮自身高度的一半（垂直居中）
        // right-6: 
        //   - 按钮距离窗口右边的距离（可调整）
        // h-12 w-12: 
        //   - 按钮的高度和宽度（可调整）
        // rounded-full: 
        //   - 按钮的圆角样式（可调整）
        // shadow-lg hover:shadow-xl: 
        //   - 按钮的阴影样式（可调整）
        // transition-all duration-200: 
        //   - 按钮的过渡效果（可调整）
        // flex items-center justify-center: 
        //   - 按钮的布局样式（可调整）
        className="fixed top-[calc(50%+9.4rem)] -translate-y-1/2 right-6 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
        style={{ backgroundColor: themeColor }}
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </button>

      {/* 反馈弹窗遮罩层 */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          {/* 反馈弹窗主体 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            {/* 弹窗标题栏 */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('feedback.title')}
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* 反馈表单内容区 */}
            <div className="space-y-6">
              {/* 用户信息展示 */}
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t('feedback.email')}: {currentUser?.email}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t('feedback.uid')}: {currentUser?.uid}
                </p>
              </div>

              {/* 星级评分区域 */}
              <div className="flex items-center justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`h-12 w-12 transition-all duration-200 ${
                      star <= rating 
                        ? 'text-yellow-400 scale-110' 
                        : 'text-gray-400 hover:text-yellow-400'
                    }`}
                  >
                    <Star className={`h-8 w-8 ${star <= rating ? 'fill-current' : ''}`} />
                  </button>
                ))}
              </div>

              {/* 反馈文本输入框 */}
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={t('feedback.placeholder')}
                className="w-full min-h-[120px] rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:text-white"
                style={{ 
                  focusRing: themeColor,
                  resize: 'vertical'
                }}
              />

              {/* 操作按钮区域 */}
              <div className="flex justify-end space-x-2">
                {/* 取消按钮 */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  {t('common.cancel')}
                </button>
                {/* 提交按钮 */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !rating || !feedback.trim()}
                  className="px-4 py-2 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
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