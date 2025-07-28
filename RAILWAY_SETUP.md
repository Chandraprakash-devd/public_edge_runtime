Here is the English translation:

# Railway Configuration for Supabase Edge Functions

## Environment Variables to Configure

In your Railway project settings, add the following variables:

```
SUPABASE_URL=https://[your-project].supabase.co  
SUPABASE_ANON_KEY=[your-public-key]  
SUPABASE_SERVICE_ROLE_KEY=[your-service-key]  
```

## Port

Railway automatically sets the `PORT` variable. Our application detects and uses it.

## Available Endpoints

Once deployed, you will have access to:

* `https://[your-app].railway.app/` – Welcome message
* `https://[your-app].railway.app/api-handler/*` – API Handler
* `https://[your-app].railway.app/webhook-processor/*` – Webhook Processor

## Test

Test your deployment with:

```bash
curl https://[your-app].railway.app/
curl https://[your-app].railway.app/api-handler/test
curl https://[your-app].railway.app/webhook-processor/webhook
```

## Logs

The logs will show:

* "Main function starting..."
* "Server running on port \[PORT]"
* Received requests

## Next Steps

1. Implement the actual logic in the `api-handler` and `webhook-processor` functions
2. Add JWT authentication if needed
3. Connect to your Supabase database
