export default {
    common: {
        selectCharacter: 'Please select your companion',
        copyright: ' 2025 AILove - Companions. All rights reserved.',
        testMode: 'Note: In test mode, chat history will be cleared on server restart.',
        back: 'Back',
        welcome: 'Welcome to AILove - Companions',
        welcomeDescription: 'Login to start chatting with companions',
        cancel: 'Cancel',
        submit: 'Submit',
        submitting: 'Submitting...'
    },
    gender: {
        all: 'All',
        popular: 'Popular',
        male: 'Male',
        female: 'Female',
        celebrity: 'Celebrity(COSPLAY)',
        pet: 'Pet',
        god: 'God'
    },
    auth: {
        register: 'Register',
        login: 'Login',
        logout: 'Logout',
        loginTitle: 'Login to Account',
        registerTitle: 'Create Account',
        email: 'Email Address',
        password: 'Password',
        loginButton: 'Login',
        registerButton: 'Register',
        orDivider: 'Or',
        googleLogin: 'Sign in with Google',
        registerPrompt: 'No account? Register now',
        loginPrompt: 'Have an account? Login now'
    },
    subscription: {
        title: 'Choose Your Plan',
        subtitle: 'Unlock all premium features and enjoy the complete AI companion experience',
        trial: 'Trial Plan',
        trialDesc: 'Short-term AI chat experience',
        basic: 'Basic Plan',
        basicDesc: 'Start your AI chat journey',
        pro: 'Pro Plan',
        proDesc: 'Unlock all advanced features',
        ultimate: 'Ultimate Plan',
        ultimateDesc: 'Exclusive premium features',
        popular: 'Most Popular',
        subscribe: 'Subscribe Now',
        notAvailable: 'Not Available',
        perWeek: '/week',
        perMonth: '/month',
        save: 'Save',
        extraMonths: 'Extra',
        months: 'months',
        duration: {
            '1week': '1 week',
            '24months': '24 months',
            '12months': '12 months',
            '1month': '1 month',
            monthly: 'Monthly',
            quarterly: 'Quarterly',
            yearly: 'Yearly',
            lifetime: 'Lifetime'
        },
        features: {
            unlimitedChat: 'Unlimited AI Chat',
            basicCharacters: 'Basic Characters',
            basicVoice: 'Basic Voice Features',
            standardSupport: 'Standard Support',
            allCharacters: 'All Characters',
            advancedVoice: 'Advanced Voice',
            prioritySupport: 'Priority Support',
            customCharacter: 'Custom Characters',
            advancedMemory: 'Advanced Memory',
            premiumVoice: 'Premium Voice',
            dedicatedSupport: '24/7 Dedicated Support',
            permanentMemory: 'Permanent Memory',
            exclusiveAccess: 'Exclusive Character Access',
            apiAccess: 'API Access'
        },
        remaining: 'Remaining: {{days}} days',
        changePlan: 'Change Plan',
        defaultPlan: 'Subscribed',
        currentPlan: 'Current Plan',
        timeLeft: 'Expires in {{days}} days {{hours}} hours',
        premiumDesc: 'Exclusive premium features',
        remainingTime: 'Remaining Time',
        days: 'days',
        expiryDate: 'Expiry Date',
        choosePlan: 'Choose Plan',
        payment: {
            selectMethod: 'Select Payment Method',
            processing: 'Processing...',
            success: 'Payment Successful',
            failed: 'Payment Failed',
            retry: 'Retry Payment',
            cancel: 'Cancel Payment'
        }
    },
    payment: {
        processing: 'Processing payment result...',
        success: 'Payment successful! Thank you for your subscription',
        failed: 'Payment failed, please try again',
        cancelled: 'Payment has been cancelled',
        error: 'Error processing payment, please contact customer service',
        invalidToken: 'Invalid payment information',
        selectMethod: 'Select Payment Method',
        stripe: 'Pay with Stripe',
        paypal: 'Pay with PayPal',
        stripeProcessing: 'Processing Stripe payment...',
        stripeSuccess: 'Stripe payment successful!',
        stripeFailed: 'Stripe payment failed, please try again',
        ton: {
            title: 'TON Payment',
            amount: 'TON Amount to Pay',
            checking: 'Checking payment status...',
            success: 'Payment successful!',
            failed: 'Payment failed',
            error: 'Error processing payment',
            successDetails: 'Payment successful!\nExpiry date: {{expireDate}}\nRemaining days: {{remainingDays}}\n\nYou can now enjoy all member privileges!',
            testWallet: 'Please use the following test wallet:\nAddress: {{address}}\nNote:\n1. Make sure to use Testnet\n2. Clear browser cache if encountering errors',
            waitingConfirm: 'Waiting for blockchain confirmation...',
            confirmations: 'Confirmations: {{count}}/{{required}}',
            insufficientBalance: 'Insufficient wallet balance',
            networkError: 'Network error, please try again',
            clickToOpenWallet: 'Click the button below to open TON wallet for payment',
            openWallet: 'Open TON Wallet',
            openWalletManually: 'If wallet did not open automatically, please open TON wallet manually to complete payment',
            openWalletError: 'Failed to open wallet, please make sure TON wallet is installed',
            copyAddress: 'Copy Address',
            addressCopied: 'Wallet address copied',
            manualPayment: 'Manual Payment',
            manualPaymentDesc: 'If automatic payment fails, you can manually transfer TON to the following address',
            notice: 'Notice',
            testNetworkNotice: 'Make sure to use Testnet',
            clearCacheNotice: 'Clear browser cache if encountering errors',
            waitingNotice: 'Please do not close the page before payment is completed',
            timeoutNotice: 'Please complete payment within 30 minutes',
            copyFailed: 'Failed to copy address, please try again',
            walletAddress: 'Wallet Address',
            paymentButton: 'Open TON Wallet',
            cancel: 'Cancel Payment',
            paymentAmount: 'Payment Amount',
            walletAddressTitle: 'Receiving Wallet Address',
            walletAddressError: 'Wallet address not set'
        },
        methods: {
            paypal: 'Pay with PayPal',
            stripe: 'Pay with Stripe',
            ton: 'Pay with TON'
        },
        paymentConfirmTitle: 'Payment Confirmation',
        cardInput: 'Enter Card Number',
        amount: '{{amount}} {{currency}}',
        payAction: 'Pay',
        cancel: 'Cancel',
        processingPayment: 'Processing...',
        errors: {
            postalCode: 'Please enter a complete postal code',
            initFailed: 'Payment service initialization failed',
            formNotLoaded: 'Payment form not loaded',
            connectionFailed: 'Payment service connection failed, please check your network connection and try again',
            processingFailed: 'Payment processing failed',
            liveTestCard: 'Invalid card number: Please use a real payment card instead of a test card',
            cardDeclined: 'Card declined, please check your card information or try another payment method',
            cardValidationFailed: 'Card validation failed'
        }
    },
    alerts: {
        error: {
            subscriptionNotFound: 'Subscription plan not found or user not logged in',
            priceNotFound: 'Price plan not found',
            createSubscriptionFailed: 'Subscription failed, please try again later',
            logoutFailed: 'Logout failed, please try again later',
            loginFailed: 'Login failed, please try again later',
            registerFailed: 'Registration failed, please try again later',
            invalidDuration: 'Invalid subscription duration, please select again',
            paymentFailed: 'Payment failed, please try again',
            loginRequired: 'Please login first',
            invalidPlan: 'Invalid subscription plan',
            invalidPaymentMethod: 'Invalid payment method',
            paymentProcessing: 'Payment is processing, please wait',
            paymentCancelled: 'Payment cancelled',
            networkError: 'Network error, please try again',
            selectDuration: 'Please select subscription duration',
            unknownError: 'Unknown error occurred, please try again',
            selectPaymentMethod: 'Please select payment method'
        },
        auth: {
            registerPrompt: 'No account? Register now',
            loginPrompt: 'Have an account? Login now'
        }
    },
    characters: {
        santaclaus: {
            age: 'Timeless (Centuries Old)',
            description: 'The jolly and generous gift-giver, embodying the joy and tradition of Christmas. He is full of warmth and dedicated to bringing happiness and wonder to children all around the world.'
        },
        elonmusk: {
            age: '52 years (Born 1971)',
            description: 'An innovation-driven technology leader dedicated to revolutionizing space exploration, electric vehicles, and sustainable energy. Known for his audacious vision, relentless pursuit, and outspoken personality.'
        },
        bertha: {
            age: '22 years',
            description: 'Art student passionate about gothic culture with unique insights into dark aesthetics'
        },
        veronica: {
            age: '19 years',
            description: 'Vibrant college freshman with a passion for fashion and social media'
        },
        mary: {
            age: '24 years',
            description: 'Gentle librarian with a love for poetry and classical music'
        },
        dana: {
            age: '21 years',
            description: 'Energetic fitness enthusiast who loves outdoor adventures'
        },
        sophia: {
            age: '23 years',
            description: 'Elegant cafe owner with an artistic approach to life'
        },
        jing: {
            age: '20 years',
            description: 'Eastern beauty with deep interest in traditional culture and graceful personality'
        },
        lily: {
            age: '18 years',
            description: 'Sweet high school student who loves anime and gaming'
        },
        vivian: {
            age: '25 years',
            description: 'Mature career woman with a passionate drive for success'
        }
    },
    memberLevel: {
        normal: 'Normal User',
        trial: 'Trial Member',
        // 1-month membership
        basic: 'Basic Member',
        pro: 'Pro Member',
        premium: 'Premium Member',
        // 12-month membership
        excellent: 'Excellent Member',
        flagship: 'Flagship Member',
        legendary: 'Legendary Member',
        // 24-month membership
        noble: 'Noble Member',
        peak: 'Peak Member',
        invincible: 'Invincible Member'
    },
    feedback: {
        title: 'Feedback',
        email: 'Email',
        uid: 'User ID',
        placeholder: 'Please enter your suggestions or feedback...',
        submitSuccess: 'Thank you for your feedback!',
        submitError: 'Submission failed, please try again later'
    },
    chat: {
        inputPlaceholder: 'Type a message...',
        send: 'Send',
        thinking: 'Thinking...',
        errorMessage: 'Sorry, I am experiencing some technical issues. Let\'s chat later.',
        retry: 'Retry',
        speaking: 'Playing voice...',
        stopSpeaking: 'Stop playing',
        loadingHistory: 'Loading chat history...',
        clearHistory: 'Clear history',
        confirmClear: 'Are you sure you want to clear all chat history?',
        historySaved: 'Chat history saved',
        historyCleared: 'Chat history cleared',
        thinkingMessage: '{{name}} is thinking...',
        configError: 'System configuration error, please contact administrator.',
        networkError: 'Network connection issue, please check your internet connection.',
        apiKeyError: 'Invalid API key, please contact administrator.',
        emptyResponseError: 'AI response is empty, please try again.'
    },
    nav: {
        home: 'Home',
        characters: 'Characters',
        tasks: 'Tasks',
        profile: 'Profile',
        wallet: 'Wallet',
        community: 'Community'
    },
    preview: {
        toggle: 'Toggle Mobile Preview',
        mobile: 'Mobile Mode',
        desktop: 'Desktop Mode'
    },
    stats: {
        online: 'Online',
        peak: 'Peak',
        date: 'Date'
    },
    character: {
        limitReached: {
            title: "Character Limit Reached",
            description: "Your current membership level allows up to {{maxCount}} characters. Upgrade your membership to unlock more amazing characters!"
        }
    },
    error: {
        statisticsUpdate: 'Failed to Update Statistics',
        characterStatsFailed: 'Failed to update character statistics',
        selectionFailed: 'Selection Failed',
        unexpectedError: 'An unexpected error occurred'
    }
};