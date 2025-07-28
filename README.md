Here is the exact English translation with Markdown preserved:

## Supabase Edge Functions Project

This project contains Supabase Edge Functions deployable on Railway using the official Docker image `ghcr.io/supabase/edge-runtime`.

### Project Structure

```
├── Dockerfile.supabase-edge
├── railway.toml (optional)
├── supabase/
│   └── functions/
│       ├── main/
│       │   └── index.ts
│       ├── api-handler/
│       │   └── index.ts
│       └── webhook-processor/
│           └── index.ts
└── README.md
```

### Deployment on Railway

1. **Prepare your repository** with the recommended structure.
2. **Create the `Dockerfile.supabase-edge`** (already done).
3. **Configure environment variables** in Railway
4. SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,EDGE_FUNCTION_SECRET, HOST="::"  for ipv6 , PORT="9000" ).
5. **Deploy via Git** or GitHub connection.
6. **Generate a domain** to access your functions.
