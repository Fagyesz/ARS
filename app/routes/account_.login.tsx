import {redirect, useLoaderData} from 'react-router';
import type {Route} from './+types/account_.login';
import {BackgroundCanvas} from '~/components/BackgroundCanvas';
import {seoMeta} from '~/lib/seo';

export const meta: Route.MetaFunction = ({location}) =>
  seoMeta({
    title: 'Bejelentkezés',
    description: 'Lépj be az Ars Mosoris fiókodba: rendelések, címek, gyorsabb fizetés.',
    path: location.pathname,
    noindex: true,
  });

/** Only same-site paths may be a return target (no `//host` or absolute URLs). */
function safeReturnTo(value: string | null) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/account';
}

export async function loader({request, context}: Route.LoaderArgs) {
  const url = new URL(request.url);
  const returnTo = safeReturnTo(url.searchParams.get('return_to'));

  // ?trigger=1 hands over to Shopify's login. With an e-mail (login_hint) and
  // login_hint_mode=submit, Shopify skips its own e-mail step and goes straight
  // to "enter the 6-digit code".
  if (url.searchParams.get('trigger') === '1') {
    const loginHint = url.searchParams.get('login_hint')?.trim() || undefined;
    const loginHintMode = url.searchParams.get('login_hint_mode') || undefined;

    return context.customerAccount.login({
      countryCode: context.storefront.i18n.country,
      locale: 'hu',
      loginHint,
      loginHintMode,
    });
  }

  if (await context.customerAccount.isLoggedIn()) {
    return redirect(returnTo);
  }

  return {returnTo};
}

const PERKS = [
  'Rendeléseid és csomagjaid egy helyen',
  'Elmentett címek, gyorsabb fizetés',
  'Értesítés, ha visszajön a méreted',
];

export default function LoginPage() {
  const {returnTo} = useLoaderData<typeof loader>();
  const otherWays = `/account/login?trigger=1&return_to=${encodeURIComponent(returnTo)}`;

  return (
    <div className="login-page">
      <div className="login-shell">
        <div className="login-brand-panel">
          <BackgroundCanvas scene="ink" />
          <div className="login-brand-inner">
            <span className="login-eyebrow">Ars Mosoris</span>
            <p className="login-hello">Jó, hogy újra itt vagy.</p>
            <ul className="login-perks">
              {PERKS.map((perk) => (
                <li key={perk}>{perk}</li>
              ))}
            </ul>
          </div>
        </div>

        <section className="login-card" aria-labelledby="login-title">
          <h1 id="login-title" className="login-heading">
            Bejelentkezés
          </h1>
          <p className="login-sub">
            Jelszó nem kell: e-mailben küldünk egy 6 jegyű kódot.
          </p>

          <form method="get" action="/account/login" className="login-form">
            <input type="hidden" name="trigger" value="1" />
            <input type="hidden" name="login_hint_mode" value="submit" />
            <input type="hidden" name="return_to" value={returnTo} />
            <label htmlFor="login-email" className="login-label">
              E-mail-cím
            </label>
            <input
              id="login-email"
              name="login_hint"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="nev@pelda.hu"
              required
              className="login-input"
            />
            <button type="submit" className="btn btn-primary login-btn">
              Kódot kérek
            </button>
          </form>

          <p className="login-note">
            Még nincs fiókod? Ugyanígy működik: az első belépéskor létrehozzuk.
          </p>
          <a href={otherWays} className="login-alt">
            Belépés más módon (Shop)
          </a>
        </section>
      </div>
    </div>
  );
}
