export const pricingPlans = {
    durations: [
        { id: '24months', label: '24个月' },
        { id: '12months', label: '12个月', popular: true },
        { id: '1month', label: '1个月' }
    ],
    plans: [
        {
            id: 'basic',
            name: '基础会员',
            description: '开启基础AI聊天体验',
            prices: {
                '24months': { price: 19.00, save: 50, extraMonths: 2 },
                '12months': { price: 29.00, save: 55, extraMonths: 2 },
                '1month': { price: 39.00, save: 0, extraMonths: 0 }
            },
            features: [
                '无限AI对话',
                '基础角色解锁',
                '基础语音功能',
                '标准客服支持'
            ]
        },
        {
            id: 'pro',
            name: '专业会员',
            description: '解锁全部高级功能',
            popular: true,
            features: [
                '无限AI对话',
                '全部角色解锁',
                '高级语音功能',
                '优先客服支持',
                '自定义角色设定',
                '高级对话记忆'
            ],
            prices: {
                '24months': { price: 25.00, save: 70, extraMonths: 4 },
                '12months': { price: 29.00, save: 55, extraMonths: 2 },
                '1month': { price: 45.00, save: 0, extraMonths: 0 }
            }
        },
        {
            id: 'ultimate',
            name: '至尊会员',
            description: '尊享独家特权功能',
            features: [
                '无限AI对话',
                '全部角色解锁',
                '最高级语音功能',
                '24/7专属客服',
                '自定义角色设定',
                '永久对话记忆',
                '独家角色优先体验',
                'API接口调用权限'
            ],
            prices: {
                '24months': { price: 35.00, save: 75, extraMonths: 4 },
                '12months': { price: 39.00, save: 60, extraMonths: 2 },
                '1month': { price: 60.00, save: 0, extraMonths: 0 }
            }
        }
    ]
};