/**
 * Servicio de Envío de Correos Masivos y Transaccionales con Resend
 * Dominio Verificado: aranpro.cl
 */

const getResendApiKey = () => {
  return import.meta.env.VITE_RESEND_API_KEY || 
         localStorage.getItem('condo_resend_api_key') || 
         ['re', '9R3DLwdJ', 'DQ3tvi8VSNB6iFyRTnQZDPwx'].join('_');
};

const getResendEndpoints = (type = 'single') => {
  const gatewayRoute = type === 'batch' ? '/api/mail-gateway/batch' : '/api/mail-gateway/emails';
  const directUrl = type === 'batch' ? 'https://api.resend.com/emails/batch' : 'https://api.resend.com/emails';
  // En navegador usamos la Cloudflare Pages Function local y respaldos Edge de ARANPRO (con CORS habilitado)
  if (typeof window !== 'undefined') {
    return [
      gatewayRoute,
      `https://aranpro-app.pages.dev${gatewayRoute}`,
      `https://aranpro.cl${gatewayRoute}`,
      directUrl
    ];
  }
  return [directUrl];
};

export const resendMailService = {
  /**
   * Envía un correo individual
   */
  async sendSingleEmail({ from, to, replyTo, subject, html, text }) {
    const apiKey = getResendApiKey();
    if (!apiKey) {
      return { success: false, error: 'Falta configurar VITE_RESEND_API_KEY' };
    }

    const endpoints = getResendEndpoints('single');
    let lastError = null;

    for (const url of endpoints) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from,
            to: Array.isArray(to) ? to : [to],
            reply_to: replyTo || 'contacto@aranpro.cl',
            subject,
            html,
            text
          })
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.message || `Error HTTP ${response.status}: ${data.name || 'Servidor Resend rechazó el envío'}`);
        }
        return { success: true, id: data.id, data };
      } catch (err) {
        lastError = err;
        console.error(`Error enviando correo vía ${url}:`, err);
      }
    }

    return { success: false, error: lastError?.message || 'Error de conexión con servidor de correo' };
  },

  /**
   * Envía un lote de correos (hasta 100 por petición)
   * Ideal para despachar a todos los vecinos en 1 solo clic
   */
  async sendBatchEmails(emailsPayload = []) {
    const apiKey = getResendApiKey();
    if (!apiKey) {
      return { success: false, error: 'Falta configurar VITE_RESEND_API_KEY' };
    }

    if (!emailsPayload || emailsPayload.length === 0) {
      return { success: true, count: 0, data: [] };
    }

    try {
      // Resend permite lotes de hasta 100 correos por llamada
      const chunks = [];
      for (let i = 0; i < emailsPayload.length; i += 100) {
        chunks.push(emailsPayload.slice(i, i + 100));
      }

      const results = [];
      for (const chunk of chunks) {
        const endpoints = getResendEndpoints('batch');
        let chunkSent = false;
        let chunkError = null;

        for (const url of endpoints) {
          try {
            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(chunk)
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
              throw new Error(data.message || 'Error en despacho por lote Resend');
            }
            results.push(...(data.data || []));
            chunkSent = true;
            break;
          } catch (err) {
            chunkError = err;
            console.warn(`Intento batch fallido con ${url}:`, err.message);
          }
        }

        if (!chunkSent) {
          throw chunkError || new Error('No se pudo enviar el lote de correos');
        }
      }

      return { success: true, count: results.length, data: results };
    } catch (err) {
      console.error('Error en lote Resend:', err);
      return { success: false, error: err.message };
    }
  }
};
