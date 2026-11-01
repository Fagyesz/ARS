import {Form, Link, useActionData, useNavigation, useRouteLoaderData} from 'react-router';
import type {Route} from './+types/egyedi-rendeles';
import {customOrderEmail, customOrderError, parseCustomOrder} from '~/lib/custom-order';
import {FALLBACK_SETTINGS} from '~/lib/content';
import {seoMeta} from '~/lib/seo';
import type {RootLoader} from '~/root';

export const meta: Route.MetaFunction = ({location}) =>
  seoMeta({
    title: 'Egyedi rendelés',
    description:
      'Adj új életet megunt ruháidnak! Az Ars Mosoris alkotói egyedi grafikával gondolják újra a kedvenc darabjaidat.',
    path: location.pathname,
  });

const SEND_ERROR = 'Az üzenet küldése sikertelen volt. Próbáld újra, vagy írj nekünk e-mailt.';

export async function action({request, context}: Route.ActionArgs) {
  const formData = await request.formData();
  const input = parseCustomOrder(formData);

  // a bot fills the hidden field; it gets the same answer as a failed send
  if (formData.get('website')) return {success: false as const, error: SEND_ERROR};

  const error = customOrderError(input);
  if (error) return {success: false as const, error};

  const {RESEND_API_KEY: apiKey, FROM_EMAIL: from, CONTACT_EMAIL: owner} = context.env;
  if (!apiKey) return {success: false as const, error: SEND_ERROR};

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({from, to: [owner], replyTo: input.email, ...customOrderEmail(input)}),
    });
    if (!response.ok) return {success: false as const, error: SEND_ERROR};
    return {success: true as const};
  } catch {
    return {success: false as const, error: SEND_ERROR};
  }
}

export default function CustomOrder() {
  const actionData = useActionData<typeof action>();
  const isSubmitting = useNavigation().state === 'submitting';
  const {contactEmail} =
    useRouteLoaderData<RootLoader>('root')?.content?.settings ?? FALLBACK_SETTINGS;

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <div className="container">
          <span className="contact-hero-eyebrow">Egyedi rendelés</span>
          <h1 className="contact-hero-title">Adj új életet megunt ruháidnak!</h1>
          <p className="contact-hero-lead">
            Régi ruhák, egyedi grafikák, különleges stílus: újragondoljuk és újjávarázsoljuk
            kedvenc darabjaidat, hogy ismét örömmel viselhesd őket.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info">
              <h2>Így működik</h2>
              <ol>
                <li>Írd meg, melyik ruhádról van szó, és milyen grafikát képzeltél el rá.</li>
                <li>E-mailben válaszolunk, és elkérjük a ruhadarab fotóit.</li>
                <li>
                  Írásos ajánlatot küldünk a munkáról, az árról, a határidőről és a ruha
                  eljuttatásáról.
                </li>
                <li>Csak az ajánlat elfogadása után kezdünk neki a munkának.</li>
              </ol>

              <h3>E-mailben is elérsz minket</h3>
              <p>
                <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
              </p>

              <p className="text-muted">
                Ha saját képet vagy mintát küldesz, csak olyat válassz, amelynek a felhasználására
                jogosult vagy. Az üzenet elküldése még nem jelent megrendelést. A részleteket az{' '}
                <Link to="/policies/terms-of-service">ÁSZF</Link> tartalmazza.
              </p>
            </div>

            <div className="contact-form-wrapper">
              {actionData?.success ? (
                <div className="contact-success" role="status">
                  <h2>Köszönjük!</h2>
                  <p>Megkaptuk az üzeneted, és hamarosan e-mailben válaszolunk.</p>
                </div>
              ) : (
                <Form method="post" className="contact-form">
                  <h2>Mesélj az ötletedről</h2>

                  {actionData?.error && <div className="form-error">{actionData.error}</div>}

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name">Neved *</label>
                      <input type="text" id="name" name="name" autoComplete="name" required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="email">E-mail címed *</label>
                      <input type="email" id="email" name="email" autoComplete="email" required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="garment">Melyik ruhadarabod? *</label>
                    <input
                      type="text"
                      id="garment"
                      name="garment"
                      required
                      placeholder="Például farmerdzseki, M-es méret"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="idea">Mit képzeltél el? *</label>
                    <textarea
                      id="idea"
                      name="idea"
                      rows={6}
                      required
                      placeholder="Milyen grafikát, hová, milyen stílusban?"
                    />
                  </div>
                  {/* honeypot: hidden from people and assistive technology */}
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    style={{display: 'none'}}
                  />

                  <p className="text-muted">
                    Az adataidat a megkeresés megválaszolásához kezeljük, lásd az{' '}
                    <Link to="/policies/privacy-policy">adatvédelmi tájékoztatót</Link>.
                  </p>
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
    </div>
  );
}
