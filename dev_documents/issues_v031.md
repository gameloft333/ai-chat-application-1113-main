{
  "object": {
    "id": "ch_3RLjriISLzgtB7h600Pi5lwQ",
    "object": "charge",
    "amount": 1900,
    "amount_captured": 1900,
    "amount_refunded": 0,
    "application": null,
    "application_fee": null,
    "application_fee_amount": null,
    "balance_transaction": "txn_3RLjriISLzgtB7h60Kc6EFT1",
    "billing_details": {
      "address": {
        "city": null,
        "country": null,
        "line1": null,
        "line2": null,
        "postal_code": "63247",
        "state": null
      },
      "email": "test121@test.com",
      "name": null,
      "phone": null,
      "tax_id": null
    },
    "calculated_statement_descriptor": "GGC INNOVATION",
    "captured": true,
    "created": 1746531673,
    "currency": "usd",
    "customer": null,
    "description": null,
    "destination": null,
    "dispute": null,
    "disputed": false,
    "failure_balance_transaction": null,
    "failure_code": null,
    "failure_message": null,
    "fraud_details": {},
    "invoice": null,
    "livemode": false,
    "metadata": {},
    "on_behalf_of": null,
    "order": null,
    "outcome": {
      "advice_code": null,
      "network_advice_code": null,
      "network_decline_code": null,
      "network_status": "approved_by_network",
      "reason": null,
      "risk_level": "normal",
      "risk_score": 33,
      "seller_message": "Payment complete.",
      "type": "authorized"
    },
    "paid": true,
    "payment_intent": "pi_3RLjriISLzgtB7h60cIQHn5q",
    "payment_method": "pm_1RLjs5ISLzgtB7h6IImOXoXA",
    "payment_method_details": {
      "card": {
        "amount_authorized": 1900,
        "authorization_code": null,
        "brand": "visa",
        "checks": {
          "address_line1_check": null,
          "address_postal_code_check": "pass",
          "cvc_check": "pass"
        },
        "country": "US",
        "exp_month": 3,
        "exp_year": 2036,
        "extended_authorization": {
          "status": "disabled"
        },
        "fingerprint": "0MfQnrKNHeusezeE",
        "funding": "credit",
        "incremental_authorization": {
          "status": "unavailable"
        },
        "installments": null,
        "last4": "4242",
        "mandate": null,
        "multicapture": {
          "status": "unavailable"
        },
        "network": "visa",
        "network_token": {
          "used": false
        },
        "network_transaction_id": "487710281110114",
        "overcapture": {
          "maximum_amount_capturable": 1900,
          "status": "unavailable"
        },
        "regulated_status": "unregulated",
        "three_d_secure": null,
        "wallet": null
      },
      "type": "card"
    },
    "radar_options": {},
    "receipt_email": null,
    "receipt_number": null,
    "receipt_url": "https://pay.stripe.com/receipts/payment/CAcaFwoVYWNjdF8xUE9pN0dJU0x6Z3RCN2g2KN3q58AGMgYRcyXU_ks6LBY7jtbVMdmOuQXKWGoDj2t0nmxTLLVyalWT1EQ8Ky3H9Qqv58lfa7TGloYF",
    "refunded": false,
    "review": null,
    "shipping": null,
    "source": null,
    "source_transfer": null,
    "statement_descriptor": null,
    "statement_descriptor_suffix": null,
    "status": "succeeded",
    "transfer_data": null,
    "transfer_group": null
  },
  "previous_attributes": {
    "balance_transaction": null,
    "receipt_url": "https://pay.stripe.com/receipts/payment/CAcaFwoVYWNjdF8xUE9pN0dJU0x6Z3RCN2g2KN3q58AGMgbIzPHwkgk6LBaIyC2Ryjltp44Mm6KgXq5km4_grP_32ASzEdM9ILWMgowKChrFLqIS_roO"
  }
}