import {useState} from 'react';
import {Form, useActionData} from 'react-router';
import type {Route} from './+types/contact';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Kapcsolat | Ars Mosoris'},
    {
      name: 'description',
      content: 'Lépj velünk kapcsolatba! Kérdésed van termékeinkről vagy együttműködési lehetőségekről?',
    },
  ];
};

export async function action({request}: Route.ActionArgs) {
  const formData = await request.formData();
  const name = formData.get('name');
  const email = formData.get('email');
  const subject = formData.get('subject');
  const message = formData.get('message');

  // Here you would typically send the email
  // For now, we'll just return a success message
  // In production, integrate with an email service like SendGrid or Mailgun

  console.log('Contact form submission:', {name, email, subject, message});

  return {success: true};
}

export default function Contact() {
  const actionData = useActionData<typeof action>();
  const [submitted, setSubmitted] = useState(false);

  if (actionData?.success && !submitted) {
    setSubmitted(true);
  }

  return (
    <div className="contact-page">
      {/* Hero section */}
      <section className="contact-hero">
        <div className="container">
          <h1>Kapcsolat</h1>
          <p className="contact-hero-subtitle">
            Szívesen hallanánk rólad
          </p>
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
                    <a href="mailto:arsmosoris@gmail.com">arsmosoris@gmail.com</a>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-info-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div className="contact-info-content">
                    <h3>Helyszín</h3>
                    <p>Budapest, Magyarország</p>
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
                    <a href="https://instagram.com/ars.mosoris" target="_blank" rel="noopener noreferrer">
                      @ars.mosoris
                    </a>
                  </div>
                </div>
              </div>

              {/* Social links */}
              <div className="contact-socials">
                <h3>Kövess minket</h3>
                <div className="contact-social-links">
                  <a href="https://instagram.com/ars.mosoris" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  </a>
                  <a href="https://facebook.com/arsmosoris" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  </a>
                  <a href="https://tiktok.com/@arsmosoris" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Contact form */}
            <div className="contact-form-wrapper">
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
                      rows={5}
                      placeholder="Írd le kérdésedet..."
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">
                    Üzenet küldése
                  </button>
                </Form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ section */}
      <section className="section" style={{backgroundColor: 'var(--color-background-alt)'}}>
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
