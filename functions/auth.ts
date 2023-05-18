interface Env {
  KV: KVNamespace;
}

interface LoginRequestBody {
  username: string;
  password: string;
}

export const onRequest: PagesFunction<Env> = async context => {
  const startPageURL = 'https://medlem.mensa.se/';
  const loginPageURL = 'https://medlem.mensa.se/login/';

  // Parse the incoming request for username and password.
  const requestBody: LoginRequestBody = await context.request.json();

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
    return new Response('Login failed', {status: 401});
  }

  // Otherwise, parse the returned HTML for the user's name.
  const userPageHTML = await loginResponse.text();

  // Find the user's name from the HTML.
  const userName = parseHtml(
    userPageHTML,
    '<a href="#elUserLink_menu" id="elUserLink" data-ipsmenu>',
    '<',
  );

  return new Response(`Hello, ${userName}!`, {
    headers: {'Content-Type': 'text/plain'},
  });
};
function parseHtml(html: string, start: string, end: string) {
  const csrfTokenStart = html.indexOf(start) + start.length;
  const csrfTokenEnd = html.indexOf(end, csrfTokenStart);
  const result = html.substring(csrfTokenStart, csrfTokenEnd);

  return result;
}
