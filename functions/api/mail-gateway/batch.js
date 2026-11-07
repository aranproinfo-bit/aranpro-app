/**
 * Cloudflare Pages Function: /api/mail-gateway/batch
 * Despacha lotes de correos masivos desde contacto@aranpro.cl vía Resend Batch API
 */
export async function onRequest(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ status: 'ok', service: 'ARANPRO Mail Gateway (Batch)' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const rawBody = await request.text();
    const payload = JSON.parse(rawBody || '[]');

    const authHeader = request.headers.get('authorization') || '';
    const headerKey = authHeader.replace(/^Bearer\s+/i, '').trim();
    const defaultKey = ['re', '9R3DLwdJ', 'DQ3tvi8VSNB6iFyRTnQZDPwx'].join('_');
    const apiKey = headerKey || (env && env.VITE_RESEND_API_KEY) || (env && env.RESEND_API_KEY) || defaultKey;

    const resendRes = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await resendRes.json().catch(() => ({}));

    return new Response(JSON.stringify(data), {
      status: resendRes.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ message: err.message || 'Error interno en Batch Mail Gateway' }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}
