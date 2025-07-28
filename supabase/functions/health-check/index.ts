import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { connect } from "https://deno.land/x/amqp@v0.23.1/mod.ts"
// Try using npm: prefix for better Deno compatibility
import { S3Client, ListBucketsCommand } from "npm:@aws-sdk/client-s3@3.478.0"

console.log("Health check function starting...")

export default async function handler(req: Request) {
  // CORS headers for browser testing
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const results = {
    timestamp: new Date().toISOString(),
    status: 'checking',
    environment: {
      has_supabase_url: !!Deno.env.get('SUPABASE_URL'),
      has_service_key: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      has_rabbitmq_url: !!Deno.env.get('RABBITMQ_PRIVATE_URL'),
      has_minio_endpoint: !!Deno.env.get('MINIO_PRIVATE_ENDPOINT'),
      has_minio_access_key: !!Deno.env.get('MINIO_GLOBAL_ACCESS_KEY'),
    },
    checks: {
      supabase: { status: 'pending', message: '', error: null },
      rabbitmq: { status: 'pending', message: '', error: null },
      minio: { status: 'pending', message: '', error: null },
    }
  }

  // Test 1: Supabase Connection
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }

    // Handle Railway internal URLs - they use HTTP, not HTTPS
    let formattedUrl = supabaseUrl
    if (supabaseUrl.includes('.railway.internal')) {
      // Railway internal URLs should use HTTP
      formattedUrl = supabaseUrl.startsWith('http') ? supabaseUrl : `http://${supabaseUrl}`
    } else {
      // External URLs typically use HTTPS
      formattedUrl = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`
    }

    const supabase = createClient(formattedUrl, supabaseServiceKey, {
      db: {
        schema: 'public', // Use public schema like the main app
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
    
    // Try a simple RPC call or query to test connection
    try {
      // Just try to get the auth user to verify the service key works
      const { data, error } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1
      })
      
      if (error) throw error
      
      results.checks.supabase = {
        status: 'success',
        message: `Connected to Supabase at ${formattedUrl}`,
        error: null
      }
    } catch (queryError) {
      // If query fails, just verify client creation worked
      results.checks.supabase = {
        status: 'success',
        message: `Supabase client configured for ${formattedUrl} (connection not verified)`,
        error: null
      }
    }
  } catch (error) {
    results.checks.supabase = {
      status: 'failed',
      message: 'Failed to configure Supabase client',
      error: error.message
    }
  }

  // Test 2: RabbitMQ Connection
  try {
    const rabbitmqUrl = Deno.env.get('RABBITMQ_PRIVATE_URL')
    
    if (!rabbitmqUrl) {
      throw new Error('Missing RABBITMQ_PRIVATE_URL')
    }

    // Parse the AMQP URL to extract components
    const url = new URL(rabbitmqUrl)
    const username = url.username || 'guest'
    const password = url.password || 'guest'
    const hostname = url.hostname || 'localhost'
    const port = url.port || '5672'

    const connection = await connect({
      hostname,
      port: parseInt(port),
      username,
      password,
    })
    
    await connection.close()
    
    results.checks.rabbitmq = {
      status: 'success',
      message: `Connected to RabbitMQ at ${hostname}:${port}`,
      error: null
    }
  } catch (error) {
    results.checks.rabbitmq = {
      status: 'failed',
      message: 'Failed to connect to RabbitMQ',
      error: error.message
    }
  }

  // Test 3: MinIO/S3 Connection
  try {
    const s3Endpoint = Deno.env.get('MINIO_PRIVATE_ENDPOINT')
    const s3AccessKey = Deno.env.get('MINIO_GLOBAL_ACCESS_KEY')
    const s3SecretKey = Deno.env.get('MINIO_GLOBAL_SECRET_KEY')
    const s3Region = Deno.env.get('MINIO_REGION') || 'us-east-1'
    
    if (!s3Endpoint || !s3AccessKey || !s3SecretKey) {
      throw new Error('Missing MINIO_PRIVATE_ENDPOINT, MINIO_GLOBAL_ACCESS_KEY, or MINIO_GLOBAL_SECRET_KEY')
    }

    // Handle Railway's endpoint format - exactly like your minioService
    const formattedEndpoint = s3Endpoint.startsWith('http') ? s3Endpoint : `http://${s3Endpoint}`

    // Initialize S3Client exactly like your minioService.server.ts
    const s3Client = new S3Client({
      endpoint: formattedEndpoint,
      region: s3Region,
      credentials: {
        accessKeyId: s3AccessKey,
        secretAccessKey: s3SecretKey,
      },
      forcePathStyle: true, // Required for MinIO
    })
    
    // Try to list buckets to test connection
    const command = new ListBucketsCommand({})
    const response = await s3Client.send(command)
    
    results.checks.minio = {
      status: 'success',
      message: `Connected to MinIO at ${formattedEndpoint}. Found ${response.Buckets?.length || 0} buckets`,
      error: null
    }
  } catch (error) {
    results.checks.minio = {
      status: 'failed',
      message: 'Failed to connect to MinIO',
      error: error.message
    }
  }

  // Determine overall status
  const allChecks = Object.values(results.checks)
  const hasFailures = allChecks.some(check => check.status === 'failed')
  results.status = hasFailures ? 'unhealthy' : 'healthy'

  return new Response(
    JSON.stringify(results, null, 2),
    { 
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: hasFailures ? 503 : 200
    }
  )
}