const FROM = process.env.MAIL_FROM || 'Jack Klemm <notifications@klemmre.com>';
const TO = process.env.MAIL_TO || 'jack@klemmre.com';
const SITE = process.env.SITE_URL || 'https://www.klemmre.com';
const LOGO = process.env.MAIL_LOGO || `${SITE}/assets/email-logo.png`;
const FORM_ORIGINS = new Set([
 'https://klemm-real-estate-tracy.jabach0811.chatgpt.site',
 'https://klemm-real-estate-efkto1r1b-c-d-solutions.vercel.app',
 SITE,
]);

const HIDDEN = new Set(['_gotcha', '_replyto', 'page', 'Page']);

const LABELS = {
 name: 'Name', phone: 'Phone', email: 'Email', _subject: 'Subject', message: 'Message',
 address: 'Property address', community: 'Community', timing: 'Timing',
 where: 'Where', budget: 'Budget', bedrooms: 'Bedrooms', musthaves: 'Must-haves',
 deliver: 'Delivery preference',
};

const ORDER = ['name', 'phone', 'email', '_subject', 'message'];

const label = key => LABELS[key] || key.replace(/[-_]+/g, ' ').replace(/^./, c => c.toUpperCase());
const esc = value => String(value).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const validEmail = value => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(value).trim());

function fields(body) {
 const entries = Object.entries(body)
  .filter(([key, value]) => !HIDDEN.has(key) && String(value ?? '').trim())
  .map(([key, value]) => [key, String(Array.isArray(value) ? value.join(', ') : value).trim()]);
 const rank = key => (ORDER.indexOf(key) + 1 || ORDER.length + 1);
 return entries.sort((a, b) => rank(a[0]) - rank(b[0]));
}

const lines = list => list.map(([key, value]) =>
 `${esc(label(key))}: ${key === '_subject' ? `"${esc(value)}"` : esc(value).replace(/\n/g, '<br>')}`
).join('<br>');

function shell(inner) {
 return `<!doctype html><html><body style="margin:0;padding:0;background:#ffffff">
 <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff">
  <tr><td align="center" style="padding:24px 12px">
   <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%">
    <tr><td align="center" style="padding:16px 0 24px">
     <img src="${LOGO}" width="236" height="174" alt="Jack Klemm — Klemm Real Estate" style="display:block;border:0;outline:none;text-decoration:none;width:236px;max-width:100%;height:auto">
    </td></tr>
    <tr><td style="border-top:1px solid #cccccc;font-size:0;line-height:0">&nbsp;</td></tr>
    <tr><td style="padding:24px 8px;font:400 14px/1.55 Arial,Helvetica,sans-serif;color:#000000">${inner}</td></tr>
    <tr><td style="border-top:1px solid #cccccc;font-size:0;line-height:0">&nbsp;</td></tr>
    <tr><td align="center" style="padding:20px 8px 8px;font:400 14px/1.6 Arial,Helvetica,sans-serif;color:#000000">
     <strong>Email</strong> jack@klemmre.com &nbsp;|&nbsp; <strong>Phone</strong> 209.321.1094
    </td></tr>
    <tr><td align="center" style="padding:0 8px 6px;font:400 12px/1.6 Arial,Helvetica,sans-serif;color:#000000">
     This e-mail was sent from a contact form on Jack Klemm's - Klemm Real Estate.
    </td></tr>
    <tr><td align="center" style="padding:0 8px 16px;font:700 12px/1.6 Arial,Helvetica,sans-serif">
     <a href="${SITE}" style="color:#1155cc">${esc(SITE)}</a>
    </td></tr>
   </table>
  </td></tr>
 </table></body></html>`;
}

const receipt = list => shell(
 `Here is a copy of your inquiry below:<br>
  ${lines(list)}<br><br>
  I appreciate your email! Jack`
);

const notice = (list, page) => shell(
 `New inquiry${page ? ` from the ${esc(page)} page` : ''}:<br><br>${lines(list)}`
);

async function send(key, payload) {
 const response = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
  body: JSON.stringify(payload),
 });
 if (!response.ok) throw new Error(`Resend ${response.status}: ${await response.text()}`);
}

function allowFormOrigin(req, res) {
 const origin = String(req.headers?.origin || '').replace(/\/$/, '');
 if (!FORM_ORIGINS.has(origin)) return false;
 res.setHeader('Access-Control-Allow-Origin', origin);
 res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
 res.setHeader('Vary', 'Origin');
 return true;
}

export default async function handler(req, res) {
 allowFormOrigin(req, res);
 if (req.method === 'OPTIONS') return res.status(204).end();
 if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });

 const body = typeof req.body === 'string' ? Object.fromEntries(new URLSearchParams(req.body)) : req.body || {};
 if (String(body._gotcha ?? '').trim()) return res.status(200).json({ ok: true });

 const email = String(body.email ?? '').trim();
 if (!validEmail(email)) return res.status(422).json({ error: 'A valid email address is required.' });

 const key = process.env.RESEND_API_KEY;
 if (!key) return res.status(503).json({ error: 'Mail is not configured. Set RESEND_API_KEY to enable it.' });

 const list = fields(body);
 const page = String(body.page ?? body.Page ?? '').trim();
 const name = String(body.name ?? '').trim();

 try {
  await send(key, {
   from: FROM,
   to: [TO],
   reply_to: email,
   subject: `New inquiry from ${name || email}${page ? ` — ${page}` : ''}`,
   html: notice(list, page),
  });
  await send(key, {
   from: FROM,
   to: [email],
   reply_to: TO,
   subject: 'Thank you for contacting Jack Klemm!',
   html: receipt(list),
  });
 } catch (error) {
  console.error('contact form:', error);
  return res.status(502).json({ error: 'The message could not be sent. Please call or email Jack directly.' });
 }

 return res.status(200).json({ ok: true });
}
