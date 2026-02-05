import type {CustomerFragment} from 'customer-accountapi.generated';
import type {CustomerUpdateInput} from '@shopify/hydrogen/customer-account-api-types';
import {CUSTOMER_UPDATE_MUTATION} from '~/graphql/customer-account/CustomerUpdateMutation';
import {
  data,
  Form,
  useActionData,
  useNavigation,
  useOutletContext,
} from 'react-router';
import type {Route} from './+types/account.profile';

export type ActionResponse = {
  error: string | null;
  customer: CustomerFragment | null;
};

export const meta: Route.MetaFunction = () => {
  return [{title: 'Profil | Ars Mosoris'}];
};

export async function loader({context}: Route.LoaderArgs) {
  context.customerAccount.handleAuthStatus();

  return {};
}

export async function action({request, context}: Route.ActionArgs) {
  const {customerAccount} = context;

  if (request.method !== 'PUT') {
    return data({error: 'Method not allowed'}, {status: 405});
  }

  const form = await request.formData();

  try {
    const customer: CustomerUpdateInput = {};
    const validInputKeys = ['firstName', 'lastName'] as const;
    for (const [key, value] of form.entries()) {
      if (!validInputKeys.includes(key as any)) {
        continue;
      }
      if (typeof value === 'string' && value.length) {
        customer[key as (typeof validInputKeys)[number]] = value;
      }
    }

    // update customer and possibly password
    const {data, errors} = await customerAccount.mutate(
      CUSTOMER_UPDATE_MUTATION,
      {
        variables: {
          customer,
          language: customerAccount.i18n.language,
        },
      },
    );

    if (errors?.length) {
      throw new Error(errors[0].message);
    }

    if (!data?.customerUpdate?.customer) {
      throw new Error('Customer profile update failed.');
    }

    return {
      error: null,
      customer: data?.customerUpdate?.customer,
    };
  } catch (error: any) {
    return data(
      {error: error.message, customer: null},
      {
        status: 400,
      },
    );
  }
}

export default function AccountProfile() {
  const account = useOutletContext<{customer: CustomerFragment}>();
  const {state} = useNavigation();
  const action = useActionData<ActionResponse>();
  const customer = action?.customer ?? account?.customer;
  const saved = action?.customer && !action?.error;

  return (
    <div className="account-profile">
      <h2>Profilom</h2>

      {saved && (
        <div className="account-success">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          A profilod sikeresen frissítve!
        </div>
      )}

      {action?.error && (
        <div className="account-error">{action.error}</div>
      )}

      <Form method="PUT" className="account-form">
        <legend>Személyes adatok</legend>
        <fieldset>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">Keresztnév</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                placeholder="Keresztnév"
                aria-label="Keresztnév"
                defaultValue={customer.firstName ?? ''}
                minLength={2}
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Vezetéknév</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                placeholder="Vezetéknév"
                aria-label="Vezetéknév"
                defaultValue={customer.lastName ?? ''}
                minLength={2}
              />
            </div>
          </div>
        </fieldset>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={state !== 'idle'}>
            {state !== 'idle' ? 'Mentés...' : 'Mentés'}
          </button>
        </div>
      </Form>
    </div>
  );
}
