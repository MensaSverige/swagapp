## Flöde, autentisering

1. Användaren fyller i användarnamn och lösenord i appen och postar till /auth, just nu https://swag.mikael.green/auth
2. Backend loggar in på mensa.se och hämtar namnet på användaren om det funkade
3. Backend genererar JWT och returnerar till användaren tillsammans med användarens riktiga namn.
4. Appen känner sig nu inloggad.
5. Appen använder JWT vid framtida requests till backend så backend vet vilken användare det är och att den är inloggad.

## Att göra

- Events
- Visa folk på kartan
- Visa events på kartan

## Håller på med nu

- Micke: Events
- Amy: Folk på kartan
