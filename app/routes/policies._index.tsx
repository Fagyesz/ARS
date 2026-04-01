import {Link} from 'react-router';
import type {Route} from './+types/policies._index';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Jogi feltételek | Ars Mosoris'},
    {name: 'description', content: 'Ars Mosoris jogi feltételek — adatvédelem, szállítás, visszaküldés és általános feltételek.'},
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: 'Jogi feltételek | Ars Mosoris'},
    {property: 'og:description', content: 'Ars Mosoris jogi feltételek — adatvédelem, szállítás, visszaküldés és általános feltételek.'},
    {property: 'og:image', content: 'https://arsmosoris.vincze.app/og-default.png'},
    {name: 'twitter:card', content: 'summary_large_image'},
  ];
};

const POLICIES = [
  {
    handle: 'shipping-policy',
    title: 'Szállítási feltételek',
    description: 'Szállítási módok, idők és díjak.',
  },
  {
    handle: 'refund-policy',
    title: 'Visszaküldési feltételek',
    description: '14 napos elállási jog és visszaküldési folyamat.',
  },
  {
    handle: 'privacy-policy',
    title: 'Adatvédelmi tájékoztató',
    description: 'Hogyan kezeljük személyes adataidat (GDPR).',
  },
  {
    handle: 'terms-of-service',
    title: 'Általános Szerződési Feltételek',
    description: 'Vásárlás, fizetés, jogok és kötelezettségek.',
  },
];

export default function Policies() {
  return (
    <div className="policy-page">
      <div className="container">
        <div className="policy-header">
          <p className="policy-tag">Ars Mosoris</p>
          <h1>Jogi feltételek</h1>
          <p className="policy-meta">
            Webshopunk átlátható és fogyasztóbarát feltételek mellett működik.
          </p>
        </div>

        <div className="policy-body">
          {POLICIES.map((policy) => (
            <Link
              key={policy.handle}
              to={`/policies/${policy.handle}`}
              className="policy-index-card"
            >
              <strong>{policy.title} →</strong>
              <p>{policy.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
