import {Link} from 'react-router';
import type {Route} from './+types/policies.shipping-policy';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Szállítási feltételek | Ars Mosoris'}];
};

export default function ShippingPolicy() {
  return (
    <div className="policy-page">
      <div className="container">
        <div className="policy-breadcrumb">
          <Link to="/">← Vissza a főoldalra</Link>
        </div>

        <div className="policy-header">
          <p className="policy-tag">Jogi feltételek</p>
          <h1>Szállítási feltételek</h1>
          <p className="policy-meta">Utolsó módosítás: 2025. január 1.</p>
        </div>

        <div className="policy-body">
          <h2>Szállítási módok</h2>
          <p>
            Az Ars Mosoris webshopban leadott rendeléseket GLS futárszolgálattal kézbesítjük
            Magyarország egész területére. Rendelésed feladása után e-mailben küldjük el a
            csomagkövetési számot, amellyel nyomon követheted küldeményed útját.
          </p>

          <h2>Szállítási idő</h2>
          <p>
            A rendelések feldolgozása általában <strong>1–2 munkanapot</strong> vesz igénybe.
            A csomag a feladástól számítva <strong>2–3 munkanap</strong> alatt érkezik meg.
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
            <li>
              <strong>Ingyenes szállítás:</strong> 30 000 Ft feletti rendeléseknél
            </li>
            <li>
              <strong>GLS futár (csomagpont):</strong> 1 290 Ft
            </li>
            <li>
              <strong>GLS futár (házhoz szállítás):</strong> 1 590 Ft
            </li>
          </ul>

          <h2>Szállítási terület</h2>
          <p>
            Jelenleg csak Magyarország területén szállítunk. Európai szállításra vonatkozó
            igényeket esetileg mérlegelünk – ha érdekel, kérjük, vedd fel velünk a kapcsolatot
            a{' '}
            <a href="mailto:arsmosoris@vincze.app">arsmosoris@vincze.app</a> e-mail-címen.
          </p>

          <h2>Csomagolás</h2>
          <p>
            Minden terméket gondosan csomagolunk, hogy sérülés nélkül érjen hozzád. Igyekszünk
            környezetbarát csomagolóanyagokat használni, összhangban értékeinkkel.
          </p>

          <h2>Mit tegyél, ha a csomag sérült vagy hiányos?</h2>
          <p>
            Ha sérült csomagot kapsz, kérjük, a futár jelenlétében rögzítsd a sérülést (fotóval),
            és haladéktalanul jelezd felénk a{' '}
            <a href="mailto:arsmosoris@vincze.app">arsmosoris@vincze.app</a> címen.
            Ilyenkor cseredarabot vagy visszatérítést biztosítunk.
          </p>
        </div>

        <div className="policy-contact-box">
          <h3>Kérdésed van a szállítással kapcsolatban?</h3>
          <p>Írj nekünk, szívesen segítünk!</p>
          <p>
            <a href="mailto:arsmosoris@vincze.app">arsmosoris@vincze.app</a>
          </p>
        </div>
      </div>
    </div>
  );
}
