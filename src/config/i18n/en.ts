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
        submitting: 'Submitting...',
        show: 'Show',
        hide: 'Hide',
        copy: 'Copy'
    },
    stats: {
        online: 'Online',
        peak: 'Peak'
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
        loginPrompt: 'Have an account? Login now',
        loginToChat: 'Login to Chat'
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
        stripe: {
            title: 'Card Payment',
            amount: 'Payment Amount',
            cardDetails: 'Card Details',
            processing: 'Processing payment...',
            success: 'Payment successful!',
            failed: 'Payment failed, please try again',
            error: {
                default: 'An error occurred during payment processing. Please try again or contact support.',
                minimumAmount: 'Payment amount must be at least {{min}}. Your amount: {{current}}',
                cardDeclined: 'Your card was declined. Please try another payment method.',
                invalidCard: 'Invalid card information. Please check and try again.',
                expired: 'Your card has expired. Please use another card.',
                insufficientFunds: 'Insufficient funds. Please use another payment method.',
                processingError: 'An error occurred while processing your payment. Please try again.',
                networkError: 'Network error. Please check your connection and try again.'
            }
        },
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
            cardValidationFailed: 'Card validation failed',
            webhookError: 'Webhook processing error',
            signatureError: 'Signature verification failed',
            payloadError: 'Invalid payload format',
            eventTypeError: 'Unhandled event type',
            default: 'An unexpected payment error occurred. Please try again or contact support.'
        },
        webhook: {
            signatureVerificationFailed: 'Webhook signature verification failed',
            invalidPayload: 'Invalid webhook payload',
            processingError: 'Error processing webhook event',
            eventHandled: 'Webhook event handled successfully',
            eventType: 'Event type: {{type}}',
            paymentIntentCreated: 'Payment intent created',
            paymentIntentSucceeded: 'Payment intent succeeded',
            paymentIntentFailed: 'Payment intent failed',
            paymentIntentCancelled: 'Payment intent cancelled'
        },
        testMode: {
            notice: 'If you encounter payment issues, please use a stable IP network and the following test card:',
            cardNumber: 'Test Card Number',
            expiry: 'Expiry',
            cvc: 'CVC',
            postal: 'Postal Code'
        }
    },
    disclaimers: {
        noSensitiveUse: 'Important Note: This AI project is for entertainment purposes only and is prohibited from being used for any sensitive, illegal, or explicit purposes.',
        nonMedicalAdvice: 'Disclaimer: AI-generated content is for entertainment only and does not constitute medical, legal, financial, or other professional advice.'
    },
    alerts: {
        error: {
            subscriptionNotFound: 'Subscription plan not found or user not logged in',
            priceNotFound: 'Price plan not found',
            createSubscriptionFailed: 'Subscription failed, please try again later',
            logoutFailed: 'Logout failed, please try again later',
            loginFailed: 'Login failed. Please check your credentials or try again.',
            registerFailed: 'Registration failed. Please try again.',
            emailAlreadyInUse: 'This email address is already in use. Please log in or use a different email.',
            invalidEmail: 'The email address is not valid. Please enter a valid email.',
            weakPassword: 'The password is too weak. Please choose a stronger password (e.g., at least 6 characters).',
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
        emptyResponseError: 'AI response is empty, please try again.',
        limit: {
            title: "Today's Remaining Chat Times",
            remaining: {
                prefix: "Remaining: ",
                suffix: "chats today"
            },
            exceeded: "You have reached your daily chat limit. Subscribe for more or try again tomorrow.",
            subscribe: "Subscribe for unlimited chats",
            unlimited: "Unlimited"
        }
    },
    nav: {
        home: 'Home',
        chat: 'Chat',
        subscription: 'Subscription',
        settings: 'Settings',
        profile: 'My Profile',
        wallet: 'Wallet',
        community: 'Community'
    },
    preview: {
        toggle: 'Toggle Mobile Preview',
        mobile: 'Mobile Mode',
        desktop: 'Desktop Mode'
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
    },
    privacy: {
        title: 'Privacy Policy',
        effective: 'Effective Date: 2025-02',
        intro: 'Welcome to AILove - Companions (the "App"). Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our App.',
        collect: '1. Information We Collect',
        personal: 'Personal Data: Email, username, profile info, birthdate',
        usage: 'Usage Data: App usage, device info, IP address',
        auth: 'Authentication Data: Google OAuth or email/password',
        location: 'Location Data: General location (province/city)',
        analytics: 'Analytics: We use analytics tools to improve the App',
        use: '2. How We Use Your Information',
        use1: 'Provide and improve the App',
        use2: 'Authenticate users and manage accounts',
        use3: 'Personalize content and recommendations',
        use4: 'Analyze usage and improve performance',
        use5: 'Communicate with you about updates or support',
        use6: 'Ensure security and prevent fraud',
        share: '3. How We Share Your Information',
        share1: 'We do not sell your personal information. We may share your information with service providers (e.g., Supabase, Firebase) and legal authorities if required by law.',
        retention: '4. Data Retention',
        retention1: 'We retain your information as long as your account is active or as needed to provide services. You may request deletion at any time by contacting us at support@saga1001.com.',
        security: '5. Security',
        security1: 'We implement industry-standard security measures. However, no method of transmission over the Internet or electronic storage is 100% secure.',
        children: "6. Children's Privacy",
        children1: 'The App is not intended for children under 13. If you believe we have collected such information, please contact us for removal.',
        rights: '7. Your Rights',
        rights1: 'You may access, update, or delete your personal information by contacting us at support@saga1001.com.',
        changes: '8. Changes to This Policy',
        changes1: 'We may update this Privacy Policy from time to time. Changes will be posted in the App and on our website.',
        contact: '9. Contact Us',
        contact1: 'If you have questions or concerns about this Privacy Policy, please contact us at: support@saga1001.com'
    },
    terms: {
        title: 'Terms of Use',
        effective: 'Effective Date: 2025-02',
        intro: 'Welcome to AILove - Companions (the "App"). By using this App, you agree to these Terms of Use. Please read them carefully.',
        accept: '1. Acceptance of Terms',
        accept1: 'By accessing or using the App, you agree to be bound by these Terms. If you do not agree, do not use the App.',
        use: '2. Use of the App',
        use1: 'The App is for personal, non-commercial use only.',
        use2: 'You must be at least 13 years old to use the App.',
        use3: 'You agree not to misuse the App or attempt to access it using a method other than the interface and instructions provided.',
        account: '3. User Accounts',
        account1: 'You are responsible for maintaining the confidentiality of your account credentials.',
        account2: 'You agree to provide accurate and complete information when creating an account.',
        account3: 'You are responsible for all activities that occur under your account.',
        ip: '4. Intellectual Property',
        ip1: 'All content, features, and functionality in the App are owned by SAGA entertainment or its licensors. You may not copy, modify, distribute, sell, or lease any part of the App without our written permission.',
        userContent: '5. User Content',
        userContent1: 'You retain ownership of any content you submit, but grant us a license to use, display, and distribute it as necessary to provide the App\'s services.',
        userContent2: 'You agree not to submit content that is unlawful, offensive, or infringes on the rights of others.',
        payments: '6. Payments and Purchases',
        payments1: 'In-app purchases may be available through third-party payment providers (e.g., Stripe, PayPal). All purchases are subject to the terms of those providers.',
        payments2: 'All sales are final unless required by law.',
        disclaimer: '7. Disclaimer and Limitation of Liability',
        disclaimer1: 'The App is provided "as is" without warranties of any kind. We do not guarantee the accuracy, completeness, or reliability of any analysis or information provided by the App. To the maximum extent permitted by law, SAGA entertainment is not liable for any damages arising from your use of the App.',
        termination: '8. Termination',
        termination1: 'We may suspend or terminate your access to the App at any time for violation of these Terms or for any other reason.',
        changes: '9. Changes to Terms',
        changes1: 'We may update these Terms from time to time. Changes will be posted in the App and on our website.',
        law: '10. Governing Law',
        law1: 'These Terms are governed by the laws of the applicable jurisdiction.',
        contact: '11. Contact Us',
        contact1: 'If you have questions about these Terms, please contact us at: support@saga1001.com'
    }
};