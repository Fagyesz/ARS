import {Link, useRouteLoaderData} from 'react-router';
import type {Route} from './+types/policies.privacy-policy';
import {OperatorDetails} from '~/components/OperatorDetails';
import {FALLBACK_SETTINGS} from '~/lib/content';
import {seoMeta} from '~/lib/seo';
import type {RootLoader} from '~/root';

export const meta: Route.MetaFunction = ({location}) =>
  seoMeta({
    title: 'Adatvédelmi tájékoztató',
    description:
      'Hogyan kezeli az Ars Mosoris a személyes adatokat és a sütiket a webshop használata és a rendelés során.',
    path: location.pathname,
  });

export default function PrivacyPolicy() {
  // operator details and the carrier (a data processor) come from the
  // shop_settings metaobject
  const rootData = useRouteLoaderData<RootLoader>('root');
  const {shipping, company, contactEmail} =
    rootData?.content?.settings ?? FALLBACK_SETTINGS;
  return (
    <div className="policy-page">
      <div className="container">
        <div className="policy-breadcrumb">
          <Link to="/">← Vissza a főoldalra</Link>
        </div>

        <div className="policy-header">
          <p className="policy-tag">Jogi feltételek</p>
          <h1>Adatvédelmi tájékoztató</h1>
          <p className="policy-meta">Utolsó módosítás: 2026. szeptember 29.</p>
        </div>

        <div className="policy-body">
          <h2>Adatkezelő (üzemeltető adatai)</h2>
          <OperatorDetails company={company} />
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
              <strong>Fizetési adatok:</strong> a fizetés a kosR által üzemeltetett
              pénztároldalon történik; kártyaadatot nem tárolunk
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
              <strong>Shopify</strong> – webshop platform: termékek, kosár, rendelések és
              vásárlói fiókok tárolása (adatfeldolgozó)
            </li>
            <li>
              <strong>kosR</strong> – pénztároldal: a rendelési, szállítási és fizetési
              adatok felvétele
            </li>
            <li>
              <strong>Billingo</strong> – számlák kiállítása (számlázási név és cím, a
              rendelés tételei)
            </li>
            <li>
              <strong>{shipping.carrier}</strong> – csomagkézbesítés (név, telefonszám, választott csomagpont)
            </li>
            <li>
              <strong>Resend</strong> – e-mailek küldése (hírlevél-feliratkozás visszaigazolása,
              a kapcsolatfelvételi űrlap üzenetei)
            </li>
            <li>
              <strong>Discord</strong> – belső értesítés a kapcsolatfelvételi űrlapon érkezett
              üzenetekről (név, e-mail, üzenet)
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
              <strong>Törlés („elfeledtetés joga”):</strong> kérheted az adatok törlését,
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
            Kéréseidet a <a href={`mailto:${contactEmail}`}>{contactEmail}</a>{' '}
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
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
