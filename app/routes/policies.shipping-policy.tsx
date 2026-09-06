import {Link, useRouteLoaderData} from 'react-router';
import type {Route} from './+types/policies.shipping-policy';
import {FALLBACK_SETTINGS} from '~/lib/content';
import {formatMoney} from '~/lib/money';
import {seoMeta} from '~/lib/seo';
import type {RootLoader} from '~/root';

export const meta: Route.MetaFunction = ({location}) =>
  seoMeta({
    title: 'Szállítási feltételek',
    description:
      'Szállítási módok, határidők és díjak az Ars Mosoris webshopban: csomagpontos kézbesítés Magyarország egész területére, feldolgozási és szállítási idő.',
    path: location.pathname,
  });

/**
 * The carrier, prices and lead times come from the shop_settings metaobject
 * (Content → Metaobjects → Webshop beállítások), so a rate change in Shopify
 * needs no code edit here. A 0 price means the option is not offered.
 */
export default function ShippingPolicy() {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const {shipping, contactEmail} = rootData?.content?.settings ?? FALLBACK_SETTINGS;
  const homeDelivery = shipping.homeDeliveryFt > 0;
  const freeOver = shipping.freeOverFt > 0;

  return (
    <div className="policy-page">
      <div className="container">
        <div className="policy-breadcrumb">
          <Link to="/">← Vissza a főoldalra</Link>
        </div>

        <div className="policy-header">
          <p className="policy-tag">Jogi feltételek</p>
          <h1>Szállítási feltételek</h1>
          <p className="policy-meta">Utolsó módosítás: 2026. szeptember 6.</p>
        </div>

        <div className="policy-body">
          <h2>Szállítási módok</h2>
          <p>
            Az Ars Mosoris webshopban leadott rendeléseket {shipping.carrier}{' '}
            {homeDelivery ? 'csomagpontra vagy házhoz szállítva' : 'csomagpontra'} kézbesítjük
            Magyarország egész területére.{' '}
            {homeDelivery
              ? 'A pénztárban választhatsz a csomagpont és a házhoz szállítás között.'
              : 'A pénztárban választod ki a neked legkényelmesebb csomagpontot.'}{' '}
            Rendelésed feladása után e-mailben küldjük el a csomagkövetési számot, amellyel nyomon
            követheted küldeményed útját.
          </p>

          <h2>Szállítási idő</h2>
          <p>
            A rendelések feldolgozása általában <strong>{shipping.handlingDays}ot</strong> vesz
            igénybe. A csomag a feladástól számítva <strong>{shipping.transitDays}</strong> alatt
            érkezik meg.
          </p>
          <p>
            Kézzel festett vagy egyedi darabok esetén a feldolgozási idő <strong>3–5 munkanap</strong>{' '}
            lehet – erről mindig tájékoztatunk a rendelés visszaigazolásában.
          </p>
          <p>
            Kiemelt időszakokban (pl. ünnepi szezonban) a szállítási idő kissé meghosszabbodhat.
          </p>

          <h2>Szállítási díjak</h2>
          <ul>
            {freeOver && (
              <li>
                <strong>Ingyenes szállítás:</strong> {formatMoney(shipping.freeOverFt)} feletti
                rendeléseknél
              </li>
            )}
            <li>
              <strong>{shipping.carrier} csomagpont:</strong> {formatMoney(shipping.parcelPointFt)}
            </li>
            {homeDelivery && (
              <li>
                <strong>{shipping.carrier} házhoz szállítás:</strong>{' '}
                {formatMoney(shipping.homeDeliveryFt)}
              </li>
            )}
          </ul>

          <h2>Szállítási terület</h2>
          <p>
            Jelenleg csak Magyarország területén szállítunk. Európai szállításra vonatkozó
            igényeket esetileg mérlegelünk – ha érdekel, kérjük, vedd fel velünk a kapcsolatot
            a <a href={`mailto:${contactEmail}`}>{contactEmail}</a> e-mail-címen.
          </p>

          <h2>Csomagolás</h2>
          <p>
            Minden terméket gondosan csomagolunk, hogy sérülés nélkül érjen hozzád. Igyekszünk
            környezetbarát csomagolóanyagokat használni, összhangban értékeinkkel.
          </p>

          <h2>Mit tegyél, ha a csomag sérült vagy hiányos?</h2>
          <p>
            Ha sérült csomagot kapsz, kérjük, átvételkor rögzítsd a sérülést (fotóval), és
            haladéktalanul jelezd felénk a <a href={`mailto:${contactEmail}`}>{contactEmail}</a>{' '}
            címen. Ilyenkor cseredarabot vagy visszatérítést biztosítunk.
          </p>
        </div>

        <div className="policy-contact-box">
          <h3>Kérdésed van a szállítással kapcsolatban?</h3>
          <p>Írj nekünk, szívesen segítünk!</p>
          <p>
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
