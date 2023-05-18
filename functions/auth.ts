interface Env {
  KV: KVNamespace;
}

interface LoginRequestBody {
  username: string;
  password: string;
}

export const onRequest: PagesFunction<Env> = async context => {
  const loginPageURL = 'https://medlem.mensa.se/login/';

  // Parse the incoming request for username and password.
  const requestBody: LoginRequestBody = await context.request.json();

  // Make a GET request to the login page and parse the HTML.
  const loginPageResponse = await fetch(loginPageURL);
  const loginPageHTML = await loginPageResponse.text();

  // Find the CSRF token from the HTML.
  const csrfTokenStart =
    loginPageHTML.indexOf('name="csrfKey" value="') +
    'name="csrfKey" value="'.length;
  const csrfTokenEnd = loginPageHTML.indexOf('"', csrfTokenStart);
  const csrfToken = loginPageHTML.substring(csrfTokenStart, csrfTokenEnd);

  // Create the form data for the login request.
  const loginFormData = new URLSearchParams();
  loginFormData.append('login__standard_submitted', '1');
  loginFormData.append('csrfKey', csrfToken);
  loginFormData.append('auth', requestBody.username);
  loginFormData.append('password', requestBody.password);
  loginFormData.append('remember_me', '0');
  loginFormData.append('remember_me_checkbox', '1');

  console.log('loginFormData', loginFormData.toString());

  // Make the login POST request.
  const loginResponse = await fetch(loginPageURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      // Include any other necessary headers, like cookies from the GET request.
    },
    body: loginFormData.toString(),
  });

  console.log('loginResponse', loginResponse.status, loginResponse.headers);

  // Check for a 301 redirect. If there isn't one, the login failed.
  if (loginResponse.status !== 301) {
    console.log('Login failed', loginResponse);
    return new Response('Login failed', {status: 401});
  }

  // Otherwise, parse the returned HTML for the user's name.
  const userPageHTML = await loginResponse.text();

  // Find the user's name from the HTML.
  const userNameStart =
    userPageHTML.indexOf(
      '<a href="#elUserLink_menu" id="elUserLink" data-ipsmenu>',
    ) + '<a href="#elUserLink_menu" id="elUserLink" data-ipsmenu>'.length;
  const userNameEnd = userPageHTML.indexOf('<', userNameStart);
  const userName = userPageHTML.substring(userNameStart, userNameEnd).trim();

  return new Response(`Hello, ${userName}!`, {
    headers: {'Content-Type': 'text/plain'},
  });
};
