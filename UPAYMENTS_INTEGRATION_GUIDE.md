# Upayments Payment Gateway Integration Guide

This guide will help you deploy and configure the Upayments payment gateway integration for Kuwait.

## 🚀 Overview

The integration uses Supabase Edge Functions to handle payment initiation and webhook processing. Only 2 environment variables are needed.

## 📋 Prerequisites

1. **Supabase CLI** - Install if you haven't already:
   ```bash
   npm install -g supabase
   ```

2. **Upayments Account** - Get your API credentials:
   - API Key
   - Merchant ID

3. **Supabase Project** - You should have a Supabase project set up

## 🔧 Environment Variables

You need to set up **only 2 environment variables** in your Supabase project:

### 1. UPAYMENTS_API_KEY
Your Upayments API key for authentication.

### 2. UPAYMENTS_MERCHANT_ID
Your Upayments merchant identifier.

## 📦 Deployment Steps

### Step 1: Login to Supabase CLI

```bash
supabase login
```

This will open a browser window for authentication.

### Step 2: Link Your Project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

You can find your project reference in your Supabase dashboard URL:
`https://app.supabase.com/project/[YOUR_PROJECT_REF]`

### Step 3: Set Environment Variables (Secrets)

```bash
supabase secrets set UPAYMENTS_API_KEY=your_api_key_here
supabase secrets set UPAYMENTS_MERCHANT_ID=your_merchant_id_here
```

**Important:** Replace `your_api_key_here` and `your_merchant_id_here` with your actual Upayments credentials.

### Step 4: Deploy Edge Functions

Deploy both Edge Functions at once:

```bash
supabase functions deploy create-payment
supabase functions deploy payment-webhook
```

Or deploy them individually if you prefer:

```bash
# Deploy payment creation function
supabase functions deploy create-payment

# Deploy webhook function
supabase functions deploy payment-webhook
```

### Step 5: Verify Deployment

Check that your functions are deployed successfully:

```bash
supabase functions list
```

You should see both `create-payment` and `payment-webhook` in the list.

## 🔐 Frontend Environment Variables

Add this to your `.env` file in the frontend:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

These are already configured if you have Supabase set up.

## 🧪 Testing the Integration

### Test in Sandbox Mode

The integration is configured for **sandbox mode** (test mode) by default:
- `test_mode: 1` in the Upayments API call
- Sandbox API URL: `https://sandboxapi.upayments.com/api/v1/charge`

### Test Flow:

1. **User visits checkout page** → fills form → clicks "Pay Now"
2. **Frontend calls** `create-payment` Edge Function
3. **Edge Function**:
   - Creates pending purchase in database
   - Calls Upayments API to create payment session
   - Returns payment URL to frontend
4. **User is redirected** to Upayments payment gateway
5. **User completes payment** on Upayments
6. **Upayments sends webhook** to `payment-webhook` Edge Function
7. **Webhook function** updates purchase status to 'completed'
8. **User returns** to success page
9. **Success page** polls database to verify payment status
10. **Success!** User sees confirmation and gains access

## 🔄 Switching to Production

When ready for production:

1. Update the API URL in `supabase/functions/create-payment/index.ts`:
   ```typescript
   // Change from:
   const upaymentResponse = await fetch('https://sandboxapi.upayments.com/api/v1/charge', {

   // To:
   const upaymentResponse = await fetch('https://api.upayments.com/api/v1/charge', {
   ```

2. Change test mode to production:
   ```typescript
   // Change from:
   test_mode: 1,

   // To:
   test_mode: 0,
   ```

3. Redeploy the function:
   ```bash
   supabase functions deploy create-payment
   ```

## 📊 Database Schema

The integration expects a `purchases` table with these columns:

```sql
create table purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  amount_kwd numeric not null,
  status text not null check (status in ('pending', 'completed', 'failed')),
  has_upsell boolean default false,
  upayments_ref text,
  upayments_payment_id text,
  metadata jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add index for faster lookups
create index purchases_user_id_idx on purchases(user_id);
create index purchases_upayments_ref_idx on purchases(upayments_ref);
create index purchases_status_idx on purchases(status);
```

## 🛠️ Troubleshooting

### Function Logs

View real-time logs for debugging:

```bash
# View create-payment function logs
supabase functions logs create-payment

# View payment-webhook function logs
supabase functions logs payment-webhook

# Follow logs in real-time
supabase functions logs create-payment --follow
```

### Common Issues

1. **"Missing Upayments credentials" error**
   - Make sure you set the secrets: `supabase secrets list`
   - If missing, set them again using `supabase secrets set`

2. **CORS errors**
   - Edge Functions include CORS headers by default
   - Make sure you're calling from the correct origin

3. **Payment not updating after webhook**
   - Check webhook logs: `supabase functions logs payment-webhook`
   - Verify webhook URL is correct in Upayments dashboard
   - Check that the webhook payload matches expected structure

4. **User sees "Payment verification timeout"**
   - The success page polls for 30 seconds
   - If webhook takes longer, payment will still complete
   - User will receive email confirmation

### Test Webhook Locally

You can test the webhook function locally:

```bash
# Start local development
supabase functions serve payment-webhook

# Send a test webhook
curl -X POST http://localhost:54321/functions/v1/payment-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test_payment_123",
    "order_id": "order_test_123",
    "status": "success",
    "amount": 47,
    "currency": "KWD"
  }'
```

## 📞 Support

- **Upayments Documentation**: https://upayments.com/docs
- **Supabase Edge Functions Docs**: https://supabase.com/docs/guides/functions
- **Supabase CLI Reference**: https://supabase.com/docs/reference/cli

## ✅ Checklist

Before going live, ensure:

- [ ] Environment variables are set in Supabase
- [ ] Both Edge Functions are deployed
- [ ] Database schema is created
- [ ] Frontend `.env` is configured
- [ ] Test payment flow works in sandbox mode
- [ ] Webhook is receiving callbacks from Upayments
- [ ] Success page verification polling works
- [ ] Switched to production mode and URLs
- [ ] Test with real payment (small amount)
- [ ] Verified purchase updates in database

## 🎉 You're Done!

Your Upayments integration is now live. Users can purchase your course securely using K-NET, Visa, and MasterCard.
