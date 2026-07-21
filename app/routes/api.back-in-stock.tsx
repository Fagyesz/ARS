import type {Route} from './+types/api.back-in-stock';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HANDLE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const rateLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (rateLog.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_LIMIT) return true;
  hits.push(now);
  rateLog.set(ip, hits);
  return false;
}

export async function action({request, context}: Route.ActionArgs) {
  const formData = await request.formData();
  const email = String(formData.get('email') ?? '').trim();
  const handle = String(formData.get('handle') ?? '').trim();
  const variantTitle = String(formData.get('variantTitle') ?? '').trim();

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return Response.json({success: false, error: 'Érvénytelen e-mail cím'}, {status: 400});
  }
  if (!HANDLE_RE.test(handle) || handle.length > 255) {
    return Response.json({success: false, error: 'Érvénytelen termék'}, {status: 400});
  }

  const ip =
    request.headers.get('oxygen-buyer-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown';
  if (isRateLimited(ip)) {
    return Response.json(
      {success: false, error: 'Túl sok kérés, próbáld később'},
      {status: 429},
    );
  }

  const {product} = await context.storefront.query(BACK_IN_STOCK_PRODUCT_QUERY, {
    variables: {handle},
  });
  if (!product) {
    return Response.json({success: false, error: 'Érvénytelen termék'}, {status: 400});
  }

  const matchedVariant = product.variants.nodes.find(
    (v: {title: string}) => v.title === variantTitle,
  );
  const productTitle = product.title;
  const variantLabel = matchedVariant ? matchedVariant.title : '';
  const productUrl = `${new URL(request.url).origin}/products/${product.handle}`;

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
        subject: `[Értesítési kérés] ${productTitle}${variantLabel ? ` – ${variantLabel}` : ''}`,
        text: `Visszatérési értesítési kérés\n\nTermék: ${productTitle}\nVariáns: ${variantLabel || '-'}\nEmail: ${email}\nURL: ${productUrl}`,
      }),
      sendEmail({
        from: fromEmail,
        to: [email],
        subject: `Értesítést kértél – ${productTitle}`,
        text: `Szia!\n\nAmint a(z) "${productTitle}"${variantLabel ? ` (${variantLabel})` : ''} ismét elérhető lesz, értesítünk!\n\nTermék: ${productUrl}\n\nÜdvözlet,\nArs Mosoris`,
      }),
    ]);
    return Response.json({success: true});
  } catch (err) {
    console.error('[back-in-stock] Exception:', err);
    return Response.json({success: false, error: 'Hiba történt'}, {status: 500});
  }
}

const BACK_IN_STOCK_PRODUCT_QUERY = `#graphql
  query BackInStockProduct($handle: String!, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      title
      handle
      variants(first: 100) {
        nodes {
          title
        }
      }
    }
  }
` as const;
