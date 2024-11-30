export default {
    common: {
        selectCharacter: 'Please select your AI companion',
        copyright: '© 2024 AI Chat Companions. All rights reserved.',
        testMode: 'Note: In test mode, chat history will be cleared on server restart.',
        back: 'Back',
        welcome: 'Welcome to AI Chat Companions',
        welcomeDescription: 'Login to start chatting with AI companions',
        cancel: 'Cancel',
        submit: 'Submit',
        submitting: 'Submitting...'
    },
    gender: {
        all: 'All',
        popular: 'Popular',
        male: 'Male',
        female: 'Female'
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
            '1month': '1 month'
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
        choosePlan: 'Choose Plan'
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
        stripeFailed: 'Stripe payment failed, please try again'
    },
    alerts: {
        error: {
            subscriptionNotFound: 'Subscription plan not found or user not logged in',
            priceNotFound: 'Price plan not found',
            createSubscriptionFailed: 'Subscription failed, please try again later',
            logoutFailed: 'Logout failed, please try again later',
            loginFailed: 'Login failed, please try again later',
            registerFailed: 'Registration failed, please try again later'
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
        historyCleared: 'Chat history cleared'
    }
};