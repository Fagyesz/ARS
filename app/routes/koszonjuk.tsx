import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/koszonjuk';
import {SHIPPING, SOCIAL_LINKS} from '~/lib/config';
import {seoMeta} from '~/lib/seo';

export const meta: Route.MetaFunction = ({location}) =>
  seoMeta({
    title: 'Köszönjük a rendelésed!',
    description: 'Megkaptuk a rendelésed. Hamarosan e-mailben visszaigazoljuk.',
    path: location.pathname,
    noindex: true,
  });

/**
 * Landing page after the kosR checkout (set it as the "sikeres rendelés"
 * return URL in the kosR app). The order lived in the Online Store cart, so the
 * Hydrogen cart still holds the bought items: empty it here.
 */
export async function loader({context}: Route.LoaderArgs) {
  const cart = await context.cart.get();
  const lineIds = cart?.lines?.nodes?.map((line) => line.id) ?? [];
  let cleared = 0;
  if (lineIds.length) {
    const result = await context.cart.removeLines(lineIds);
    cleared = result.errors?.length ? 0 : lineIds.length;
  }
  context.session.unset('checkoutStartedAt');
  return {cleared};
}

export default function ThankYou() {
  const {cleared} = useLoaderData<typeof loader>();
  return (
    <section className="thank-you">
      <div className="container thank-you-inner">
        <span className="thank-you-eyebrow">Rendelés leadva</span>
        <h1>Köszönjük, hogy tőlünk vásároltál!</h1>
        <p className="thank-you-lead">
          A rendelésed megérkezett hozzánk. A visszaigazolást és a számlát
          e-mailben küldjük, a csomagot pedig {SHIPPING.handlingDays}on belül
          adjuk fel {SHIPPING.carrier} futárral. A feladásról követési számot
          kapsz.
        </p>
        <ol className="thank-you-steps">
          <li>
            <strong>Visszaigazolás</strong>
            <span>Perceken belül e-mailben, a rendelés részleteivel.</span>
          </li>
          <li>
            <strong>Csomagolás</strong>
            <span>Kézzel csomagolunk, {SHIPPING.handlingDays} alatt.</span>
          </li>
          <li>
            <strong>Kézbesítés</strong>
            <span>
              {SHIPPING.transitDays} a feladástól, csomagpontra vagy házhoz.
            </span>
          </li>
        </ol>
        {cleared > 0 && (
          <p className="thank-you-note">A kosaradat kiürítettük, hogy ne rendeld meg kétszer.</p>
        )}
        <div className="thank-you-actions">
          <Link to="/collections/all" className="btn btn-primary">
            Vissza a bolthoz
          </Link>
          <a
            href={SOCIAL_LINKS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
          >
            Kövess Instagramon
          </a>
        </div>
        <p className="thank-you-help">
          Kérdésed van a rendeléssel kapcsolatban?{' '}
          <Link to="/contact">Írj nekünk</Link>, a rendelésszámmal együtt.
        </p>
      </div>
    </section>
  );
}
