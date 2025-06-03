标注一下 是否清楚标识"无人工服务"和免责声明

建议添加反欺诈提示，降低风控等级风险

强烈建议在网站、产品说明、隐私协议中标明"无敏感用途""非医疗建议"等免责说明 加一下

添加隐私协议 privacy ，用户协议Term of use


---
Based on this clarification, here is the slightly adjusted plan:
Legal Documents (Privacy Policy, Terms of Use):
Location: Create new, dedicated static pages in src/pages.
Accessibility: Link these pages from signup/login, payment pages, site footer, and potentially within the UserProfileDropdown.tsx.
General Disclaimers ("no manual service", anti-fraud tips):
Location: Display these as rotating messages using the existing MarqueeNotice.tsx component, managed via src/config/marquee-config.ts.
Product-Specific Disclaimers ("no sensitive use", "non-medical advice"):
Location: Place these as permanent, static text directly within the CharacterSelector.tsx component and the main chat interface component.
Implementation: Add these disclaimers as visible text elements within the JSX structure of these components. Ensure the text is pulled from the i18next system using useLanguage() for multi-language support.
Note: These specific disclaimers will not be added to the marquee-config.ts messages.
Documentation Update:
Update the README.md to reflect the addition of new policies and disclaimers.
This refined plan ensures that the legal policies are on dedicated pages, general announcements and anti-fraud tips utilize the prominent marquee, and the product-specific disclaimers are permanently visible in the relevant character interaction areas, as requested.
The rest of the plan remains the same, adhering to the development rules about modularity, .env configuration, and i18next usage.
Does this adjusted plan align with your requirements? Once confirmed, we can proceed with the implementation steps.




---
              {`# Privacy Policy

Effective Date: 2025-02

Welcome to Chinese Zodiac Analyzer (the "App"). Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our App, developed with Expo and React Native, and available on iOS and Android platforms.

## 1. Information We Collect

We may collect information about you in a variety of ways. The information we may collect via the App includes:

### a. Personal Data
- Email address (for account registration and authentication)
- Username
- Profile information (such as profile picture, if provided)
- Birthdate (for zodiac and astrology analysis)

### b. Usage Data
- App usage statistics
- Feature interaction data (e.g., which analysis or sharing features are used)
- Device information (model, OS version, language, country)
- IP address (for security and analytics)

### c. Authentication Data
- Google OAuth or email/password login credentials (never stored in plain text)

### d. Location Data
- General location (province/city, for analysis and localization)
- No precise GPS data is collected unless explicitly authorized by the user

### e. Analytics and Cookies
- We use analytics tools to improve the App. No cookies are used in the mobile app, but analytics SDKs may collect anonymized usage data.

## 2. How We Use Your Information

We use the information we collect to:
- Provide and improve the App's features and user experience
- Authenticate users and manage accounts
- Personalize content and recommendations
- Analyze usage and improve performance
- Communicate with you about updates, features, or support
- Ensure security and prevent fraud

## 3. How We Share Your Information

We do not sell your personal information. We may share your information with:
- Service providers (e.g., Supabase, Firebase) for authentication, data storage, and analytics
- Legal authorities if required by law

## 4. Data Retention

We retain your information as long as your account is active or as needed to provide you services. You may request deletion of your account and data at any time by contacting us at support@saga1001.com.

## 5. Security

We implement industry-standard security measures to protect your data. However, no method of transmission over the Internet or electronic storage is 100% secure.

## 6. Children's Privacy

The App is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us for removal.

## 7. Your Rights

You may access, update, or delete your personal information by contacting us at support@saga1001.com.

## 8. Changes to This Policy

We may update this Privacy Policy from time to time. Changes will be posted in the App and on our website at /about/privacy (replace with your real domain after deployment).

## 9. Contact Us

If you have questions or concerns about this Privacy Policy, please contact us at:
- Email: support@saga1001.com`}


---
{`# Terms of Use

Effective Date: 2025-02

Welcome to Chinese Zodiac Analyzer (the "App"). By using this App, you agree to these Terms of Use. Please read them carefully.

## 1. Acceptance of Terms
By accessing or using the App, you agree to be bound by these Terms. If you do not agree, do not use the App.

## 2. Use of the App
- The App is for personal, non-commercial use only.
- You must be at least 13 years old to use the App.
- You agree not to misuse the App or attempt to access it using a method other than the interface and instructions provided.

## 3. User Accounts
- You are responsible for maintaining the confidentiality of your account credentials.
- You agree to provide accurate and complete information when creating an account.
- You are responsible for all activities that occur under your account.

## 4. Intellectual Property
- All content, features, and functionality in the App are owned by SAGA entertainment or its licensors.
- You may not copy, modify, distribute, sell, or lease any part of the App without our written permission.

## 5. User Content
- You retain ownership of any content you submit, but grant us a license to use, display, and distribute it as necessary to provide the App's services.
- You agree not to submit content that is unlawful, offensive, or infringes on the rights of others.

## 6. Payments and Purchases
- In-app purchases may be available through third-party payment providers (e.g., Stripe, PayPal). All purchases are subject to the terms of those providers.
- All sales are final unless required by law.

## 7. Disclaimer and Limitation of Liability
- The App is provided "as is" without warranties of any kind.
- We do not guarantee the accuracy, completeness, or reliability of any analysis or information provided by the App.
- To the maximum extent permitted by law, SAGA entertainment is not liable for any damages arising from your use of the App.

## 8. Termination
- We may suspend or terminate your access to the App at any time for violation of these Terms or for any other reason.

## 9. Changes to Terms
- We may update these Terms from time to time. Changes will be posted in the App and on our website at /about/terms (replace with your real domain after deployment).

## 10. Governing Law
- These Terms are governed by the laws of the applicable jurisdiction.

## 11. Contact Us
If you have questions about these Terms, please contact us at:
- Email: support@saga1001.com`}