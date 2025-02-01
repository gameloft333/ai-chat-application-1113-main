export class SocketService {
  static initializePaymentListeners() {
    socket.on('payment:success', async (data) => {
      try {
        // 1. 更新用户信息
        await UserStore.refreshUserInfo();
        
        // 2. 触发界面更新
        const event = new CustomEvent('payment:completed', {
          detail: data
        });
        window.dispatchEvent(event);
        
        // 3. 显示成功提示
        toast.success('会员升级成功！');
      } catch (error) {
        console.error('处理支付成功消息失败:', error);
      }
    });
  }
} 