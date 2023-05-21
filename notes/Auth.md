## Flöde

1. Användaren fyller i användarnamn och lösenord i appen och postar till edge-funktionen på Cloudflare
2. Cloudflare loggar in på mensa.se och hämtar namnet på användaren om det funkade
3. Cloudflare genererar HMAC och returnerar till användaren tillsammans med användarens riktiga namn.
4. Appen känner sig nu inloggad.
5. Appen använder HMAC vid framtida requests till cloudflare så cloudflare vet vilken användare det är och att den är inloggad.

## Att göra

- Visa felmeddelande
- Verifiera signerad token
- Visa inloggad vy 

## Håller på med nu

- Generera HMAC