import {Link} from 'react-router';
import type {Route} from './+types/policies.terms-of-service';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Általános Szerződési Feltételek | Ars Mosoris'}];
};

export default function TermsOfService() {
  return (
    <div className="policy-page">
      <div className="container">
        <div className="policy-breadcrumb">
          <Link to="/">← Vissza a főoldalra</Link>
        </div>

        <div className="policy-header">
          <p className="policy-tag">Jogi feltételek</p>
          <h1>Általános Szerződési Feltételek</h1>
          <p className="policy-meta">Utolsó módosítás: 2025. január 1.</p>
        </div>

        <div className="policy-body">
          <h2>1. Az eladó adatai</h2>
          <p>
            <strong>Ars Mosoris</strong>
            <br />
            Székhely: 1046 Budapest, Kiss Ernő u. 4.
            <br />
            E-mail: <a href="mailto:arsmosoris@vincze.app">arsmosoris@vincze.app</a>
            <br />
            Weboldal: <a href="https://arsmosoris.vincze.app">arsmosoris.vincze.app</a>
          </p>

          <h2>2. Az ÁSZF hatálya</h2>
          <p>
            Jelen Általános Szerződési Feltételek az Ars Mosoris webshopban
            (a továbbiakban: webshop) leadott minden vásárlásra vonatkoznak. A rendelés
            leadásával a vásárló elfogadja jelen feltételeket.
          </p>

          <h2>3. A vásárlás menete</h2>
          <ol>
            <li>Válaszd ki a kívánt terméke(ke)t, és add a kosárba.</li>
            <li>A pénztárnál add meg a szállítási és fizetési adatokat.</li>
            <li>Ellenőrizd a rendelés összesítőjét, majd kattints a „Rendelés leadása" gombra.</li>
            <li>
              A rendelés leadása után e-mailben visszaigazolást küldünk. A szerződés a
              visszaigazoló e-mail megküldésével jön létre.
            </li>
          </ol>

          <h2>4. Árak és fizetés</h2>
          <p>
            A webshopban feltüntetett árak forintban (HUF) értendők és az általános forgalmi
            adót (ÁFA) tartalmazzák. Fenntartjuk az árváltoztatás jogát; a módosítás a
            közzétételkor lép hatályba, és a már visszaigazolt rendeléseket nem érinti.
          </p>
          <p>Az elfogadott fizetési módok:</p>
          <ul>
            <li>Bankkártya (Visa, Mastercard, American Express) – Shopify Payments</li>
            <li>PayPal</li>
            <li>Google Pay / Apple Pay</li>
          </ul>

          <h2>5. Termékek és elérhetőség</h2>
          <p>
            Az Ars Mosoris kézzel készített, korlátozott darabszámú ruhákat és kiegészítőket
            forgalmaz. Fenntartjuk a jogot, hogy egy terméket elvegyük a kínálatból anélkül,
            hogy kötelesek lennénk azt pótolni. Ha egy megrendelt termék nem érhető el,
            haladéktalanul értesítünk, és a vételárat visszatérítjük.
          </p>

          <h2>6. Szállítás</h2>
          <p>
            A szállítási feltételekről részletesen az{' '}
            <Link to="/policies/shipping-policy">Szállítási feltételek</Link> oldalon
            tájékozódhatsz.
          </p>

          <h2>7. Elállási jog és visszaküldés</h2>
          <p>
            A vásárlókat a 45/2014. (II. 26.) Korm. rendelet alapján 14 napos elállási jog
            illeti meg. A visszaküldési feltételekről részletesen a{' '}
            <Link to="/policies/refund-policy">Visszaküldési feltételek</Link> oldalon
            tájékozódhatsz.
          </p>

          <h2>8. Jótállás és szavatosság</h2>
          <p>
            A Polgári Törvénykönyv és a 151/2003. (IX. 22.) Korm. rendelet alapján a
            termékek hibájáért kellékszavatossággal és termékszavatossággal tartozunk. Ha
            hibás terméket kaptál, kérjük, vedd fel velünk a kapcsolatot a{' '}
            <a href="mailto:arsmosoris@vincze.app">arsmosoris@vincze.app</a>{' '}
            e-mail-címen.
          </p>

          <h2>9. Szellemi tulajdon</h2>
          <p>
            A webshop tartalmát (szövegek, képek, logók, designelemek) szerzői jog védi.
            A tartalmakat kizárólag saját, nem kereskedelmi célra, az Ars Mosoris előzetes
            írásbeli engedélyével lehet felhasználni.
          </p>

          <h2>10. Felelősségkorlátozás</h2>
          <p>
            Az Ars Mosoris nem vállal felelősséget a webshop ideiglenes elérhetetlenségéért,
            sem a rajtunk kívül álló okokból bekövetkező szállítási késedelemért. Felelősségünk
            minden esetben a vételár összegére korlátozódik.
          </p>

          <h2>11. Panaszkezelés</h2>
          <p>
            Panaszaidat a <a href="mailto:arsmosoris@vincze.app">arsmosoris@vincze.app</a>{' '}
            e-mail-címen fogadjuk. Panaszaid kezelésére 30 napon belül reagálunk. Ha a
            panasz rendezése nem sikerül, a{' '}
            <strong>Budapesti Békéltető Testülethez</strong> fordulhatsz
            (cím: 1016 Budapest, Krisztina krt. 99.; e-mail: bekelteto.testulet@bkik.hu).
          </p>

          <h2>12. Irányadó jog</h2>
          <p>
            Jelen ÁSZF-re a magyar jog az irányadó. A felek közötti vitás ügyekben – amennyiben
            a fogyasztóvédelmi egyeztetés nem vezet eredményre – a hatáskörrel és illetékességgel
            rendelkező magyar bíróság jár el.
          </p>
        </div>

        <div className="policy-contact-box">
          <h3>Kérdésed van az ÁSZF-fel kapcsolatban?</h3>
          <p>Írj nekünk, szívesen segítünk!</p>
          <p>
            <a href="mailto:arsmosoris@vincze.app">arsmosoris@vincze.app</a>
          </p>
        </div>
      </div>
    </div>
  );
}
