import React from 'react';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Copy, X } from 'lucide-react';

interface TonPaymentProps {
  payment: {
    id: string;
    amount: number;
  };
  tonAmount: number;
  walletAddress: string;
  onCancel: () => void;
  onClose: () => void;
}

export const TonPayment: React.FC<TonPaymentProps> = ({ 
  payment, 
  tonAmount, 
  walletAddress,
  onCancel,
  onClose 
}) => {
  const { t } = useTranslation();
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 从环境变量读取汇率配置
  const TON_USD_RATE = Number(import.meta.env.VITE_TON_USD_RATE) || 1000;
  const TON_RATE_BUFFER = Number(import.meta.env.VITE_TON_RATE_BUFFER) || 1.05;

  // 计算TON金额，考虑汇率和缓冲
  const calculateTonAmount = (usdAmount: number) => {
    const tonAmount = (usdAmount / TON_USD_RATE) * TON_RATE_BUFFER;
    return Number(tonAmount.toFixed(2)); // 四舍五入到两位小数
  };

  // 调试日志
  useEffect(() => {
    console.log('TonPayment rendered:', {
      payment,
      tonAmount,
      walletAddress,
      TON_USD_RATE,
      TON_RATE_BUFFER,
      calculatedAmount: calculateTonAmount(payment.amount)
    });
  }, [payment, tonAmount, walletAddress, TON_USD_RATE, TON_RATE_BUFFER]);

  // 复制功能实现 - 增强版
  const handleCopyAddress = async () => {
    // 按优先级获取钱包地址
    const walletAddress = process.env.NODE_ENV === 'production'
      ? import.meta.env.VITE_TON_WALLET_ADDRESS
      : import.meta.env.VITE_TON_TEST_WALLET_ADDRESS || import.meta.env.VITE_TON_WALLET_ADDRESS;
    
    if (!walletAddress) {
      setError(t('payment.ton.walletAddressError'));
      return;
    }

    try {
      // 首先尝试使用 Clipboard API
      try {
        await navigator.clipboard.writeText(walletAddress);
      } catch (clipboardErr) {
        // 如果 Clipboard API 失败，使用传统方法
        const textArea = document.createElement('textarea');
        textArea.value = walletAddress;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      console.log('钱包地址复制成功:', walletAddress);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
      setError(t('payment.ton.copyFailed'));
    }
  };

  // 打开钱包功能
  const handleOpenWallet = () => {
    try {
      console.log('准备打开TON钱包');
      // 构建完整的支付URL
      const tonAmount = calculateTonAmount(payment.amount);
      const tonUrl = `ton://transfer/${walletAddress}?amount=${tonAmount}&text=Payment_${payment.id}`;
      console.log('TON支付URL:', tonUrl);
      
      // 创建一个隐藏的链接并触发点击
      const link = document.createElement('a');
      link.href = tonUrl;
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 如果直接打开失败，显示备用链接
      setTimeout(() => {
        setError(t('payment.ton.openWalletManually'));
      }, 1000);
    } catch (err) {
      console.error('打开钱包失败:', err);
      setError(t('payment.ton.openWalletError'));
    }
  };

  useEffect(() => {
    console.log('TON Payment 环境配置:', {
      env: process.env.NODE_ENV,
      walletAddress: walletAddress,
      testWalletAddress: import.meta.env.VITE_TON_TEST_WALLET_ADDRESS,
      prodWalletAddress: import.meta.env.VITE_TON_WALLET_ADDRESS
    });
  }, [walletAddress]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1A1B1E] rounded-xl w-full max-w-md relative">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">
            {t('payment.ton.title')}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* 支付金额信息 */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">{t('payment.ton.paymentAmount')}:</span>
              <span className="text-lg font-medium text-white">{payment.amount} USD</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">{t('payment.ton.tonAmount')}:</span>
              <span className="text-lg font-medium text-white">{calculateTonAmount(payment.amount)} TON</span>
            </div>
          </div>

          {/* 钱包地址区域 - 修复显示问题 */}
          <div className="bg-[#25262B] p-4 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-400">{t('payment.ton.walletAddressTitle')}</span>
              <button 
                onClick={handleCopyAddress}
                className="text-blue-500 hover:text-blue-400 text-sm flex items-center gap-1 transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>{copySuccess ? t('payment.ton.addressCopied') : t('payment.ton.copyAddress')}</span>
              </button>
            </div>
            {/* 钱包地址显示 - 优化样式和可见性 */}
            <div className="bg-[#1A1B1E] p-3 rounded border border-gray-700">
              <div className="font-mono text-sm text-white break-all">
                {walletAddress || import.meta.env.VITE_TON_WALLET_ADDRESS || import.meta.env.VITE_TON_TEST_WALLET_ADDRESS || t('payment.ton.walletAddressError')}
              </div>
            </div>
          </div>

          {/* 注意事项 */}
          <div className="bg-[#25262B] p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-400 mb-2">
              {t('payment.ton.notice')}:
            </h3>
            <ul className="text-sm space-y-2 text-gray-300">
              <li>• {t('payment.ton.testNetworkNotice')}</li>
              <li>• {t('payment.ton.clearCacheNotice')}</li>
            </ul>
          </div>

          {/* 按钮组 */}
          <div className="flex gap-3">
            <button
              onClick={handleOpenWallet}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              {t('payment.ton.payButton')}
            </button>
            <button
              onClick={onCancel}
              className="px-6 py-3 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-600 transition-colors"
            >
              {t('payment.ton.cancel')}
            </button>
          </div>

          {/* 在支付信息区域添加显示 */}
          <div className="bg-[#25262B] p-4 rounded-lg mt-4">
            <div className="text-sm text-gray-400 mb-2">
              {t('payment.ton.manualPaymentDesc')}
            </div>
            <div className="bg-[#1A1B1E] p-3 rounded border border-gray-700">
              <div className="font-mono text-sm text-white break-all">
                ton://transfer/{walletAddress}?amount={tonAmount}&text=Payment_{payment.id}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 