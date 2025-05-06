import { loadStripe, Stripe } from '@stripe/stripe-js';
import { STRIPE_CONFIG } from '../config/stripe-config';
import { loadEnv } from '../utils/env-utils';

export class StripeService {
    private static instance: StripeService;
    private stripe: Stripe | null = null;
    private isInitializing: boolean = false;

    private constructor() {}

    public static getInstance(): StripeService {
        if (!StripeService.instance) {
            StripeService.instance = new StripeService();
        }
        return StripeService.instance;
    }

    private async ensureInitialized() {
        if (this.stripe) return;
        if (this.isInitializing) {
            // Wait for initialization to complete
            await new Promise(resolve => {
                const checkInitialization = () => {
                    if (!this.isInitializing) {
                        resolve(null);
                    } else {
                        setTimeout(checkInitialization, 100);
                    }
                };
                checkInitialization();
            });
            // After waiting, stripe should be initialized, or we throw if still not.
            if (!this.stripe) throw new Error('Stripe initialization failed after wait.');
            return; 
        }

        try {
            this.isInitializing = true;
            const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
            if (!stripeKey) {
                throw new Error('VITE_STRIPE_PUBLISHABLE_KEY is not set in environment variables.');
            }
            this.stripe = await loadStripe(stripeKey);
            if (!this.stripe) {
                // This case should ideally be caught by loadStripe itself if key is invalid,
                // but good to have a check.
                throw new Error('Stripe.js failed to load. Check your publishable key.');
            }
        } catch(error) {
            console.error("Error during Stripe initialization:", error);
            this.isInitializing = false; // Reset flag on error
            throw error; // Re-throw to signal failure
        } 
        finally {
            this.isInitializing = false;
        }
    }

    async createPaymentIntent(amount: number, currency: string, userId: string): Promise<string> {
        console.log('StripeService: Creating payment intent...', { amount, currency, userId });
        
        try {
            await this.ensureInitialized();
            console.log('StripeService: Stripe initialized.');
            
            const API_URL = STRIPE_CONFIG.API_URL || import.meta.env.VITE_PAYMENT_API_URL;
            if (!API_URL) {
                throw new Error('Payment API URL (VITE_PAYMENT_API_URL) is not configured.');
            }
            console.log('StripeService: Requesting payment intent from API URL:', API_URL);
            
            const response = await fetch(`${API_URL}/api/stripe/create-payment-intent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    amount, 
                    currency,
                    userId, // Include Firebase UID
                    timestamp: new Date().getTime(),
                    origin: window.location.origin 
                }),
                credentials: 'include',
                mode: 'cors'
            });

            console.log('StripeService: Create payment intent API response status:', response.status);
            
            if (!response.ok) {
                let errorMessage = `Payment service request failed with status ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (e) {
                    // If parsing error JSON fails, use the text content if available
                    const textError = await response.text().catch(() => '');
                    if (textError) errorMessage += ` - ${textError}`;
                }
                
                console.error('StripeService: Payment service error:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorMessage
                });
                
                throw new Error(errorMessage);
            }

            const data = await response.json();
            if (!data.clientSecret) {
                console.error('StripeService: clientSecret missing in API response:', data);
                throw new Error('Failed to retrieve payment client secret from server.');
            }
            console.log('StripeService: Payment intent created successfully. Client Secret:', data.clientSecret.substring(0, 10) + "..."); // Log part of secret
            return data.clientSecret;
        } catch (error) {
            console.error('StripeService: Error creating payment intent:', error);
            
            // Simplified retry logic for this example, or remove if causing issues
            // Be cautious with retrying payment intent creation as it might lead to multiple intents
            // For this specific flow, if createPaymentIntent fails, it's usually better to show error to user.
            // if (this.shouldRetry(error)) {
            //     console.log('StripeService: Attempting to retry createPaymentIntent...');
            //     return await this.retryCreatePaymentIntent(amount, currency, userId);
            // }
            
            throw error; // Re-throw the error to be handled by the caller
        }
    }

    // Retry logic might be too aggressive for payment intent creation. 
    // Consider removing or simplifying if it causes issues.
    private shouldRetry(error: any): boolean {
        // Only retry on specific network-related errors, not on Stripe API errors usually
        const message = String(error?.message || '').toLowerCase();
        return error instanceof TypeError || 
               message.includes('networkerror') || // For Firefox
               message.includes('failed to fetch');  // For Chrome and others
    }

    private async retryCreatePaymentIntent(amount: number, currency: string, userId: string, retries = 1): Promise<string> { // Reduced default retries
        for (let i = 0; i < retries; i++) {
            try {
                await new Promise(resolve => setTimeout(resolve, 1500 * (i + 1))); // Increased delay
                console.log(`StripeService: Retrying createPaymentIntent (attempt ${i + 1}/${retries})`);
                return await this.createPaymentIntent(amount, currency, userId); // Call the main method for retry
            } catch (error) {
                console.log(`StripeService: Retry attempt ${i + 1} failed:`, error);
                if (i === retries - 1) throw error; // Throw last error if all retries fail
            }
        }
        // This line should not be reached if logic is correct, but as a fallback:
        throw new Error('StripeService: Max retries reached for payment intent creation.');
    }

    getStripe(): Stripe | null {
        if (!this.stripe && !this.isInitializing) {
            // console.warn("StripeService: getStripe called before initialization or after failed init. Attempting to initialize.");
            // this.ensureInitialized().catch(err => console.error("StripeService: Auto-init in getStripe failed:", err));
            // It's generally better to ensure `ensureInitialized` is called and awaited by the consuming component.
            // Returning null if not initialized, or throwing error, depends on desired strictness.
        }
        return this.stripe;
    }
}