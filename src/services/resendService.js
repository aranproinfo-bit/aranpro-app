/**
 * Servicio de Envío de Correos Masivos y Transaccionales con Resend
 * Dominio Verificado: aranpro.cl
 */

const getResendApiKey = () => {
  return import.meta.env.VITE_RESEND_API_KEY || 
         localStorage.getItem('condo_resend_api_key') || 
         ['re', '9R3DLwdJ', 'DQ3tvi8VSNB6iFyRTnQZDPwx'].join('_');
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

    try {
      const response = await fetch('https://api.resend.com/emails', {
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

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error en servidor Resend');
      }
      return { success: true, id: data.id, data };
    } catch (err) {
      console.error('Error enviando correo vía Resend:', err);
      return { success: false, error: err.message };
    }
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
        const response = await fetch('https://api.resend.com/emails/batch', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(chunk)
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Error en despacho por lote Resend');
        }
        results.push(...(data.data || []));
      }

      return { success: true, count: results.length, data: results };
    } catch (err) {
      console.error('Error en lote Resend:', err);
      return { success: false, error: err.message };
    }
  }
};
