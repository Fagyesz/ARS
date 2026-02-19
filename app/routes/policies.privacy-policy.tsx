import {Link} from 'react-router';
import type {Route} from './+types/policies.privacy-policy';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Adatvédelmi tájékoztató | Ars Mosoris'}];
};

export default function PrivacyPolicy() {
  return (
    <div className="policy-page">
      <div className="container">
        <div className="policy-breadcrumb">
          <Link to="/">← Vissza a főoldalra</Link>
        </div>

        <div className="policy-header">
          <p className="policy-tag">Jogi feltételek</p>
          <h1>Adatvédelmi tájékoztató</h1>
          <p className="policy-meta">Utolsó módosítás: 2025. január 1.</p>
        </div>

        <div className="policy-body">
          <h2>Adatkezelő</h2>
          <p>
            <strong>Ars Mosoris</strong>
            <br />
            Székhely: 1046 Budapest, Kiss Ernő u. 4.
            <br />
            E-mail: <a href="mailto:arsmosoris@vincze.app">arsmosoris@vincze.app</a>
          </p>
          <p>
            Az Ars Mosoris elkötelezett az érintettek személyes adatainak védelme iránt, és
            jelen tájékoztatóban bemutatja, hogyan kezeli a webshop használata során
            összegyűjtött adatokat, összhangban a GDPR (EU 2016/679 rendelet) és a vonatkozó
            magyar jogszabályok rendelkezéseivel.
          </p>

          <h2>Kezelt adatok és céljuk</h2>
          <p>Az alábbi adatokat kezeljük és a feltüntetett célokra használjuk:</p>
          <ul>
            <li>
              <strong>Rendelési adatok</strong> (név, szállítási cím, e-mail, telefonszám):
              a megrendelés teljesítése, szállítás, számlázás
            </li>
            <li>
              <strong>Fizetési adatok:</strong> a tranzakciókat a Shopify Payments biztonságos
              rendszere kezeli; kártyaadatot nem tárolunk
            </li>
            <li>
              <strong>Fiók adatok</strong> (ha regisztrálsz): a rendelési előzmények és a
              személyre szabott élmény biztosítása
            </li>
            <li>
              <strong>Kapcsolatfelvételi adatok</strong> (neve, e-mail, üzenet): az üzeneted
              megválaszolása
            </li>
            <li>
              <strong>Technikai adatok</strong> (IP-cím, böngésző típusa, sütik): a webshop
              működtetése, biztonság, analitika
            </li>
          </ul>

          <h2>Az adatkezelés jogalapja</h2>
          <ul>
            <li>Szerződés teljesítése (rendelési és szállítási adatok)</li>
            <li>Jogszabályi kötelezettség (számlázás, számvitel)</li>
            <li>Jogos érdek (csalás megelőzése, biztonság)</li>
            <li>Hozzájárulás (marketing e-mailek, sütik)</li>
          </ul>

          <h2>Adatmegosztás harmadik felekkel</h2>
          <p>
            Adataidat nem adjuk el harmadik feleknek. Az alábbi partnereknek adunk hozzáférést
            a szükséges mértékben:
          </p>
          <ul>
            <li>
              <strong>Shopify Inc.</strong> – webshop platform és fizetési rendszer (adatfeldolgozó)
            </li>
            <li>
              <strong>GLS Hungary Kft.</strong> – szállítmányozás (szállítási adatok)
            </li>
            <li>
              <strong>Resend</strong> – tranzakciós e-mailek küldése
            </li>
          </ul>

          <h2>Adatmegőrzési idő</h2>
          <p>
            A rendelési és számlázási adatokat a jogszabályi előírásoknak megfelelően{' '}
            <strong>8 évig</strong> megőrizzük. Egyéb adatokat (pl. kapcsolatfelvétel) a cél
            teljesülése után törlünk, illetve legkésőbb 2 évvel a gyűjtés után.
          </p>

          <h2>Érintetti jogok</h2>
          <p>A GDPR alapján az alábbi jogokat gyakorolhatod:</p>
          <ul>
            <li>
              <strong>Hozzáférés:</strong> kérheted, hogy tájékoztassunk a kezelt adataidról
            </li>
            <li>
              <strong>Helyesbítés:</strong> kérheted a pontatlan adatok kijavítását
            </li>
            <li>
              <strong>Törlés („elfeledtetés joga"):</strong> kérheted az adatok törlését,
              ha azok kezelése nem szükséges tovább
            </li>
            <li>
              <strong>Adathordozhatóság:</strong> kérheted az adataid géppel olvasható
              formátumban való kiadását
            </li>
            <li>
              <strong>Tiltakozás:</strong> tiltakozhatsz a jogos érdeken alapuló adatkezelés
              ellen
            </li>
          </ul>
          <p>
            Kéréseidet a <a href="mailto:arsmosoris@vincze.app">arsmosoris@vincze.app</a>{' '}
            e-mail-címen fogadjuk, és 30 napon belül válaszolunk.
          </p>

          <h2>Sütik (cookie-k)</h2>
          <p>
            Weboldalunk sütiket használ a működés biztosításához (munkamenet-sütik), a
            kosár tárolásához, és névtelen látogatói statisztikák gyűjtéséhez. Az adatvédelmi
            beállításokat a weboldal alján lévő sütibanner segítségével módosíthatod.
          </p>

          <h2>Jogorvoslat</h2>
          <p>
            Ha úgy érzed, hogy adataid kezelése sérti a GDPR-t, panaszt tehetsz a{' '}
            <strong>Nemzeti Adatvédelmi és Információszabadság Hatóságnál</strong>{' '}
            (NAIH, <a href="https://www.naih.hu" target="_blank" rel="noopener noreferrer">www.naih.hu</a>).
          </p>
        </div>

        <div className="policy-contact-box">
          <h3>Adatvédelemmel kapcsolatos megkeresések</h3>
          <p>Kérdés vagy adatigénylés esetén írj nekünk:</p>
          <p>
            <a href="mailto:arsmosoris@vincze.app">arsmosoris@vincze.app</a>
          </p>
        </div>
      </div>
    </div>
  );
}
