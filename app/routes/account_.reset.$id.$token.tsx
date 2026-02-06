import {Form, useActionData, useNavigation, redirect} from 'react-router';
import type {Route} from './+types/account_.reset.$id.$token';

const CUSTOMER_RESET_MUTATION = `#graphql
  mutation customerReset($id: ID!, $input: CustomerResetInput!) {
    customerReset(id: $id, input: $input) {
      customer {
        id
        email
      }
      customerErrors {
        field
        message
      }
    }
  }
` as const;

export async function action({
  request,
  params,
  context,
}: Route.ActionArgs) {
  const {id, token} = params;
  const formData = await request.formData();
  const password = formData.get('password') as string;
  const passwordConfirm = formData.get('passwordConfirm') as string;

  if (password !== passwordConfirm) {
    return {error: 'A két jelszó nem egyezik meg.'};
  }

  const storeDomain = context.env.PUBLIC_STORE_DOMAIN;
  const accessToken = context.env.PUBLIC_STOREFRONT_API_TOKEN;
  const apiVersion = context.env.STOREFRONT_API_VERSION || '2025-01';
  const customerId = `gid://shopify/Customer/${id}`;

  const response = await fetch(
    `https://${storeDomain}/api/${apiVersion}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'X-Shopify-Storefront-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: CUSTOMER_RESET_MUTATION,
        variables: {
          id: customerId,
          input: {
            resetToken: token,
            password,
          },
        },
      }),
    },
  );

  const json = (await response.json()) as {
    data?: {
      customerReset?: {
        customer?: {id: string; email: string} | null;
        customerErrors: {field: string; message: string}[];
      };
    };
    errors?: {message: string}[];
  };

  if (json.errors?.length) {
    return {error: json.errors[0].message};
  }

  const resetErrors =
    json.data?.customerReset?.customerErrors ?? [];
  if (resetErrors.length > 0) {
    return {error: resetErrors[0].message};
  }

  if (!json.data?.customerReset?.customer) {
    return {error: 'A jelszó-visszaállítás lejárt vagy érvénytelen.'};
  }

  return redirect('/account/login');
}

export default function ResetPasswordPage() {
  const actionData = useActionData<{error?: string}>();
  const {state} = useNavigation();

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-brand">Ars Mosoris</h1>
        <h2 className="login-heading">Jelszó beállítása</h2>
        <p className="login-sub">Válasszunk egy új jelszót a fiókodhoz</p>

        {actionData?.error && (
          <div className="account-error">{actionData.error}</div>
        )}

        <Form method="POST" className="reset-form">
          <div className="form-group">
            <label htmlFor="password">Új jelszó</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Legalább 5 karakter"
              minLength={5}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="passwordConfirm">Jelszó megerősítése</label>
            <input
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              autoComplete="new-password"
              placeholder="Ismételjük meg a jelszót"
              minLength={5}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary login-btn"
            disabled={state !== 'idle'}
          >
            {state !== 'idle' ? 'Beállítás...' : 'Jelszó beállítása'}
          </button>
        </Form>
      </div>
    </div>
  );
}
