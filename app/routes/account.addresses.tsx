import type {CustomerAddressInput} from '@shopify/hydrogen/customer-account-api-types';
import type {
  AddressFragment,
  CustomerFragment,
} from 'customer-accountapi.generated';
import {
  data,
  Form,
  useActionData,
  useNavigation,
  useOutletContext,
  type Fetcher,
} from 'react-router';
import type {Route} from './+types/account.addresses';
import {
  UPDATE_ADDRESS_MUTATION,
  DELETE_ADDRESS_MUTATION,
  CREATE_ADDRESS_MUTATION,
} from '~/graphql/customer-account/CustomerAddressMutations';

export type ActionResponse = {
  addressId?: string | null;
  createdAddress?: AddressFragment;
  defaultAddress?: string | null;
  deletedAddress?: string | null;
  error: Record<AddressFragment['id'], string> | null;
  updatedAddress?: AddressFragment;
};

export const meta: Route.MetaFunction = () => {
  return [{title: 'Címek | Ars Mosoris'}];
};

export async function loader({context}: Route.LoaderArgs) {
  context.customerAccount.handleAuthStatus();

  return {};
}

export async function action({request, context}: Route.ActionArgs) {
  const {customerAccount} = context;

  try {
    const form = await request.formData();

    const addressId = form.has('addressId')
      ? String(form.get('addressId'))
      : null;
    if (!addressId) {
      throw new Error('You must provide an address id.');
    }

    // this will ensure redirecting to login never happen for mutatation
    const isLoggedIn = await customerAccount.isLoggedIn();
    if (!isLoggedIn) {
      return data(
        {error: {[addressId]: 'Unauthorized'}},
        {
          status: 401,
        },
      );
    }

    const defaultAddress = form.has('defaultAddress')
      ? String(form.get('defaultAddress')) === 'on'
      : false;
    const address: CustomerAddressInput = {};
    const keys: (keyof CustomerAddressInput)[] = [
      'address1',
      'address2',
      'city',
      'company',
      'territoryCode',
      'firstName',
      'lastName',
      'phoneNumber',
      'zoneCode',
      'zip',
    ];

    for (const key of keys) {
      const value = form.get(key);
      if (typeof value === 'string') {
        address[key] = value;
      }
    }

    switch (request.method) {
      case 'POST': {
        // handle new address creation
        try {
          const {data, errors} = await customerAccount.mutate(
            CREATE_ADDRESS_MUTATION,
            {
              variables: {
                address,
                defaultAddress,
                language: customerAccount.i18n.language,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (data?.customerAddressCreate?.userErrors?.length) {
            throw new Error(data?.customerAddressCreate?.userErrors[0].message);
          }

          if (!data?.customerAddressCreate?.customerAddress) {
            throw new Error('Customer address create failed.');
          }

          return {
            error: null,
            createdAddress: data?.customerAddressCreate?.customerAddress,
            defaultAddress,
          };
        } catch (error: unknown) {
          if (error instanceof Error) {
            return data(
              {error: {[addressId]: error.message}},
              {
                status: 400,
              },
            );
          }
          return data(
            {error: {[addressId]: error}},
            {
              status: 400,
            },
          );
        }
      }

      case 'PUT': {
        // handle address updates
        try {
          const {data, errors} = await customerAccount.mutate(
            UPDATE_ADDRESS_MUTATION,
            {
              variables: {
                address,
                addressId: decodeURIComponent(addressId),
                defaultAddress,
                language: customerAccount.i18n.language,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (data?.customerAddressUpdate?.userErrors?.length) {
            throw new Error(data?.customerAddressUpdate?.userErrors[0].message);
          }

          if (!data?.customerAddressUpdate?.customerAddress) {
            throw new Error('Customer address update failed.');
          }

          return {
            error: null,
            updatedAddress: address,
            defaultAddress,
          };
        } catch (error: unknown) {
          if (error instanceof Error) {
            return data(
              {error: {[addressId]: error.message}},
              {
                status: 400,
              },
            );
          }
          return data(
            {error: {[addressId]: error}},
            {
              status: 400,
            },
          );
        }
      }

      case 'DELETE': {
        // handles address deletion
        try {
          const {data, errors} = await customerAccount.mutate(
            DELETE_ADDRESS_MUTATION,
            {
              variables: {
                addressId: decodeURIComponent(addressId),
                language: customerAccount.i18n.language,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (data?.customerAddressDelete?.userErrors?.length) {
            throw new Error(data?.customerAddressDelete?.userErrors[0].message);
          }

          if (!data?.customerAddressDelete?.deletedAddressId) {
            throw new Error('Customer address delete failed.');
          }

          return {error: null, deletedAddress: addressId};
        } catch (error: unknown) {
          if (error instanceof Error) {
            return data(
              {error: {[addressId]: error.message}},
              {
                status: 400,
              },
            );
          }
          return data(
            {error: {[addressId]: error}},
            {
              status: 400,
            },
          );
        }
      }

      default: {
        return data(
          {error: {[addressId]: 'Method not allowed'}},
          {
            status: 405,
          },
        );
      }
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return data(
        {error: error.message},
        {
          status: 400,
        },
      );
    }
    return data(
      {error},
      {
        status: 400,
      },
    );
  }
}

export default function Addresses() {
  const {customer} = useOutletContext<{customer: CustomerFragment}>();
  const {defaultAddress, addresses} = customer;

  return (
    <div className="account-addresses">
      <h2>Címeim</h2>

      <div className="address-form-container">
        <p className="address-section-title">Új cím hozzáadása</p>
        <NewAddressForm />
      </div>

      {addresses.nodes.length > 0 && (
        <>
          <p className="address-section-title">Mentett címek</p>
          <ExistingAddresses
            addresses={addresses}
            defaultAddress={defaultAddress}
          />
        </>
      )}
    </div>
  );
}

function NewAddressForm() {
  const newAddress = {
    address1: '',
    address2: '',
    city: '',
    company: '',
    territoryCode: '',
    firstName: '',
    id: 'new',
    lastName: '',
    phoneNumber: '',
    zoneCode: '',
    zip: '',
  } as CustomerAddressInput;

  return (
    <AddressForm
      addressId={'NEW_ADDRESS_ID'}
      address={newAddress}
      defaultAddress={null}
    >
      {({stateForMethod}) => (
        <div className="form-actions">
          <button
            className="btn btn-primary"
            disabled={stateForMethod('POST') !== 'idle'}
            formMethod="POST"
            type="submit"
          >
            {stateForMethod('POST') !== 'idle' ? 'Mentés...' : 'Új cím hozzáadása'}
          </button>
        </div>
      )}
    </AddressForm>
  );
}

function ExistingAddresses({
  addresses,
  defaultAddress,
}: Pick<CustomerFragment, 'addresses' | 'defaultAddress'>) {
  return (
    <div className="addresses-grid">
      {addresses.nodes.map((address) => (
        <div
          key={address.id}
          className={`address-card${defaultAddress?.id === address.id ? ' is-default' : ''}`}
        >
          {defaultAddress?.id === address.id && (
            <span className="address-card-badge">Alapértelmezett</span>
          )}
          <AddressForm
            addressId={address.id}
            address={address}
            defaultAddress={defaultAddress}
          >
            {({stateForMethod}) => (
              <div className="form-actions">
                <button
                  className="btn btn-primary"
                  disabled={stateForMethod('PUT') !== 'idle'}
                  formMethod="PUT"
                  type="submit"
                >
                  {stateForMethod('PUT') !== 'idle' ? 'Mentés...' : 'Mentés'}
                </button>
                <button
                  className="btn btn-outline"
                  disabled={stateForMethod('DELETE') !== 'idle'}
                  formMethod="DELETE"
                  type="submit"
                >
                  {stateForMethod('DELETE') !== 'idle' ? 'Törlés...' : 'Törlés'}
                </button>
              </div>
            )}
          </AddressForm>
        </div>
      ))}
    </div>
  );
}

export function AddressForm({
  addressId,
  address,
  defaultAddress,
  children,
}: {
  addressId: AddressFragment['id'];
  address: CustomerAddressInput;
  defaultAddress: CustomerFragment['defaultAddress'];
  children: (props: {
    stateForMethod: (method: 'PUT' | 'POST' | 'DELETE') => Fetcher['state'];
  }) => React.ReactNode;
}) {
  const {state, formMethod} = useNavigation();
  const action = useActionData<ActionResponse>();
  const error = action?.error?.[addressId];
  const isDefaultAddress = defaultAddress?.id === addressId;
  return (
    <Form id={addressId} className="account-form">
      <fieldset>
        <input type="hidden" name="addressId" defaultValue={addressId} />

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName">Keresztnév *</label>
            <input
              aria-label="Keresztnév"
              autoComplete="given-name"
              defaultValue={address?.firstName ?? ''}
              id="firstName"
              name="firstName"
              placeholder="Keresztnév"
              required
              type="text"
            />
          </div>
          <div className="form-group">
            <label htmlFor="lastName">Vezetéknév *</label>
            <input
              aria-label="Vezetéknév"
              autoComplete="family-name"
              defaultValue={address?.lastName ?? ''}
              id="lastName"
              name="lastName"
              placeholder="Vezetéknév"
              required
              type="text"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="company">Cég</label>
            <input
              aria-label="Cégnév"
              autoComplete="organization"
              defaultValue={address?.company ?? ''}
              id="company"
              name="company"
              placeholder="Cégnév (opcionális)"
              type="text"
            />
          </div>
          <div className="form-group">
            <label htmlFor="phoneNumber">Telefonszám</label>
            <input
              aria-label="Telefonszám"
              autoComplete="tel"
              defaultValue={address?.phoneNumber ?? ''}
              id="phoneNumber"
              name="phoneNumber"
              placeholder="+36123456789"
              pattern="^\+?[1-9]\d{3,14}$"
              type="tel"
            />
          </div>
        </div>

        <div className="form-group" style={{marginBottom: '1rem'}}>
          <label htmlFor="address1">Utca, házszám *</label>
          <input
            aria-label="Utca, házszám"
            autoComplete="address-line1"
            defaultValue={address?.address1 ?? ''}
            id="address1"
            name="address1"
            placeholder="pl. Andrássy utca 1"
            required
            type="text"
          />
        </div>

        <div className="form-group" style={{marginBottom: '1rem'}}>
          <label htmlFor="address2">Emelet, ajtó</label>
          <input
            aria-label="Emelet, ajtó"
            autoComplete="address-line2"
            defaultValue={address?.address2 ?? ''}
            id="address2"
            name="address2"
            placeholder="Emelet, ajtó (opcionális)"
            type="text"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="zip">Irányítószám *</label>
            <input
              aria-label="Irányítószám"
              autoComplete="postal-code"
              defaultValue={address?.zip ?? ''}
              id="zip"
              name="zip"
              placeholder="pl. 1061"
              required
              type="text"
            />
          </div>
          <div className="form-group">
            <label htmlFor="city">Város *</label>
            <input
              aria-label="Város"
              autoComplete="address-level2"
              defaultValue={address?.city ?? ''}
              id="city"
              name="city"
              placeholder="pl. Budapest"
              required
              type="text"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="zoneCode">Megye</label>
            <input
              aria-label="Megye"
              autoComplete="address-level1"
              defaultValue={address?.zoneCode ?? ''}
              id="zoneCode"
              name="zoneCode"
              placeholder="Megye (opcionális)"
              type="text"
            />
          </div>
          <div className="form-group">
            <label htmlFor="territoryCode">Országkód *</label>
            <input
              aria-label="Országkód"
              autoComplete="country"
              defaultValue={address?.territoryCode ?? ''}
              id="territoryCode"
              name="territoryCode"
              placeholder="HU"
              required
              type="text"
              maxLength={2}
            />
          </div>
        </div>

        <div className="checkbox-row">
          <input
            defaultChecked={isDefaultAddress}
            id="defaultAddress"
            name="defaultAddress"
            type="checkbox"
          />
          <label htmlFor="defaultAddress">Alapértelmezett cím</label>
        </div>

        {error && (
          <div className="account-error">{error}</div>
        )}

        {children({
          stateForMethod: (method) => (formMethod === method ? state : 'idle'),
        })}
      </fieldset>
    </Form>
  );
}
