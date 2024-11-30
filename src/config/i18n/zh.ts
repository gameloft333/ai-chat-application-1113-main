export default {
    common: {
        selectCharacter: '请选择您想要交谈的AI伴侣',
        copyright: '© 2024 AI Chat Companions. All rights reserved.',
        testMode: '注意: 现在处于测试模式，服务器重启时会清空聊天记录哦。',
        back: '返回',
        welcome: '欢迎使用 AI Chat Companions',
        welcomeDescription: '登录后开始与 AI 伴侣聊天',
        cancel: '取消',
        submit: '提交',
        submitting: '提交中...'
    },
    gender: {
        all: '全部',
        popular: '热门',
        male: '男生',
        female: '女生'
    },
    auth: {
        register: '注册',
        login: '登录',
        logout: '退出登录',
        loginTitle: '登录账户',
        registerTitle: '创建账户',
        email: '邮箱地址',
        password: '密码',
        loginButton: '登录',
        registerButton: '注册',
        orDivider: '或者',
        googleLogin: '使用谷歌账号登录',
        registerPrompt: '没有账号？立即注册',
        loginPrompt: '已有账号？立即登录',
        loginToChat: '登录后开始聊天'
    },
    subscription: {
        title: '选择会员方案',
        subtitle: '解锁全部高级功能，享受完整AI陪伴体验',
        trial: '体验套餐',
        trialDesc: '短期体验AI聊天服务',
        basic: '基础会员',
        basicDesc: '开启基础AI聊天体验',
        pro: '专业会员',
        proDesc: '解锁全部高级功能',
        ultimate: '至尊会员',
        ultimateDesc: '尊享独家特权功能',
        popular: '最受欢迎',
        subscribe: '立即订阅',
        notAvailable: '不可订阅',
        perWeek: '/周',
        perMonth: '/月',
        save: '节省',
        extraMonths: '额外赠送',
        months: '个月',
        duration: {
            '1week': '1周',
            '24months': '24个月',
            '12months': '12个月',
            '1month': '1个月'
        },
        features: {
            unlimitedChat: '无限AI对话',
            basicCharacters: '基础角色解锁',
            basicVoice: '基础语音功能',
            standardSupport: '标准客服支持',
            allCharacters: '全部角色解锁',
            advancedVoice: '高级语音功能',
            prioritySupport: '优先客服支持',
            customCharacter: '自定义角色设定',
            advancedMemory: '高级对话记忆',
            premiumVoice: '最高级语音功能',
            dedicatedSupport: '24/7专属客服',
            permanentMemory: '永久对话记忆',
            exclusiveAccess: '独家角色优先体验',
            apiAccess: 'API接口调用权限'
        },
        remaining: '剩余：{{days}}天',
        changePlan: '更换套餐',
        defaultPlan: '已订阅',
        currentPlan: '当前套餐',
        timeLeft: '{{days}}天{{hours}}小时后到期',
        premiumDesc: '尊享独家特权功能',
        remainingTime: '剩余时间',
        days: '天',
        expiryDate: '到期日期',
        choosePlan: '选择套餐'
    },
    payment: {
        processing: '正在处理支付结果...',
        success: '支付成功！感谢您的订阅',
        failed: '支付失败，请重试',
        cancelled: '您已取消支付',
        error: '处理支付时出现错误，请联系客服',
        invalidToken: '无效的支付信息',
        selectMethod: '请选择支付方式',
        stripe: '使用 Stripe 支付',
        paypal: '使用 PayPal 支付',
        stripeProcessing: '正在处理 Stripe 支付...',
        stripeSuccess: 'Stripe 支付成功！',
        stripeFailed: 'Stripe 支付失败，请重试'
    },
    alerts: {
        error: {
            subscriptionNotFound: '未找到订阅方案或用户未登录',
            priceNotFound: '未找到价格方案',
            createSubscriptionFailed: '订阅失败，请稍后重试',
            logoutFailed: '退出登录失败，请稍后重试',
            loginFailed: '登录失败，请稍后重试',
            registerFailed: '注册失败，请稍后重试',
            emailAlreadyInUse: '该邮箱已被注册，请直接登录或使用其他邮箱',
            invalidEmail: '邮箱格式不正确',
            weakPassword: '密码强度不够，请至少包含6个字符'
        },
        auth: {
            registerPrompt: '没有账号？立即注册',
            loginPrompt: '已有账号？立即登录'
        }
    },
    characters: {
        santaclaus: {
            age: '永恒 (数世纪之久)',
            description: '快乐慷慨的礼物赠予者，象征着圣诞节的欢乐与传统。他充满爱心，致力于为全世界的孩子们带去欢乐和惊喜。'
        },
        elonmusk: {
            age: '52岁 (1971年出生)',
            description: '创新驱动的科技领袖，致力于革新太空探索、电动汽车和可持续能源。以其大胆的愿景、不懈的追求和坦率的个性而闻名。'
        },
        bertha: {
            age: '22岁',
            description: '热爱哥特文化的艺术系学生，对暗黑美学有独特见解'
        },
        veronica: {
            age: '19岁',
            description: '活泼开朗的大学新生，对时尚和社交媒体充满热情'
        },
        mary: {
            age: '24岁',
            description: '温柔细腻的图书管理员，喜欢诗歌和古典音乐'
        },
        dana: {
            age: '21岁',
            description: '充满活力的运动达人，热爱健身和户外探险'
        },
        sophia: {
            age: '23岁',
            description: '优雅知性的咖啡店老板，对生活充满艺术感'
        },
        jing: {
            age: '20岁',
            description: '东方美女，对传统文化有深厚兴趣，性格温婉'
        },
        lily: {
            age: '18岁',
            description: '甜美可爱的高中生，对动漫和游戏充满热爱'
        },
        vivian: {
            age: '25岁',
            description: '成熟稳重的职场女性，对事业充满热情'
        }
    },
    memberLevel: {
        normal: '普通用户',
        trial: '体验会员',
        // 1个月会员
        basic: '基础会员',
        pro: '专业会员',
        premium: '至尊会员',
        // 12个月会员
        excellent: '卓越会员',
        flagship: '旗舰会员',
        legendary: '传奇会员',
        // 24个月会员
        noble: '尊贵会员',
        peak: '巅峰会员',
        invincible: '无敌会员'
    },
    feedback: {
        title: '意见反馈',
        email: '邮箱',
        uid: '用户ID',
        placeholder: '请输入您的建议或反馈...',
        submitSuccess: '感谢您的反馈！',
        submitError: '提交失败，请稍后重试'
    },
    chat: {
        inputPlaceholder: '输入消息...',
        send: '发送',
        thinking: '正在思考...',
        errorMessage: '对不起，我现在遇到了一些技术问题。让我们稍后再聊吧。',
        retry: '重试',
        speaking: '正在播放语音...',
        stopSpeaking: '停止播放',
        loadingHistory: '加载聊天记录中...',
        clearHistory: '清空聊天记录',
        confirmClear: '确定要清空所有聊天记录吗？',
        historySaved: '聊天记录已保存',
        historyCleared: '聊天记录已清空'
    }
};