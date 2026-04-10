import {useState} from 'react';
import {Form, useActionData, useNavigation, useLoaderData} from 'react-router';
import type {Route} from './+types/contact';
import {EMAIL, SOCIAL_LINKS} from '~/lib/config';

export async function loader({context}: Route.LoaderArgs) {
  const {env} = context;
  return {
    contactEmail: env.CONTACT_EMAIL,
    instagramUrl: env.INSTAGRAM_URL,
    facebookUrl: env.FACEBOOK_URL,
    tiktokUrl: env.TIKTOK_URL,
  };
}

const SUBJECT_LABELS: Record<string, string> = {
  general: 'Általános kérdés',
  order: 'Rendelés',
  collaboration: 'Együttműködés',
  press: 'Sajtó',
  other: 'Egyéb',
};

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Kapcsolat | Ars Mosoris'},
    {
      name: 'description',
      content: 'Lépj velünk kapcsolatba! Kérdésed van termékeinkről vagy együttműködési lehetőségekről?',
    },
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: 'Kapcsolat | Ars Mosoris'},
    {property: 'og:description', content: 'Lépj kapcsolatba az Ars Mosoris csapatával.'},
    {property: 'og:image', content: '/og-default.png'},
    {name: 'twitter:card', content: 'summary_large_image'},
  ];
};

export async function action({request, context}: Route.ActionArgs) {
  const formData = await request.formData();
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const subject = formData.get('subject') as string;
  const message = formData.get('message') as string;

  const apiKey = context.env.RESEND_API_KEY;
  const fromEmail = context.env.FROM_EMAIL;
  const contactEmail = context.env.CONTACT_EMAIL;

  if (!apiKey) {
    return {success: false, error: 'Email service not configured.'};
  }

  try {
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [contactEmail],
        replyTo: email,
        subject: `[Kontaktlap] ${SUBJECT_LABELS[subject] || subject} – ${name}`,
        text: `Új üzenet a kontaktlapról\n\nNév: ${name}\nE-mail: ${email}\nTárgy: ${SUBJECT_LABELS[subject] || subject}\n\n${message}`,
      }),
    });

    if (!emailResponse.ok) {
      return {success: false, error: 'Az üzenet küldése sikertelen volt. Próbáld újra.'};
    }

    // Fire Discord notification if webhook is configured (non-blocking)
    const discordWebhookUrl = context.env.DISCORD_WEBHOOK_URL;
    if (discordWebhookUrl) {
      fetch(discordWebhookUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          embeds: [
            {
              title: `📬 Új üzenet: ${SUBJECT_LABELS[subject] || subject}`,
              color: 0x6e56cf,
              fields: [
                {name: 'Név', value: name, inline: true},
                {name: 'E-mail', value: email, inline: true},
                {name: 'Üzenet', value: message, inline: false},
              ],
              footer: {text: 'Ars Mosoris – Kontaktlap'},
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      }).catch(() => {/* ignore Discord errors */});
    }

    return {success: true};
  } catch {
    return {success: false, error: 'Az üzenet küldése sikertelen volt. Próbáld újra.'};
  }
}

export default function Contact() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const [submitted, setSubmitted] = useState(false);

  if (actionData?.success && !submitted) {
    setSubmitted(true);
  }

  const contactEmail = loaderData?.contactEmail || EMAIL;
  const socialLinks = {
    instagram: loaderData?.instagramUrl || SOCIAL_LINKS.instagram,
    facebook: loaderData?.facebookUrl || SOCIAL_LINKS.facebook,
    tiktok: loaderData?.tiktokUrl || SOCIAL_LINKS.tiktok,
  };

  return (
    <div className="contact-page">
      {/* Hero section */}
      <section className="contact-hero">
        <div className="container">
          <span className="contact-hero-eyebrow">Ars Mosoris</span>
          <h1 className="contact-hero-title">Kapcsolat</h1>
          <p className="contact-hero-lead">Szívesen hallanánk rólad</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="contact-grid">
            {/* Contact info */}
            <div className="contact-info">
              <h2>Elérhetőségeink</h2>
              <p className="text-muted mb-8">
                Kérdésed van rendeléseiddel, termékeinkkel vagy együttműködési
                lehetőségekkel kapcsolatban? Írj nekünk!
              </p>

              <div className="contact-info-items">
                <div className="contact-info-item">
                  <div className="contact-info-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <div className="contact-info-content">
                    <h3>E-mail</h3>
                    <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
                  </div>
                </div>


<div className="contact-info-item">
                  <div className="contact-info-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  </div>
                  <div className="contact-info-content">
                    <h3>Instagram</h3>
                    <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                      @ars.mosoris
                    </a>
                  </div>
                </div>
              </div>

              {/* Social links */}
              <div className="contact-socials">
                <h3>Kövess minket</h3>
                <div className="contact-social-links">
                  <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  </a>
                  <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  </a>
                  <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Contact form */}
            <div className="contact-form-wrapper" id="contact-form">
              {submitted ? (
                <div className="contact-success">
                  <div className="contact-success-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <h2>Köszönjük!</h2>
                  <p>
                    Üzeneted megkaptuk. Hamarosan jelentkezünk!
                  </p>
                </div>
              ) : (
                <Form method="post" className="contact-form">
                  <h2>Írj nekünk</h2>

                  {actionData && !actionData.success && (
                    <div className="form-error">{actionData.error}</div>
                  )}

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name">Neved *</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        placeholder="Kovács Anna"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="email">E-mail címed *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        placeholder="anna@example.com"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="subject">Tárgy</label>
                    <select id="subject" name="subject">
                      <option value="general">Általános kérdés</option>
                      <option value="order">Rendelés</option>
                      <option value="collaboration">Együttműködés</option>
                      <option value="press">Sajtó</option>
                      <option value="other">Egyéb</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">Üzeneted *</label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      placeholder="Írd le kérdésedet..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary contact-submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Küldés...' : 'Üzenet küldése'}
                  </button>
                </Form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ section */}
      <section className="contact-faq-section">
        <div className="container">
          <div className="text-center mb-8">
            <h2>Gyakori kérdések</h2>
          </div>
          <div className="faq-grid">
            <div className="faq-item">
              <h3>Mennyi idő a szállítás?</h3>
              <p>Magyarországon belül általában 2-5 munkanapon belül megérkezik a rendelésed.</p>
            </div>
            <div className="faq-item">
              <h3>Van lehetőség visszaküldésre?</h3>
              <p>Igen, a kézhezvételtől számított 14 napon belül visszaküldheted a terméket.</p>
            </div>
            <div className="faq-item">
              <h3>Hogyan ápoljam a ruháimat?</h3>
              <p>30°C-on mosógépben mosható, kifordítva. Ne használj fehérítőt, és lehetőleg ne szárítógépezd.</p>
            </div>
            <div className="faq-item">
              <h3>Lehet egyedi rendelést leadni?</h3>
              <p>Egyedi megrendelésekről és együttműködésekről szívesen egyeztetünk. Írj nekünk!</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
