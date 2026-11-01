import {Form, Link, useActionData, useNavigation} from 'react-router';
import type {Route} from './+types/elallas';
import {seoMeta} from '~/lib/seo';
import {
  formatReceivedAt,
  isOrderEmail,
  orderName,
  ownerNotice,
  parseWithdrawal,
  receiptFailedNotice,
  withdrawalError,
  withdrawalReceipt,
} from '~/lib/withdrawal';
import {adminCreds, findOrderEmail} from '~/lib/admin.server';

export const meta: Route.MetaFunction = ({location}) =>
  seoMeta({
    title: 'Elállás a szerződéstől',
    description:
      'Online elállási nyilatkozat az Ars Mosoris webshopban: a 14 napos elállási jogodat itt is gyakorolhatod.',
    path: location.pathname,
  });

const SEND_ERROR =
  'A nyilatkozat elküldése sikertelen volt. Próbáld újra, vagy írd meg nekünk e-mailben.';

export async function action({request, context}: Route.ActionArgs) {
  const formData = await request.formData();
  const input = parseWithdrawal(formData);

  // a bot fills the hidden field; never send it a receipt to a stranger's address
  if (formData.get('website')) return {success: false as const, error: SEND_ERROR};

  const error = withdrawalError(input);
  if (error) return {success: false as const, error};

  const {RESEND_API_KEY: apiKey, FROM_EMAIL: from, CONTACT_EMAIL: owner} = context.env;
  if (!apiKey) return {success: false as const, error: SEND_ERROR};

  const receivedAt = formatReceivedAt(new Date());
  const receipt = withdrawalReceipt(input, receivedAt);
  const send = (payload: object) =>
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({from, ...payload}),
    }).then((response) => response.ok);

  // only informs the owners: a failed lookup or a mismatch never stops the receipt
  const creds = adminCreds(context.env);
  const name = orderName(input.orderNumber);
  const orderEmail = creds && name
    ? await findOrderEmail(creds, name).catch((lookupError) => {
        console.error('[elallas] order lookup failed:', lookupError);
        return null;
      })
    : null;
  const verified = isOrderEmail(orderEmail, input.email);

  try {
    // the owners first: a withdrawal they never hear about is the worse failure
    const delivered = await send({
      to: [owner],
      replyTo: input.email,
      subject: `[Elállás] ${input.orderNumber} – ${input.name}`,
      text: ownerNotice(receipt, verified),
    });
    if (!delivered) return {success: false as const, error: SEND_ERROR};

    // 22. § (1a) d): the customer names where the receipt goes, matching the order or not
    const receiptSent = await send({
      to: [input.email],
      subject: 'Elállási nyilatkozatodat megkaptuk – Ars Mosoris',
      text: receipt,
    }).catch(() => false);
    if (!receiptSent) {
      await send({
        to: [owner],
        replyTo: input.email,
        subject: `[Elállás – nincs visszaigazolás] ${input.orderNumber} – ${input.name}`,
        text: receiptFailedNotice(receipt),
      }).catch(() => false);
    }
    return {success: true as const, receipt, receiptSent};
  } catch {
    return {success: false as const, error: SEND_ERROR};
  }
}

export default function Withdrawal() {
  const actionData = useActionData<typeof action>();
  const isSubmitting = useNavigation().state === 'submitting';

  return (
    <div className="policy-page">
      <div className="container">
        <div className="policy-header">
          <p className="policy-tag">Jogi feltételek</p>
          <h1>Elállás a szerződéstől</h1>
          <p className="policy-meta">
            A termék átvételétől számított 14 napon belül, indoklás nélkül elállhatsz a vásárlástól.
          </p>
        </div>

        <div className="policy-body">
          {actionData?.success ? (
            <div role="status">
              <h2>Megkaptuk a nyilatkozatodat</h2>
              <p>
                {actionData.receiptSent
                  ? 'A visszaigazolást elküldtük a megadott e-mail címre.'
                  : 'A visszaigazoló e-mailt nem sikerült elküldeni, ezért mentsd el az alábbi szöveget. Hamarosan e-mailben is megkapod.'}
              </p>
              <p style={{whiteSpace: 'pre-line'}}>{actionData.receipt}</p>
            </div>
          ) : (
            <Form method="post" className="contact-form">
              {actionData?.error && <div className="form-error">{actionData.error}</div>}

              <div className="form-group">
                <label htmlFor="name">Neved *</label>
                <input type="text" id="name" name="name" autoComplete="name" required />
              </div>
              <div className="form-group">
                <label htmlFor="email">E-mail cím a visszaigazoláshoz *</label>
                <input type="email" id="email" name="email" autoComplete="email" required />
              </div>
              <div className="form-group">
                <label htmlFor="orderNumber">Rendelés száma *</label>
                <input type="text" id="orderNumber" name="orderNumber" required />
              </div>
              <div className="form-group">
                <label htmlFor="items">Érintett termékek (ha nem a teljes rendelés)</label>
                <textarea id="items" name="items" rows={3} />
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

              <p>
                A gomb megnyomásával kijelentem, hogy elállok a fenti szerződéstől. Az adatok
                kezeléséről az <Link to="/policies/privacy-policy">adatvédelmi tájékoztatóban</Link>{' '}
                olvashatsz.
              </p>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Küldés...' : 'Elállás megerősítése'}
              </button>
            </Form>
          )}

          <p>
            A részletes szabályokat és a nyilatkozatmintát a{' '}
            <Link to="/policies/refund-policy">Visszaküldési feltételek</Link> oldalon találod.
          </p>
        </div>
      </div>
    </div>
  );
}
