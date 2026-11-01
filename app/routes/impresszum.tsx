import {useRouteLoaderData} from 'react-router';
import type {Route} from './+types/impresszum';
import {OperatorDetails} from '~/components/OperatorDetails';
import {HOSTING_PROVIDER} from '~/lib/config';
import {FALLBACK_SETTINGS} from '~/lib/content';
import {seoMeta} from '~/lib/seo';
import type {RootLoader} from '~/root';

export const meta: Route.MetaFunction = ({location}) =>
  seoMeta({
    title: 'Impresszum',
    description: 'Az Ars Mosoris webshop üzemeltetőjének és tárhelyszolgáltatójának adatai.',
    path: location.pathname,
  });

export default function Impresszum() {
  const {company} = useRouteLoaderData<RootLoader>('root')?.content?.settings ?? FALLBACK_SETTINGS;
  return (
    <div className="policy-page">
      <div className="container">
        <div className="policy-header">
          <p className="policy-tag">Jogi feltételek</p>
          <h1>Impresszum</h1>
        </div>

        <div className="policy-body">
          <h2>Üzemeltető</h2>
          <OperatorDetails company={company} />

          <h2>Tárhelyszolgáltató</h2>
          <p>
            <strong>{HOSTING_PROVIDER.name}</strong>
            <br />
            {HOSTING_PROVIDER.address}
            <br />
            Kapcsolat:{' '}
            <a href={HOSTING_PROVIDER.contactUrl} target="_blank" rel="noopener noreferrer">
              {new URL(HOSTING_PROVIDER.contactUrl).host}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
