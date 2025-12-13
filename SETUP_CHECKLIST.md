# Upayments Integration - Setup Checklist

Follow this checklist to complete the Upayments payment gateway integration.

## ✅ Step-by-Step Setup

### 1. Get Upayments Credentials
- [ ] Sign up for Upayments account (https://upayments.com)
- [ ] Get your **API Key** from dashboard
- [ ] Get your **Merchant ID** from dashboard
- [ ] Note both credentials (you'll need them in step 3)

### 2. Install Supabase CLI
```bash
npm install -g supabase
```
- [ ] CLI installed successfully
- [ ] Verify: `supabase --version`

### 3. Configure Supabase

#### Login and Link Project
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```
- [ ] Logged in to Supabase
- [ ] Project linked successfully

#### Set Environment Variables
```bash
supabase secrets set UPAYMENTS_API_KEY=your_api_key_here
supabase secrets set UPAYMENTS_MERCHANT_ID=your_merchant_id_here
```
- [ ] UPAYMENTS_API_KEY set
- [ ] UPAYMENTS_MERCHANT_ID set
- [ ] Verify: `supabase secrets list`

### 4. Update Database Schema

Run the migration:
```bash
supabase db push
```

Or manually run the SQL from `supabase/migrations/20231213_update_purchases_for_upayments.sql`

- [ ] Migration applied
- [ ] Purchases table has required columns
- [ ] Indexes created

### 5. Deploy Edge Functions

```bash
supabase functions deploy create-payment
supabase functions deploy payment-webhook
```

- [ ] create-payment function deployed
- [ ] payment-webhook function deployed
- [ ] Verify: `supabase functions list`

### 6. Configure Upayments Webhook

1. Go to your Upayments dashboard
2. Navigate to Settings → Webhooks
3. Add webhook URL:
   ```
   https://YOUR_PROJECT_REF.supabase.co/functions/v1/payment-webhook
   ```

- [ ] Webhook URL configured in Upayments dashboard
- [ ] Webhook is active

### 7. Update Frontend Environment

Make sure your `.env` file has:
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

- [ ] Frontend .env configured
- [ ] Supabase URL is correct
- [ ] Anon key is correct

### 8. Test the Integration

#### Test in Sandbox Mode
1. Run the app: `npm run dev`
2. Navigate to checkout page
3. Fill in test user details
4. Click "Pay Now"
5. You should be redirected to Upayments sandbox
6. Complete test payment
7. Verify redirect to success page
8. Check payment status updates in database

- [ ] Checkout page loads
- [ ] Payment creation works
- [ ] Redirect to Upayments works
- [ ] Test payment completes
- [ ] Webhook received
- [ ] Purchase status updates to 'completed'
- [ ] Success page shows confirmation

### 9. Check Logs

```bash
# Check create-payment logs
supabase functions logs create-payment

# Check webhook logs
supabase functions logs payment-webhook
```

- [ ] No errors in create-payment logs
- [ ] No errors in webhook logs
- [ ] Payment flow completes successfully

### 10. Go Live (When Ready)

Before switching to production:

1. Update `supabase/functions/create-payment/index.ts`:
   - Change API URL to: `https://api.upayments.com/api/v1/charge`
   - Change `test_mode: 1` to `test_mode: 0`

2. Redeploy:
   ```bash
   supabase functions deploy create-payment
   ```

3. Test with small real payment

- [ ] Switched to production API URL
- [ ] Changed to production mode
- [ ] Redeployed function
- [ ] Tested with real payment
- [ ] Everything works in production

## 🐛 Troubleshooting

If something doesn't work:

1. **Check function logs**:
   ```bash
   supabase functions logs create-payment --follow
   supabase functions logs payment-webhook --follow
   ```

2. **Verify secrets**:
   ```bash
   supabase secrets list
   ```

3. **Test webhook locally**:
   ```bash
   curl -X POST http://localhost:54321/functions/v1/payment-webhook \
     -H "Content-Type: application/json" \
     -d '{"id":"test","order_id":"test","status":"success"}'
   ```

4. **Check database**:
   - Verify purchases table exists
   - Check if pending purchases are created
   - See if status updates after payment

## 📚 Documentation

- **Main Guide**: `UPAYMENTS_INTEGRATION_GUIDE.md`
- **Quick Commands**: `supabase/DEPLOYMENT_COMMANDS.md`
- **Function Details**: `supabase/functions/README.md`

## ✨ You're Done!

Once all checkboxes are ticked, your Upayments integration is complete and ready to accept payments!

## 🔐 Security Notes

- Never commit `.env` files to git
- Never expose your API key or service role key
- Use environment variables for all secrets
- Test thoroughly in sandbox before going live
- Monitor logs regularly after launch

## 💡 Tips

- Start with sandbox mode
- Test the full flow multiple times
- Check webhook logs after each payment
- Keep Upayments documentation handy
- Monitor your first few real transactions closely

---

**Need Help?**
- Review the detailed guide in `UPAYMENTS_INTEGRATION_GUIDE.md`
- Check Upayments docs: https://upayments.com/docs
- Review Supabase Edge Functions docs: https://supabase.com/docs/guides/functions
