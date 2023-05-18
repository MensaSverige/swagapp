import JSDOM from 'jsdom';

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
  const dom = new JSDOM(loginPageHTML);
  const document = dom.window.document;

  // Find the CSRF token and other hidden form values.
  const csrfToken = document.querySelector('input[name="csrfKey"]').value;
  const ref = document.querySelector('input[name="ref"]').value;
  const MAX_FILE_SIZE = document.querySelector(
    'input[name="MAX_FILE_SIZE"]',
  ).value;
  const plupload = document.querySelector('input[name="plupload"]').value;

  // Create the form data for the login request.
  const loginFormData = new URLSearchParams();
  loginFormData.append('login__standard_submitted', '1');
  loginFormData.append('csrfKey', csrfToken);
  loginFormData.append('ref', ref);
  loginFormData.append('MAX_FILE_SIZE', MAX_FILE_SIZE);
  loginFormData.append('plupload', plupload);
  loginFormData.append('auth', requestBody.username);
  loginFormData.append('password', requestBody.password);
  loginFormData.append('remember_me', '0');
  loginFormData.append('remember_me_checkbox', '1');

  // Make the login POST request.
  const loginResponse = await fetch(loginPageURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      // Include any other necessary headers, like cookies from the GET request.
    },
    body: loginFormData.toString(),
  });

  // Check for a 301 redirect. If there isn't one, the login failed.
  if (loginResponse.status !== 301) {
    return new Response('Login failed', {status: 401});
  }

  // Otherwise, parse the returned HTML for the user's name.
  const userPageHTML = await loginResponse.text();
  const userDom = new JSDOM(userPageHTML);
  const userDocument = userDom.window.document;
  const userName = userDocument.querySelector('#elUserLink').textContent.trim();

  return new Response(`Hello, ${userName}!`, {
    headers: {'Content-Type': 'text/plain'},
  });
};
