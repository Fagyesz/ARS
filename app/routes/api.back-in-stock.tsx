import type {Route} from './+types/api.back-in-stock';

export async function action({request, context}: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const productTitle = formData.get('productTitle') as string;
  const variantTitle = formData.get('variantTitle') as string;
  const productUrl = formData.get('productUrl') as string;

  if (!email) {
    return Response.json({success: false, error: 'Email required'}, {status: 400});
  }

  const apiKey = context.env.RESEND_API_KEY;
  const fromEmail = context.env.FROM_EMAIL;
  const contactEmail = context.env.CONTACT_EMAIL;

  if (!apiKey || !fromEmail) {
    // Email not configured — silently succeed so UX is not broken
    return Response.json({success: true});
  }

  const sendEmail = async (payload: object) => {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`[back-in-stock] Resend ${res.status}: ${await res.text()}`);
    }
  };

  try {
    await Promise.all([
      sendEmail({
        from: fromEmail,
        to: [contactEmail],
        subject: `[Értesítési kérés] ${productTitle} – ${variantTitle}`,
        text: `Visszatérési értesítési kérés\n\nTermék: ${productTitle}\nVariáns: ${variantTitle}\nEmail: ${email}\nURL: ${productUrl}`,
      }),
      sendEmail({
        from: fromEmail,
        to: [email],
        subject: `Értesítést kértél – ${productTitle}`,
        text: `Szia!\n\nAmint a(z) "${productTitle}" (${variantTitle}) ismét elérhető lesz, értesítünk!\n\nTermék: ${productUrl}\n\nÜdvözlet,\nArs Mosoris`,
      }),
    ]);
    return Response.json({success: true});
  } catch (err) {
    console.error('[back-in-stock] Exception:', err);
    return Response.json({success: false, error: 'Hiba történt'}, {status: 500});
  }
}
