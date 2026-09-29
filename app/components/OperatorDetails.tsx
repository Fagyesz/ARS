import type {SiteSettings} from '~/lib/content';

/**
 * "Üzemeltető adatai" for the legal pages. Every value comes from the
 * shop_settings metaobject (entered by the owner in the Shopify admin);
 * empty fields are left out.
 */
export function OperatorDetails({company}: {company: SiteSettings['company']}) {
  const {name, address, taxNumber, email, phone} = company;
  return (
    <p>
      <strong>{name || 'Ars Mosoris'}</strong>
      {address ? (
        <>
          <br />
          Székhely: {address}
        </>
      ) : null}
      {taxNumber ? (
        <>
          <br />
          Adószám: {taxNumber}
        </>
      ) : null}
      {email ? (
        <>
          <br />
          E-mail: <a href={`mailto:${email}`}>{email}</a>
        </>
      ) : null}
      {phone ? (
        <>
          <br />
          Telefon: <a href={`tel:${phone.replace(/[^\d+]/g, '')}`}>{phone}</a>
        </>
      ) : null}
    </p>
  );
}
