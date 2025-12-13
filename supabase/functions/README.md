# Supabase Edge Functions - Upayments Integration

This directory contains the Edge Functions for handling Upayments payment gateway integration.

## 📁 Functions

### 1. `create-payment`
**Purpose**: Initiates a payment session with Upayments

**Endpoint**: `POST /functions/v1/create-payment`

**Request Body**:
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "name": "User Name",
  "amount": 47,
  "hasUpsell": false
}
```

**Response**:
```json
{
  "paymentUrl": "https://payment.upayments.com/...",
  "orderId": "order_123...",
  "purchaseId": "uuid"
}
```

**What it does**:
1. Validates input parameters
2. Creates a pending purchase record in the database
3. Calls Upayments API to create a payment session
4. Returns the payment URL to redirect the user

**Environment Variables Required**:
- `UPAYMENTS_API_KEY` - Upayments API key
- `UPAYMENTS_MERCHANT_ID` - Upayments merchant ID
- `SUPABASE_URL` - Auto-provided by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-provided by Supabase

---

### 2. `payment-webhook`
**Purpose**: Receives payment status updates from Upayments

**Endpoint**: `POST /functions/v1/payment-webhook`

**Request Body** (from Upayments):
```json
{
  "id": "payment_id",
  "order_id": "order_123",
  "status": "success",
  "amount": 47,
  "currency": "KWD",
  "reference": "order_123",
  "trackid": "track_123"
}
```

**Response**:
```json
{
  "status": "success",
  "message": "Webhook processed successfully",
  "purchaseId": "uuid",
  "paymentStatus": "completed"
}
```

**What it does**:
1. Receives webhook from Upayments
2. Finds the purchase record by order_id
3. Updates purchase status (completed/failed)
4. Stores full webhook payload for debugging
5. Always returns 200 OK to acknowledge receipt

**Environment Variables Required**:
- `SUPABASE_URL` - Auto-provided by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-provided by Supabase

---

## 🚀 Deployment

### Deploy All Functions
```bash
supabase functions deploy
```

### Deploy Individual Function
```bash
supabase functions deploy create-payment
supabase functions deploy payment-webhook
```

### View Logs
```bash
# Real-time logs
supabase functions logs create-payment --follow

# Recent logs
supabase functions logs payment-webhook
```

---

## 🧪 Local Development

### Serve All Functions Locally
```bash
supabase functions serve
```

### Serve Specific Function
```bash
supabase functions serve create-payment --env-file .env.local
```

### Test with curl

**Test create-payment**:
```bash
curl -X POST http://localhost:54321/functions/v1/create-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "userId": "test-user-id",
    "email": "test@example.com",
    "name": "Test User",
    "amount": 47,
    "hasUpsell": false
  }'
```

**Test payment-webhook**:
```bash
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

---

## 🔐 Environment Setup

Create a `.env.local` file for local development:

```env
UPAYMENTS_API_KEY=your_sandbox_api_key
UPAYMENTS_MERCHANT_ID=your_merchant_id
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=your_local_service_role_key
```

For production, set secrets via Supabase CLI:
```bash
supabase secrets set UPAYMENTS_API_KEY=your_api_key
supabase secrets set UPAYMENTS_MERCHANT_ID=your_merchant_id
```

---

## 🔄 Payment Flow

```mermaid
sequenceDiagram
    User->>Frontend: Click "Pay Now"
    Frontend->>create-payment: POST /create-payment
    create-payment->>Database: Create pending purchase
    create-payment->>Upayments API: Create payment session
    Upayments API-->>create-payment: Return payment URL
    create-payment-->>Frontend: Return payment URL
    Frontend->>Upayments: Redirect user
    User->>Upayments: Complete payment
    Upayments->>payment-webhook: POST webhook
    payment-webhook->>Database: Update to 'completed'
    payment-webhook-->>Upayments: 200 OK
    Upayments->>Frontend: Redirect to success page
    Frontend->>Database: Poll for status
    Database-->>Frontend: status='completed'
    Frontend->>User: Show success message
```

---

## 📝 Notes

### Sandbox vs Production

**Sandbox Mode** (default):
- URL: `https://sandboxapi.upayments.com/api/v1/charge`
- `test_mode: 1`

**Production Mode**:
- URL: `https://api.upayments.com/api/v1/charge`
- `test_mode: 0`

### Webhook Configuration

Configure the webhook URL in your Upayments dashboard:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/payment-webhook
```

### Security

- All functions validate input parameters
- Database operations use Row Level Security (RLS)
- Service role key bypasses RLS for webhook updates
- CORS headers allow cross-origin requests
- Webhook always returns 200 to prevent retries

### Error Handling

- Failed payments are marked with `status='failed'`
- Full error details are logged
- Users see friendly Arabic error messages
- Frontend polls for 30 seconds to handle delayed webhooks

---

## 🐛 Debugging

### Common Issues

1. **"Missing Upayments credentials"**
   - Check: `supabase secrets list`
   - Fix: `supabase secrets set UPAYMENTS_API_KEY=...`

2. **Purchase not found in webhook**
   - Check `upayments_ref` matches `order_id` from webhook
   - View logs: `supabase functions logs payment-webhook`

3. **CORS errors**
   - Ensure origin is allowed in corsHeaders
   - Check browser console for specific error

4. **Payment stays in 'pending'**
   - Webhook may not be configured in Upayments
   - Check webhook logs for incoming requests
   - Verify webhook URL is correct

### Log Examples

**Successful Payment**:
```
Calling Upayments API with payload: {...}
Upayments API response: { data: { link: "..." } }
```

**Webhook Received**:
```
Received webhook from Upayments: {...}
Payment status: success Is successful: true
Purchase uuid updated to status: completed
Payment successful for user uuid, amount: 47 KWD
```

---

## ✅ Testing Checklist

- [ ] Create payment function deploys without errors
- [ ] Webhook function deploys without errors
- [ ] Can create payment and get redirect URL
- [ ] Upayments payment page loads
- [ ] Webhook receives payment notification
- [ ] Purchase status updates to 'completed'
- [ ] Success page shows correct status
- [ ] Failed payment shows error message
- [ ] Logs show complete payment flow

---

## 📚 Resources

- [Upayments API Docs](https://upayments.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Deno Deploy](https://deno.com/deploy/docs)
