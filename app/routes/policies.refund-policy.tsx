import {Link, useRouteLoaderData} from 'react-router';
import type {Route} from './+types/policies.refund-policy';
import {FALLBACK_SETTINGS} from '~/lib/content';
import {seoMeta} from '~/lib/seo';
import type {RootLoader} from '~/root';

export const meta: Route.MetaFunction = ({location}) =>
  seoMeta({
    title: 'Visszaküldési feltételek',
    description:
      '14 napos elállási jog, a visszaküldés menete és a visszatérítés az Ars Mosoris webshopban.',
    path: location.pathname,
  });

export default function RefundPolicy() {
  // the contact details come from the shop_settings metaobject, like the other policy pages
  const {contactEmail, company} =
    useRouteLoaderData<RootLoader>('root')?.content?.settings ?? FALLBACK_SETTINGS;
  return (
    <div className="policy-page">
      <div className="container">
        <div className="policy-breadcrumb">
          <Link to="/">← Vissza a főoldalra</Link>
        </div>

        <div className="policy-header">
          <p className="policy-tag">Jogi feltételek</p>
          <h1>Visszaküldési feltételek</h1>
          <p className="policy-meta">Utolsó módosítás: 2026. november 1.</p>
        </div>

        <div className="policy-body">
          <h2>Elállási jog</h2>
          <p>
            A 45/2014. (II. 26.) Korm. rendelet alapján a termék átvételétől számított{' '}
            <strong>14 napon belül indoklás nélkül elállhatsz</strong> a vásárlástól. Ez a kész,
            készletről rendelt darabokra is vonatkozik, a kézzel készült és egyedi darabokat is
            beleértve. A határidő betartásához elég, ha a nyilatkozatot a 14. nap végéig elküldöd.
          </p>
          <p>
            <strong>Nem állhatsz el</strong> attól a nem előre gyártott terméktől, amelyet az
            utasításod alapján vagy kifejezett kérésedre készítettünk. A saját ruhadarabra kért
            munkára az <Link to="/policies/terms-of-service">ÁSZF</Link> 13. pontja vonatkozik.
          </p>

          <h2>Így állhatsz el</h2>
          <ul>
            <li>
              az <Link to="/elallas">Elállás a szerződéstől</Link> oldalon,
            </li>
            <li>
              e-mailben a <a href={`mailto:${contactEmail}`}>{contactEmail}</a> címen, vagy
              bármilyen más egyértelmű nyilatkozattal,
            </li>
            <li>az alábbi nyilatkozatminta kitöltésével.</li>
          </ul>

          <h2>A termék visszaküldése</h2>
          <p>
            A terméket az elállás közlésétől számított <strong>14 napon belül</strong> kell
            visszaküldened{company.address ? ` a következő címre: ${company.address}` : ''}. A
            határidő betartásához elég, ha a csomagot a 14. nap végéig feladod. A visszaküldés
            közvetlen költségét <strong>te viseled</strong>, kivéve, ha a termék hibás, vagy nem azt
            kaptad, amit rendeltél.
          </p>
          <p>
            A termék kipróbálható, mint egy üzletben. Csak az olyan értékcsökkenésért felelsz, amely
            a termék jellegének, tulajdonságainak és működésének megállapításához szükséges
            használatot meghaladó használatból ered.
          </p>

          <h2>Visszatérítés</h2>
          <p>
            A kifizetett összeget, a szokásos szállítási díjat is beleértve, haladéktalanul, de
            legkésőbb az elállásról való tudomásszerzésünktől számított{' '}
            <strong>14 napon belül</strong> visszatérítjük, az eredeti fizetési móddal megegyező
            módon. A visszatérítést addig visszatarthatjuk, amíg a termék vissza nem érkezik, vagy
            nem igazolod, hogy feladtad.
          </p>

          <h2>Hibás termék</h2>
          <p>
            Ha hibás vagy sérült terméket kaptál, kérjük, fotókkal együtt jelezd nekünk a{' '}
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a> e-mail-címen. A szavatossági
            jogaidat az <Link to="/policies/terms-of-service">ÁSZF</Link> 8. pontja ismerteti, a
            hibás termék visszaküldésének költségét mi álljuk.
          </p>

          <h2>Csere</h2>
          <p>
            Ha más méretet vagy terméket szeretnél, a legegyszerűbb megoldás az elállás és egy új
            rendelés leadása. Cserére vonatkozó egyedi igényeket esetileg mérlegelünk, kérjük, vedd
            fel velünk a kapcsolatot.
          </p>

          <h2>Elállási nyilatkozatminta</h2>
          <p>
            Címzett: {[company.name || 'Ars Mosoris', company.address, company.email || contactEmail]
              .filter(Boolean)
              .join(', ')}
          </p>
          <p>
            Alulírott kijelentem, hogy gyakorlom elállási jogomat az alábbi termék(ek) adásvételére
            vagy az alábbi szolgáltatás nyújtására irányuló szerződés tekintetében:
          </p>
          <p>
            ............................................
            <br />
            Szerződéskötés időpontja / átvétel időpontja: ....................
            <br />
            A fogyasztó neve: ....................
            <br />
            A fogyasztó címe: ....................
            <br />
            A fogyasztó aláírása (kizárólag papíron tett nyilatkozat esetén): ....................
            <br />
            Kelt: ....................
          </p>
        </div>

        <div className="policy-contact-box">
          <h3>Kérdésed van a visszaküldéssel kapcsolatban?</h3>
          <p>Írj nekünk, segítünk eligazodni!</p>
          <p>
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
