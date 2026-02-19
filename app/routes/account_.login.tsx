import {useLoaderData} from 'react-router';
import type {Route} from './+types/account_.login';

export async function loader({request, context}: Route.LoaderArgs) {
  const url = new URL(request.url);

  // If ?trigger=1 is present, redirect to Shopify's OAuth login
  if (url.searchParams.get('trigger') === '1') {
    const loginHint = url.searchParams.get('login_hint') || undefined;
    const loginHintMode =
      url.searchParams.get('login_hint_mode') || undefined;

    return context.customerAccount.login({
      countryCode: context.storefront.i18n.country,
      locale: 'hu',
      loginHint,
      loginHintMode,
    });
  }

  // Forward return_to into the trigger URL so Hydrogen's login() picks it up
  const returnTo = url.searchParams.get('return_to') ?? '/account';
  return {returnTo};
}

export default function LoginPage() {
  const {returnTo} = useLoaderData<typeof loader>();
  const triggerUrl = `/account/login?trigger=1&return_to=${encodeURIComponent(returnTo)}`;

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-brand">Ars Mosoris</h1>
        <h2 className="login-heading">Bejelentkezés</h2>
        <p className="login-sub">Lépj be a fiókodba</p>
        <a href={triggerUrl} className="btn btn-primary login-btn">
          Bejelentkezés
        </a>
        <p className="login-note">
          Nincs fiókod? A bejelentkezés során automatikusan létre jön egy.
        </p>
      </div>
    </div>
  );
}
