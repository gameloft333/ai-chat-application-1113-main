export default {
    common: {
        selectCharacter: '请选择您想要交谈的AI伴侣',
        copyright: ' 2025 Companions. All rights reserved.',
        testMode: '注意: 现在处于测试模式，服务器重启时会清空聊天记录哦。',
        back: '返回',
        welcome: '欢迎使用 AILove - Companions',
        welcomeDescription: '登录后开始与 AI 伴侣聊天',
        cancel: '取消',
        submit: '提交',
        submitting: '提交中...'
    },
    gender: {
        all: '全部',
        popular: '热门',
        male: '男生',
        female: '女生',
        celebrity: '名人堂（模仿）',
        pet: '宠物',
        god: '神（模仿）'
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
            '1month': '1个月',
            monthly: '月付',
            quarterly: '季付',
            yearly: '年付',
            lifetime: '终身'
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
        choosePlan: '加入会员',
        payment: {
            selectMethod: '选择支付方式',
            processing: '处理中...',
            success: '支付成功',
            failed: '支付失败',
            retry: '重试支付',
            cancel: '取消支付'
        }
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
        stripeFailed: 'Stripe 支付失败，请重试',
        ton: {
            title: 'TON 支付',
            amount: '需支付 TON 数量',
            checking: '正在检查支付状态...',
            success: '支付成功！',
            failed: '支付失败',
            error: '处理支付时出现错误',
            successDetails: '支付成功！\n到期日期：{{expireDate}}\n剩余天数：{{remainingDays}} 天\n\n您现在可以享受所有会员特权了！',
            testWallet: '请使用以下测试钱包：\n地址：{{address}}\n注意事项：\n1. 请确保使用测试网络\n2. 如遇问题请清除浏览器缓存',
            waitingConfirm: '等待区块链确认中...',
            confirmations: '确认数：{{count}}/{{required}}',
            insufficientBalance: '钱包余额不足',
            networkError: '网络错误，请重试',
            clickToOpenWallet: '请点击下方按钮打开 TON 钱包进行支付',
            openWallet: '打开 TON 钱包支付',
            openWalletManually: '如果钱包没有自动打开，请手动打开 TON 钱包完成支付',
            openWalletError: '打开钱包失败，请确保已安装 TON 钱包',
            copyAddress: '复制钱包地址',
            addressCopied: '已复制',
            manualPayment: '手动支付',
            manualPaymentDesc: '如果自动支付失败，您可以手动向以下地址转账 TON',
            notice: '注意事项',
            testNetworkNotice: '请确保使用测试网络',
            clearCacheNotice: '如遇支付问题请清除浏览器缓存',
            waitingNotice: '支付完成前请勿关闭页面',
            timeoutNotice: '请在30分钟内完成支付',
            copyFailed: '复制地址失败，请重试',
            walletAddress: '钱包地址',
            paymentButton: '打开 TON 钱包支付',
            cancel: '取消支付',
            paymentAmount: '支付金额',
            walletAddressTitle: '收款钱包地址',
            walletAddressError: '钱包地址未设置'
        },
        methods: {
            paypal: '使用 PayPal 支付',
            stripe: '使用 Stripe 支付',
            ton: '使用 TON 支付'
        },
        paymentConfirmTitle: '支付确认',
        cardInput: '请输入卡号',
        amount: '{{amount}} {{currency}}',
        payAction: '支付',
        cancel: '取消',
        processingPayment: '处理中...',
        testMode: {
            notice: '如果遇到支付问题，请使用稳定IP的网络连接，并使用以下测试卡号进行支付',
            cardNumber: '测试卡号',
            expiry: '有效期',
            cvc: 'CVC',
            postal: '邮编'
        },
        webhook: {
            signatureVerificationFailed: 'Webhook签名验证失败',
            invalidPayload: '无效的Webhook负载',
            processingError: '处理Webhook事件时出错',
            eventHandled: 'Webhook事件处理成功',
            eventType: '事件类型：{{type}}',
            paymentIntentCreated: '支付意向已创建',
            paymentIntentSucceeded: '支付意向已成功',
            paymentIntentFailed: '支付意向失败',
            paymentIntentCancelled: '支付意向已取消'
        },
        errors: {
            postalCode: '请输入完整的邮政编码',
            initFailed: '支付服务初始化失败',
            formNotLoaded: '支付表单未加载完成',
            connectionFailed: '支付服务连接失败，请检查网络连接后重试',
            processingFailed: '支付处理失败',
            liveTestCard: '无效的支付卡号：请使用真实的支付卡，而不是测试卡号',
            cardDeclined: '支付卡被拒绝，请检查卡片信息或尝试使用其他支付方式',
            cardValidationFailed: '支付卡验证失败',
            webhookError: 'Webhook处理错误',
            signatureError: '签名验证失败',
            payloadError: '无效的负载格式',
            eventTypeError: '未处理的事件类型',
            default: '发生意外的支付错误。请重试或联系支持人员。'
        }
    },
    alerts: {
        error: {
            subscriptionNotFound: '未找到订阅方案或用户未登录',
            priceNotFound: '未找到价格方案',
            createSubscriptionFailed: '订阅失败，请稍后重试',
            logoutFailed: '退出登录失败，请稍后重试',
            loginFailed: '登录失败，请检查您的凭据或重试。',
            registerFailed: '注册失败，请重试。',
            emailAlreadyInUse: '该邮箱已被注册，请直接登录或使用其他邮箱',
            invalidEmail: '邮箱格式不正确，请输入有效的邮箱地址。',
            weakPassword: '密码强度太弱，请选择更强的密码（例如，至少6个字符）。',
            invalidDuration: '无效的订阅周期，请重新选择',
            paymentFailed: '支付失败，请重试',
            loginRequired: '请先登录',
            invalidPlan: '无效的订阅计划',
            invalidPaymentMethod: '无效的支付方式',
            paymentProcessing: '支付处理中，请稍候',
            paymentCancelled: '支付已取消',
            networkError: '网络错误，请重试',
            selectDuration: '请选择订阅周期',
            unknownError: '发生未知错误，请重试',
            selectPaymentMethod: '请选择支付方式',
            statisticsUpdate: '更新统计失败',
            characterStatsFailed: '无法更新角色使用统计',
            selectionFailed: '选择失败',
            unexpectedError: '发生意外错误'
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
        errorMessage: '对不起，我现在遇到了一些技术问题。让我们稍后再聊吧',
        retry: '重试',
        speaking: '正在播放语音...',
        stopPlaying: '停止播放',
        loadingHistory: '加载聊天记录中...',
        clearHistory: '清空聊天记录',
        confirmClear: '确定要清空所有聊天记录吗？',
        historySaved: '聊天记录已保存',
        historyCleared: '聊天记录已清空',
        thinkingMessage: '{{name}}正在思考回复...',
        configError: '系统配置出现问题，请联系管理员。',
        networkError: '网络连接出现问题，请检查您的网络连接。',
        apiKeyError: 'API密钥无效，请联系管理员。',
        emptyResponseError: 'AI 响应为空，请重试。',
        limit: {
            title: '今日剩余聊天次数',
            remaining: {
                prefix: '今日剩余: ',
                suffix: '次对话'
            },
            exceeded: '您已用完今日所有聊天次数，请订阅以获得更多次数或明日再来。',
            subscribe: '订阅会员，畅聊无限',
            unlimited: '无限次数'
        }
    },
    nav: {
        home: '首页',
        chat: '聊天',
        subscription: '订阅',
        settings: '设置',
        profile: '我的',
        wallet: '钱包',
        community: '社区'
    },
    preview: {
        toggle: '切换手机预览',
        mobile: '手机模式',
        desktop: '桌面模式'
    },
    stats: {
        online: '在线',
        peak: '峰值',
        date: '日期'
    },
    character: {
        limitReached: {
            title: '角色数量已达上限',
            description: '您当前的会员等级最多可以使用 {{maxCount}} 个角色。升级会员等级以解锁更多精彩角色！'
        }
    },
    disclaimers: {
        noSensitiveUse: '重要提示：本项目 AI 仅供娱乐用途，禁止用于任何敏感、非法或色情用途。',
        nonMedicalAdvice: '免责声明：AI 生成内容仅供娱乐，不构成医疗、法律、财务或其他专业建议。'
    },
    privacy: {
        title: '隐私政策',
        effective: '生效日期：2025-02',
        intro: '欢迎使用 AILove - Companions（以下简称"本应用"）。我们非常重视您的隐私。本隐私政策将说明我们如何收集、使用、披露和保护您在使用本应用时的信息。',
        collect: '1. 我们收集的信息',
        personal: '个人数据：邮箱、用户名、头像、出生日期',
        usage: '使用数据：应用使用情况、设备信息、IP地址',
        auth: '认证数据：Google OAuth 或邮箱/密码',
        location: '位置信息：大致位置（省/市）',
        analytics: '分析数据：我们使用分析工具以改进应用',
        use: '2. 我们如何使用您的信息',
        use1: '提供和改进本应用',
        use2: '用户认证与账户管理',
        use3: '个性化内容与推荐',
        use4: '分析使用情况并提升性能',
        use5: '与您沟通更新、功能或支持',
        use6: '保障安全与防止欺诈',
        share: '3. 我们如何共享您的信息',
        share1: '我们不会出售您的个人信息。我们可能会与服务提供商（如 Supabase、Firebase）及法律要求时的相关部门共享您的信息。',
        retention: '4. 数据保留',
        retention1: '只要您的账户处于激活状态或为您提供服务所需，我们会保留您的信息。您可随时通过 support@saga1001.com 联系我们删除数据。',
        security: '5. 安全性',
        security1: '我们采用业界标准的安全措施，但任何互联网传输或电子存储方式都无法保证100%安全。',
        children: '6. 儿童隐私',
        children1: '本应用不面向13岁以下儿童。如发现收集了此类信息，请联系我们删除。',
        rights: '7. 您的权利',
        rights1: '您可随时通过 support@saga1001.com 联系我们访问、更新或删除您的个人信息。',
        changes: '8. 政策变更',
        changes1: '我们可能会不时更新本隐私政策，变更内容将在应用和网站上公布。',
        contact: '9. 联系我们',
        contact1: '如有任何疑问，请通过 support@saga1001.com 联系我们。'
    },
    terms: {
        title: '用户协议',
        effective: '生效日期：2025-02',
        intro: '欢迎使用 AILove - Companions（以下简称"本应用"）。使用本应用即表示您同意本协议，请仔细阅读。',
        accept: '1. 协议的接受',
        accept1: '访问或使用本应用即表示您同意受本协议约束。如不同意，请勿使用本应用。',
        use: '2. 应用的使用',
        use1: '本应用仅供个人、非商业用途。',
        use2: '您必须年满13周岁方可使用本应用。',
        use3: '您同意不以非官方界面或说明以外的方式访问或滥用本应用。',
        account: '3. 用户账户',
        account1: '您有责任妥善保管账户凭证。',
        account2: '您同意在注册时提供真实、完整的信息。',
        account3: '您对账户下的所有活动负责。',
        ip: '4. 知识产权',
        ip1: '本应用的所有内容、功能和特性均归 SAGA entertainment 或其许可方所有。未经书面许可，您不得复制、修改、分发、出售或租赁本应用的任何部分。',
        userContent: '5. 用户内容',
        userContent1: '您保留所提交内容的所有权，但同意我们为提供服务可使用、展示和分发该内容。',
        userContent2: '您同意不提交违法、冒犯或侵犯他人权益的内容。',
        payments: '6. 支付与购买',
        payments1: '应用内购买可能通过第三方支付（如 Stripe、PayPal）完成，所有购买均受第三方条款约束。',
        payments2: '除法律要求外，所有销售均为最终销售。',
        disclaimer: '7. 免责声明与责任限制',
        disclaimer1: '本应用按"现状"提供，不作任何明示或暗示的保证。我们不保证分析或信息的准确性、完整性或可靠性。在法律允许范围内，SAGA entertainment 对因使用本应用产生的任何损失不承担责任。',
        termination: '8. 终止',
        termination1: '如违反本协议或其他原因，我们可随时暂停或终止您对本应用的访问。',
        changes: '9. 协议变更',
        changes1: '我们可能会不时更新本协议，变更内容将在应用和网站上公布。',
        law: '10. 适用法律',
        law1: '本协议受相关司法管辖区法律管辖。',
        contact: '11. 联系我们',
        contact1: '如有任何疑问，请通过 support@saga1001.com 联系我们。'
    }
};