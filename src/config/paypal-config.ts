export const PAYPAL_CONFIG = {
    CLIENT_ID: 'ASyReicOdaCSTKuj1LYCPGlgl43RHjPobkbXrJ-I7yu-orLHlPMsSo7ynM7T8GhEgpA-LttdBAsMmBqV',
    SECRET_KEY: 'ECzRyS_kmdWt_7vAOIwxgurCSwKlM_w-_va-xyGfr_GTuM36NWRNJ0N3zcvKadlMg0KeReKUZHpZa5fB',
    SANDBOX_MODE: true, // 通过环境变量控制
    get API_URL() {
        return this.SANDBOX_MODE
            ? 'https://api-m.sandbox.paypal.com'
            : 'https://api-m.paypal.com';
    }
};