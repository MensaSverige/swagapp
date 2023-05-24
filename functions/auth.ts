interface Env {
  SECRET_KEY: string;
  TEST_MODE?: string; // 'true', 'false' or undefined
}

interface LoginRequestBody {
  username: string;
  password: string;
  test?: boolean;
}

const successResponse = (
  username: string,
  name: string,
  token: string,
  test?: boolean,
) => {
  return new Response(
    JSON.stringify({
      username,
      name,
      token,
      test,
    }),
    {
      headers: {'Content-Type': 'application/json'},
    },
  );
};

const errorResponse = (message: string, code: number) => {
  return new Response(
    JSON.stringify({
      message,
    }),
    {
      headers: {'Content-Type': 'application/json'},
      status: code,
    },
  );
};

export const onRequest: PagesFunction<Env> = async context => {
  const startPageURL = 'https://medlem.mensa.se/';
  const loginPageURL = 'https://medlem.mensa.se/login/';

  let requestBody: LoginRequestBody;
  try {
    // Parse the incoming request for username and password.
    requestBody = await context.request.json();
  } catch (error) {
    return errorResponse('Invalid request body', 400);
  }

  // Check if login request body is in test mode
  if (requestBody.test) {
    if (context.env.TEST_MODE !== 'true') {
      return errorResponse('Test mode is not enabled', 400);
    }

    const hmac = await createHMAC(
      context.env.SECRET_KEY,
      requestBody.username,
      'Test User',
      true, // Create a test token that other endpoints will use to respond with dummy data
    );

    return successResponse(requestBody.username, 'Test User', hmac, true);
  }

  // Make a GET request to the login page and parse the HTML.
  const startPageResponse = await fetch(startPageURL, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36',
    },
  });
  const startPageHTML = await startPageResponse.text();

  // Find the CSRF token from the HTML.
  const csrfToken = parseHtml(
    startPageHTML,
    '<input type="hidden" name="csrfKey" value="',
    '"',
  );

  // Create the form data for the login request.
  const loginFormData = new URLSearchParams();
  loginFormData.append('login__standard_submitted', '1');
  loginFormData.append('csrfKey', csrfToken);
  loginFormData.append('auth', requestBody.username);
  loginFormData.append('password', requestBody.password);
  loginFormData.append('remember_me', '0');
  loginFormData.append('remember_me_checkbox', '1');

  // Make the login POST request.
  const loginResponse = await fetch(loginPageURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: startPageResponse.headers.get('Set-Cookie') || '',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      Referer: startPageURL,
      Origin: startPageURL,
    },
    body: loginFormData.toString(),
  });

  if (loginResponse.status !== 200) {
    console.log('Login failed', loginResponse);
    return errorResponse('Login failed', 401);
  }

  // Otherwise, parse the returned HTML for the user's name.
  const userPageHTML = await loginResponse.text();

  // Find the user's name from the HTML.
  const userName = parseHtml(
    userPageHTML,
    '<a href="#elUserLink_menu" id="elUserLink" data-ipsmenu>',
    '<',
  );

  const hmac = await createHMAC(
    context.env.SECRET_KEY,
    requestBody.username,
    userName,
  );

  return successResponse(requestBody.username, userName, hmac);
};

function parseHtml(html: string, start: string, end: string) {
  const csrfTokenStart = html.indexOf(start) + start.length;
  const csrfTokenEnd = html.indexOf(end, csrfTokenStart);
  const result = html.substring(csrfTokenStart, csrfTokenEnd);

  return result;
}

async function createHMAC(
  secret: string,
  username: string,
  name: string,
  test: boolean = false,
) {
  const encoder = new TextEncoder();

  // Create payload
  const payload = {
    username,
    name,
    test,
    exp: Math.floor(Date.now() / 1000) + 60,
  };
  const payloadString = JSON.stringify(payload);
  const payloadBytes = encoder.encode(payloadString);
  const payloadBase64 = btoa(payloadString);

  // Import the HMAC key
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    {
      name: 'HMAC',
      hash: 'SHA-256',
    },
    false,
    ['sign'],
  );

  // Generate the HMAC
  const signature = await crypto.subtle.sign('HMAC', key, payloadBytes);

  const signatureArray = Array.from(new Uint8Array(signature));

  // Convert the signature to Base64
  const signatureBase64 = btoa(String.fromCharCode.apply(null, signatureArray));

  // Create the final token
  const token = `${payloadBase64}.${signatureBase64}`;

  return token;
}
