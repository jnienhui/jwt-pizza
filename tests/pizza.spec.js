import { test, expect } from 'playwright-test-coverage';

test('pages', async ({ page }) => {
  await page.goto('/');

  expect(await page.title()).toBe('JWT Pizza');

  await page.getByRole('link', { name: 'About' }).click();
  await expect(page.getByRole('heading', { name: 'The secret sauce'})).toBeVisible();

  await page.getByRole('link', { name: 'History' }).click();
  await expect(page.getByRole('heading', { name: 'Mama Rucci, my my'})).toBeVisible();

  await page.goto('/non-existing-page');
  await expect(page.locator('h2')).toContainText('Oops');

  await page.goto('/docs');
  await expect(page.getByRole('heading', { name: 'JWT Pizza API' })).toBeVisible();
  await expect(page.getByText('Login existing user')).toBeVisible();
});

test('purchase with login', async ({ page }) => {
  await page.route('*/**/api/order/menu', async (route) => {
    const menuRes = [
      { id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' },
      { id: 2, title: 'Pepperoni', image: 'pizza2.png', price: 0.0042, description: 'Spicy treat' },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: menuRes });
  });

  await page.route('*/**/api/franchise', async (route) => {
    const franchiseRes = [
      {
        id: 2,
        name: 'LotaPizza',
        stores: [
          { id: 4, name: 'Lehi' },
          { id: 5, name: 'Springville' },
          { id: 6, name: 'American Fork' },
        ],
      },
      { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork' }] },
      { id: 4, name: 'topSpot', stores: [] },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: franchiseRes });
  });

  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'd@jwt.com', password: 'a' };
    const loginRes = { user: { id: 3, name: 'Kai Chen', email: 'd@jwt.com', roles: [{ role: 'diner' }] }, token: 'abcdef' };
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });

  await page.route('*/**/api/order', async (route) => {
    const orderReq = {
      items: [
        { menuId: 1, description: 'Veggie', price: 0.0038 },
        { menuId: 2, description: 'Pepperoni', price: 0.0042 },
      ],
      storeId: '4',
      franchiseId: 2,
    };
    const orderRes = {
      order: {
        items: [
          { menuId: 1, description: 'Veggie', price: 0.0038 },
          { menuId: 2, description: 'Pepperoni', price: 0.0042 },
        ],
        storeId: '4',
        franchiseId: 2,
        id: 23,
      },
      jwt: 'eyJpYXQ',
    };
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toMatchObject(orderReq);
    await route.fulfill({ json: orderRes });
  });

  await page.goto('/');

  // Go to order page
  await page.getByRole('button', { name: 'Order now' }).click();

  // Create order
  await expect(page.locator('h2')).toContainText('Awesome is a click away');
  await page.getByRole('combobox').selectOption('4');
  await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
  await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
  await expect(page.locator('form')).toContainText('Selected pizzas: 2');
  await page.getByRole('button', { name: 'Checkout' }).click();

  // Login
  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  // Pay
  await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
  await expect(page.locator('tbody')).toContainText('Veggie');
  await expect(page.locator('tbody')).toContainText('Pepperoni');
  await expect(page.locator('tfoot')).toContainText('0.008 ₿');
  await page.getByRole('button', { name: 'Pay now' }).click();

  // Check balance
  await expect(page.getByText('0.008')).toBeVisible();
});

test('register and logout', async ({ page }) => {
  await page.route('*/**/api/auth', async (route) => {
    const request = route.request();
    const requestBody = request.postDataJSON();

    if (requestBody && requestBody.email === 'register@jwt.com') {
      const registerReq = { email: 'register@jwt.com', password: 'a', name: 'Register' };
      const registerRes = { user: { id: 4, name: 'Register', email: 'register@jwt.com', roles: [{ role: 'diner' }] }, token: 'abcdef' };
      expect(request.method()).toBe('POST');
      expect(requestBody).toMatchObject(registerReq);
      await route.fulfill({ json: registerRes });
    } else {
      const logoutRes = { user: null, token: null };
      expect(request.method()).toBe('DELETE');
      await route.fulfill({ json: logoutRes });
    }
  });

  await page.goto('http://localhost:5173/');

  // Register
  await page.getByRole('link', { name: 'Register' }).click();
  await page.getByPlaceholder('Name').click();
  await page.getByPlaceholder('Name').fill('Register');
  await page.getByPlaceholder('Name').press('Tab');
  await page.getByPlaceholder('Email address').fill('register@jwt.com');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();

  // Logout
  await page.getByRole('link', { name: 'Logout' }).click();
  await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
});

