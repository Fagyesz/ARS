import {Link, useRouteLoaderData} from 'react-router';
import type {Route} from './+types/policies.terms-of-service';
import {OperatorDetails} from '~/components/OperatorDetails';
import {SITE_URL} from '~/lib/config';
import {FALLBACK_SETTINGS} from '~/lib/content';
import {seoMeta} from '~/lib/seo';
import type {RootLoader} from '~/root';

export const meta: Route.MetaFunction = ({location}) =>
  seoMeta({
    title: 'Általános Szerződési Feltételek',
    description:
      'Az Ars Mosoris webshop általános szerződési feltételei: rendelés, fizetés, szállítás, elállás és jótállás.',
    path: location.pathname,
  });

export default function TermsOfService() {
  // operator details and payment text come from the shop_settings metaobject
  const rootData = useRouteLoaderData<RootLoader>('root');
  const settings = rootData?.content?.settings ?? FALLBACK_SETTINGS;
  const {contactEmail} = settings;
  return (
    <div className="policy-page">
      <div className="container">
        <div className="policy-breadcrumb">
          <Link to="/">← Vissza a főoldalra</Link>
        </div>

        <div className="policy-header">
          <p className="policy-tag">Jogi feltételek</p>
          <h1>Általános Szerződési Feltételek</h1>
          <p className="policy-meta">Utolsó módosítás: 2026. november 1.</p>
        </div>

        <div className="policy-body">
          <h2>1. Üzemeltető adatai</h2>
          <OperatorDetails company={settings.company} />
          <p>
            Weboldal: <a href={SITE_URL}>{new URL(SITE_URL).host}</a>
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
            <li>Ellenőrizd a rendelés összesítőjét, majd kattints a „Rendelés leadása” gombra.</li>
            <li>
              A rendelés leadása után e-mailben visszaigazolást küldünk. A szerződés a
              visszaigazoló e-mail megküldésével jön létre.
            </li>
          </ol>
          <p>
            A szerződés nyelve magyar. A megadott adatokat a rendelés leadása előtt a pénztárban
            ellenőrizheted és javíthatod. A rendelés adatait a visszaigazoló e-mail tartalmazza.
          </p>

          <h2>4. Árak és fizetés</h2>
          <p>
            A webshopban feltüntetett árak forintban (HUF) értendő végső árak, azokra további
            adó nem kerül felszámításra. Fenntartjuk az árváltoztatás jogát; a módosítás a
            közzétételkor lép hatályba, és a már visszaigazolt rendeléseket nem érinti.
          </p>
          <p>Fizetési módok: {settings.paymentMethods}.</p>
          <p>
            A fizetés és a számlázás a kosR által üzemeltetett pénztároldalon történik; az
            aktuálisan választható fizetési módok (például utánvét) a pénztárban jelennek
            meg. A számlát a Billingo számlázó rendszerével állítjuk ki.
          </p>

          <h2>5. Termékek és elérhetőség</h2>
          <p>
            Az Ars Mosoris korlátozott darabszámú ruhákat és kiegészítőket forgalmaz; a készítés
            technikáját a termékoldal tünteti fel. Fenntartjuk a jogot, hogy egy terméket elvegyük a kínálatból anélkül,
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
            illeti meg, amelyet az <Link to="/elallas">Elállás a szerződéstől</Link> oldalon is
            gyakorolhatsz. A visszaküldési feltételekről részletesen a{' '}
            <Link to="/policies/refund-policy">Visszaküldési feltételek</Link> oldalon
            tájékozódhatsz.
          </p>

          <h2>8. Jótállás és szavatosság</h2>
          <p>
            A Polgári Törvénykönyv és a 373/2021. (VI. 30.) Korm. rendelet alapján a termékek
            hibájáért kellékszavatossággal és termékszavatossággal tartozunk: a hibás termék
            javítását vagy cseréjét, ha ez nem lehetséges, árleszállítást vagy elállást kérhetsz.
            A kellékszavatossági igényt a teljesítéstől számított két évig érvényesítheted; az első
            évben a hibát általában nem neked kell bizonyítanod. Ha
            hibás terméket kaptál, kérjük, vedd fel velünk a kapcsolatot a{' '}
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>{' '}
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
            sem a rajtunk kívül álló okokból bekövetkező szállítási késedelemért. Ez nem érinti a
            fogyasztókat jogszabály alapján megillető jogokat.
          </p>

          <h2>11. Panaszkezelés</h2>
          <p>
            Panaszaidat a <a href={`mailto:${contactEmail}`}>{contactEmail}</a>{' '}
            e-mail-címen fogadjuk. Panaszaid kezelésére 30 napon belül reagálunk. Ha a
            panasz rendezése nem sikerül, a{' '}
            lakóhelyed szerinti békéltető testülethez fordulhatsz; a testületek listája a{' '}
            <a href="https://bekeltetes.hu" target="_blank" rel="noopener noreferrer">bekeltetes.hu</a>{' '}
            oldalon található. Budapesten a{' '}
            <strong>Budapesti Békéltető Testület</strong> jár el (cím: 1016 Budapest, Krisztina
            krt. 99.; levelezési cím: 1253 Budapest, Pf. 10.).
          </p>

          <h2>12. Irányadó jog</h2>
          <p>
            Jelen ÁSZF-re a magyar jog az irányadó. A felek közötti vitás ügyekben – amennyiben
            a fogyasztóvédelmi egyeztetés nem vezet eredményre – a hatáskörrel és illetékességgel
            rendelkező magyar bíróság jár el.
          </p>

          <h2>13. Egyedi rendelés a saját ruhadarabodra</h2>
          <p>
            Az <Link to="/egyedi-rendeles">Egyedi rendelés</Link> oldalon küldött üzenet csak
            ajánlatkérés. A szerződés akkor jön létre, amikor az e-mailben küldött ajánlatunkat
            (a munka leírása, teljes ár, határidő, a ruha eljuttatásának módja és költsége)
            e-mailben elfogadod.
          </p>
          <p>
            A 14 napos elállási határidő a szerződés létrejöttekor indul. Ha azt szeretnéd, hogy
            ezen belül kezdjük el a munkát, ezt az elfogadó e-mailben kifejezetten kérned kell, és
            tudomásul kell venned, hogy a munka teljes elvégzése után már nem állhatsz el. Ha a
            munka megkezdése után, de a befejezése előtt állsz el, az elvégzett munkával arányos
            díjat kell megfizetned.
          </p>
          <p>
            Saját kép vagy minta küldésével kijelented, hogy jogosult vagy a felhasználására.
            Elutasíthatjuk azt a kérést, amelyet jogsértőnek vagy a ruhadarab állapota miatt nem
            kivitelezhetőnek tartunk. Az ajánlatban jelezzük, ha a ruhadarab anyaga vagy állapota
            miatt a munka kockázatos.
          </p>
        </div>

        <div className="policy-contact-box">
          <h3>Kérdésed van az ÁSZF-fel kapcsolatban?</h3>
          <p>Írj nekünk, szívesen segítünk!</p>
          <p>
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
