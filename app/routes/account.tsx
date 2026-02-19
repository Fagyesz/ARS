import {
  data as remixData,
  Form,
  NavLink,
  Outlet,
  useLoaderData,
} from 'react-router';
import type {Route} from './+types/account';
import {CUSTOMER_DETAILS_QUERY} from '~/graphql/customer-account/CustomerDetailsQuery';

export function shouldRevalidate() {
  return true;
}

export async function loader({context}: Route.LoaderArgs) {
  const {customerAccount} = context;
  const {data, errors} = await customerAccount.query(
    CUSTOMER_DETAILS_QUERY,
    {
      variables: {
        language: customerAccount.i18n.language,
      },
    },
  );

  if (errors?.length || !data?.customer) {
    throw new Error('Customer not found');
  }

  return remixData(
    {customer: data.customer},
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    },
  );
}

export default function AccountLayout() {
  const {customer} = useLoaderData<typeof loader>();

  const heading = customer?.firstName
    ? `Üdvözlünk, ${customer.firstName}!`
    : 'Fiókom';

  return (
    <div className="account">
      <h1>{heading}</h1>
      <AccountMenu />
      <Outlet context={{customer}} />
    </div>
  );
}

function AccountMenu() {
  return (
    <nav className="account-nav" role="navigation">
      <NavLink
        to="/account"
        end
        className={({isActive}) => (isActive ? 'active' : '')}
      >
        Áttekintés
      </NavLink>
      <NavLink
        to="/account/orders"
        className={({isActive}) => (isActive ? 'active' : '')}
      >
        Rendelések
      </NavLink>
      <NavLink
        to="/account/profile"
        className={({isActive}) => (isActive ? 'active' : '')}
      >
        Profil
      </NavLink>
      <NavLink
        to="/account/addresses"
        className={({isActive}) => (isActive ? 'active' : '')}
      >
        Címek
      </NavLink>
      <Logout />
    </nav>
  );
}

function Logout() {
  return (
    <Form method="POST" action="/account/logout">
      <button type="submit">Kijelentkezés</button>
    </Form>
  );
}