test('diner dashboard', async ({ page }) => {
  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'd@jwt.com', password: 'a' };
    const loginRes = { user: { id: 3, name: 'Kai Chen', email: 'd@jwt.com', roles: [{ role: 'diner' }] }, token: 'abcdef' };
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });

  await page.route('*/**/api/order', async (route) => {
    const orderRes = {
      dinerId: 1,
      orders: [
        {
          items: [
            { menuId: 1, description: 'Veggie', price: 0.0038 },
            { menuId: 2, description: 'Pepperoni', price: 0.0042 },
          ],
          storeId: '4',
          franchiseId: 2,
          id: 12,
          page: 1,
          date: '2024-09-20T11:59:54.000Z',
        }
      ],
    }
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: orderRes });
  });

  await page.goto('http://localhost:5173/');

  // Login
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();

  await page.getByRole('link', { name: 'KC', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your pizza kitchen' })).toBeVisible();
  await expect(page.getByText('Here is your history of all the good times.')).toBeVisible();
});

test('franchise dashboard', async ({ page }) => {
  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'f@jwt.com', password: 'a' };
    const loginRes = { user: { id: 4, name: 'Marcos', email: 'f@jwt.com', roles: [{ role: 'franchisee' }] }, token: 'abcdef' };
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });

  await page.route('*/**/api/franchise/4', async (route) => {
    const res = { id: 2, name: 'pizzaPocket', admins: [{ id: 4, name: 'Franchisee', email: 'f@jwt.com' }], stores: [{ id: 3, name: 'SLC', totalRevenue: 0 }] };
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: res });
  });

  await page.goto('http://localhost:5173/');

  await page.getByLabel('Global').getByRole('link', { name: 'Franchise' }).click();
  await page.getByRole('link', { name: 'login', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill('f@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();
});

test('admin dashboard', async ({ page }) => {
  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'admin@jwt.com', password: 'a' };
    const loginRes = { user: { id: 1, name: 'Admin', email: 'admin@jwt.com', roles: [{ role: 'admin' }] }, token: 'abcdef' };
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });

  await page.route('*/**/api/franchise', async (route) => {
    const request = route.request();
    const requestBody = request.postDataJSON();

    if (requestBody && requestBody.name === 'Marcos') {
      const createReq = { name: 'Marcos', admins: [{ email: "admin@jwt.com" }] };
      const createRes = { id: 3, name: 'Marcos', admins: [{ id: 4, name: 'Admin', email: 'admin@jwt.com' }] };
      expect(route.request().method()).toBe('POST');
      expect(route.request().postDataJSON()).toMatchObject(createReq);
      await route.fulfill({ json: createRes });
    } else {
      const franchiseRes = [{ id: 2, name: 'pizzaPocket', admins: [{ id: 4, name: 'Marcos', email: 'f@jwt.com' }], stores: [{ id: 4, name: 'SLC', totalRevenue: 0 }] }];
      expect(route.request().method()).toBe('GET');
      await route.fulfill({ json: franchiseRes });
    }
  });

  await page.route('*/**/api/franchise/2/store/4', async (route) => {
    const res = { message: 'store deleted'};
    expect(route.request().method()).toBe('DELETE');
    await route.fulfill({ json: res });
  });

  await page.route('*/**/api/franchise/2', async (route) => {
    const res = { message: 'franchise deleted'};
    expect(route.request().method()).toBe('DELETE');
    await route.fulfill({ json: res });
  });

  await page.goto('http://localhost:5173/');

  // Login
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill('admin@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();

  await page.getByRole('link', { name: 'Admin', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Mama Ricci\'s kitchen' })).toBeVisible();

  await page.getByRole('button', { name: 'Add franchise' }).click();
  await page.getByPlaceholder('franchise name').click();
  await page.getByPlaceholder('franchise name').fill('Marcos');
  await page.getByPlaceholder('franchise name').press('Tab');
  await page.getByPlaceholder('franchisee admin email').fill('admin@jwt.com');
  await page.getByRole('button', { name: 'Create' }).click();

  await page.getByRole('row', { name: 'SLC 0 ₿ Close' }).getByRole('button').click();
  await page.getByRole('button', { name: 'Close' }).click();

  // Delete a franchise
  await page.getByRole('row', { name: 'pizzaPocket Marcos Close' }).getByRole('button').click();
  await page.getByRole('button', { name: 'Close' }).click();
});