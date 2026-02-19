import {Link} from 'react-router';
import type {Route} from './+types/policies.refund-policy';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Visszaküldési feltételek | Ars Mosoris'}];
};

export default function RefundPolicy() {
  return (
    <div className="policy-page">
      <div className="container">
        <div className="policy-breadcrumb">
          <Link to="/">← Vissza a főoldalra</Link>
        </div>

        <div className="policy-header">
          <p className="policy-tag">Jogi feltételek</p>
          <h1>Visszaküldési feltételek</h1>
          <p className="policy-meta">Utolsó módosítás: 2025. január 1.</p>
        </div>

        <div className="policy-body">
          <h2>Elállási jog</h2>
          <p>
            Az Európai Unió fogyasztóvédelmi jogszabályai alapján, mint vásárló,{' '}
            <strong>14 napon belül indoklás nélkül elállhatsz</strong> a vásárlástól, és
            visszaküldheted a megvásárolt terméket. Az elállási határidő a termék kézhezvételétől
            számított 14. nap elteltével jár le.
          </p>
          <p>
            Kézzel festett, egyedi, vagy személyre szabott termékek esetén az elállási jog{' '}
            <strong>nem alkalmazható</strong>, kivéve, ha a termék hibás.
          </p>

          <h2>Visszaküldés folyamata</h2>
          <ol>
            <li>
              Küldj e-mailt a{' '}
              <a href="mailto:arsmosoris@vincze.app">arsmosoris@vincze.app</a>{' '}
              címre a megrendelésed számával és a visszaküldeni kívánt termék(ek) megjelölésével.
            </li>
            <li>
              Csapatunk 1–2 munkanapon belül visszajelez, és elküldi a visszaküldési utasításokat.
            </li>
            <li>
              Csomagold be a terméket az eredeti (vagy azzal egyenértékű) csomagolásban, és küldd
              vissza a megadott címre.
            </li>
            <li>
              A visszaküldés postaköltségét <strong>a vásárló viseli</strong>, kivéve, ha a termék
              hibás vagy helytelen terméket kaptál.
            </li>
          </ol>

          <h2>A visszaküldött termék állapota</h2>
          <p>A visszaküldött terméknek az alábbi feltételeknek kell megfelelnie:</p>
          <ul>
            <li>Viseletlenül, eredeti állapotában, mosatlanul</li>
            <li>A címkék és eredeti csomagolás megőrzésével</li>
            <li>A vásárlástól számított 14 napon belül postázva</li>
          </ul>
          <p>
            Ha a termék nem felel meg ezeknek a feltételeknek, fenntartjuk a jogot a visszaküldés
            elutasítására vagy az értékcsökkenés levonására.
          </p>

          <h2>Visszatérítés</h2>
          <p>
            A visszaküldött termék kézhezvétele és ellenőrzése után{' '}
            <strong>14 napon belül</strong> térítjük vissza a vételárat az eredeti fizetési módra.
            Banki átutalás esetén a jóváírás ideje a banktól függően változhat.
          </p>

          <h2>Hibás termék</h2>
          <p>
            Ha hibás vagy sérült terméket kaptál, kérjük, fotókkal együtt jelezd nekünk a{' '}
            <a href="mailto:arsmosoris@vincze.app">arsmosoris@vincze.app</a>{' '}
            e-mail-címen. Ilyenkor ingyenes cserét vagy teljes visszatérítést biztosítunk, és a
            postaköltséget is mi álljuk.
          </p>

          <h2>Csere</h2>
          <p>
            Ha más méretet vagy terméket szeretnél, a legegyszerűbb megoldás az eredeti termék
            visszaküldése (visszatérítéssel) és egy új rendelés leadása. Cserére vonatkozó
            egyedi igényeket esetileg mérlegelünk – kérjük, vedd fel velünk a kapcsolatot.
          </p>
        </div>

        <div className="policy-contact-box">
          <h3>Kérdésed van a visszaküldéssel kapcsolatban?</h3>
          <p>Írj nekünk, segítünk eligazodni!</p>
          <p>
            <a href="mailto:arsmosoris@vincze.app">arsmosoris@vincze.app</a>
          </p>
        </div>
      </div>
    </div>
  );
}
