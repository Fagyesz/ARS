/**
 * The EU harmonised notice on the legal guarantee of conformity, required at the point of sale since
 * 27 Sept 2026 (Reg. (EU) 2025/1960 Annex I; 45/2014. Korm. r. 11. § (1a) a)). Online it must be the
 * colour version. The image is the official Hungarian one from the Official Journal, unchanged.
 */
export function GuaranteeNotice() {
  return (
    <details className="size-guide guarantee-notice">
      <summary>Jogszabályi szavatosság</summary>
      <a href="/jogszabalyi-szavatossag.jpg" target="_blank" rel="noopener">
        <img
          src="/jogszabalyi-szavatossag.jpg"
          alt="Jogszabályi szavatosság: legalább kétéves szavatosság az Európai Unióban értékesített áruk esetében. Ha az áru nem felel meg a leírásnak vagy nem rendeltetésszerűen működik, az eladó ingyenes javítást vagy cserét, egyes esetekben árcsökkentést vagy teljes árvisszatérítést köteles felajánlani. Teendő: vegye fel a kapcsolatot az eladóval, és mutassa be a vásárlást igazoló dokumentumot. Részletek: europa.eu/youreurope/jótállás"
          width={1186}
          height={1671}
          loading="lazy"
        />
      </a>
    </details>
  );
}
