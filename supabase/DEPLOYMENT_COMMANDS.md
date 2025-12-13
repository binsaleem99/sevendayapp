# Quick Deployment Commands

## Initial Setup

```bash
# 1. Login to Supabase
supabase login

# 2. Link your project
supabase link --project-ref YOUR_PROJECT_REF

# 3. Set environment variables (secrets)
supabase secrets set UPAYMENTS_API_KEY=your_api_key_here
supabase secrets set UPAYMENTS_MERCHANT_ID=your_merchant_id_here
```

## Deploy Edge Functions

```bash
# Deploy both functions
supabase functions deploy create-payment
supabase functions deploy payment-webhook

# Or deploy in one command
supabase functions deploy
```

## Verify Deployment

```bash
# List all functions
supabase functions list

# View secrets
supabase secrets list

# View function logs
supabase functions logs create-payment
supabase functions logs payment-webhook

# Follow logs in real-time
supabase functions logs create-payment --follow
```

## Update Functions

When you make changes to the Edge Functions:

```bash
# Redeploy specific function
supabase functions deploy create-payment

# Redeploy all functions
supabase functions deploy
```

## Local Development

```bash
# Start local Supabase
supabase start

# Serve functions locally
supabase functions serve

# Serve specific function
supabase functions serve create-payment
```

## Environment Variables Needed

### Supabase Secrets (set via CLI):
- `UPAYMENTS_API_KEY` - Your Upayments API key
- `UPAYMENTS_MERCHANT_ID` - Your Upayments merchant ID

### Frontend .env:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon/public key

## Function URLs

After deployment, your functions will be available at:

- **Create Payment**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-payment`
- **Payment Webhook**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/payment-webhook`

Use the webhook URL in your Upayments dashboard configuration.
