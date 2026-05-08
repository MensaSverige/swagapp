export interface GuideSubsection {
    title: string;
    body: string;
    image?: number;
}

export interface GuideSection {
    id: string;
    title: string;
    icon: string;
    subsections: GuideSubsection[];
}

export const SWAG_GUIDE_SECTIONS: GuideSection[] = [
    {
        id: 'fore_swag',
        title: 'Före SWAG',
        icon: 'event',
        subsections: [
            {
                title: 'SWAG på Mensas hemsida',
                body: 'Läs igenom informationen på hemsidan i lugn och ro, inte bara när du anmäler dig. Gå in igen efteråt och läs noga vad som står, inte bara i schemat eller rubrikerna.\n\nVar hittar man årsträffsfliken då? Jo, när du är inloggad på mensa.se går du in på länken för Årsträffen, och du kan även gå in på anmälningssidan där man bokar de olika aktiviteterna och läsa varje beskrivning. Där kommer även både länk till den speciella Mensa Sverige-appen och en karta för årsträffen att finnas.\n\nTips: Titta en extra gång precis innan du åker, för det kan bli ändringar och roliga tillägg.',
            },
            {
                title: 'Planera ditt schema',
                body: 'Läs igenom listan med aktiviteter en extra gång, men tänk på att lämna vissa luckor i ditt schema, då du säkert kommer vilja hinna prata med folk också eller kanske spela ett spel eller gå till ditt rum och ladda lite energi osv.\n\nOm ditt schema inte är helt fullt före träffen går det utmärkt att fylla på med aktiviteter och föreläsningar på plats.\n\nTips: Kom ihåg att det kommer att finnas massor av spännande människor att lära känna, så åk med ett öppet sinne!',
            },
            {
                title: 'Lokala träffar',
                body: 'Det är alltid trevligt att gå på någon lokal träff före årsträffen, dels för att kanske lära känna någon mer som ska åka, dels för att träffa någon som varit på årsträff tidigare och få några personliga tips.\n\nMålet är att varje region ska ha en informationsträff inför årsträffen, just för att nya medlemmar ska kunna ställa frågor och kanske få se lite bilder från hur det varit tidigare.\n\nTips: Titta i tidigare års Legatus Mensae med årsträffsreportage.',
            },
            {
                title: 'Facebookgrupper',
                body: 'Om du har Facebookkonto så gå med i den grupp som heter "Mensa SWAG (aktuellt år)-(orten)", exempelvis "Mensa SWAG 2026 - Jönköping" för aktuell information.\n\nDet finns också många lokala Facebook-grupper där man ibland samordnar resan till träffen med tåg eller bil. (Bäst sätt att resa varierar, men notera att lokalföreningarna ofta ger resebidrag till medlemmar som närvarar på årsmötet.) Vissa grupper som drivs av medlemmar, t ex singelgruppen SxSIG och Firehouse, bestämmer ibland träff under årsträffen för att ses IRL och inte bara på nätet.\n\nTips: Mensas stora Facebookgrupp heter "Mensa Sverige: grupp" och är den grupp föreningen har utöver de tillfälliga årsträffsgrupperna. I Mensa Sverige-appen kan man hitta aktuell information då den kan uppdateras under träffen med aktiviteter som medlemmarna arrangerar spontant.',
            },
            {
                title: 'Packning',
                body: 'Som vid alla resor kan det vara svårt att beräkna vad man kommer att behöva med sig, men bekväma kläder och bekväma skor är ett tips. Dessutom kan man vilja ha en uppsättning lite finare kläder till lördagens festmiddag – men du kommer att märka att det finns alla klädstilar från T-shirts med tryck till paljettklänningar. Vissa år hålls maskerad som alternativ till festmiddagen.\n\nOm du har något favoritspel kan du packa det, men det är många som tar med sig spel så det brukar finnas mycket att välja på i spelrummet ändå, och kan ju vara ett tillfälle att testa något nytt.\n\nTips: Mensabutiken brukar ha ett urval av saker på plats, så man kanske vill ha en väska med lite extra plats för sådant. Det är bra att ta med sig Legatus med valbilagan inför årsmötet. Annars kan man packa som för vilken tredagarskonferens som helst, med kläder efter väder och kanske badkläder.',
            },
        ],
    },
    {
        id: 'aktiviteter',
        title: 'Aktiviteter och föredrag',
        icon: 'event',
        subsections: [
            {
                title: 'Hur väljer man?',
                body: 'I programmet finns många punkter för olika intressen – alltifrån relationer, teknik, mat-/dryckesprovningar eller andra djupare specialämnen. För er som är nya i föreningen eller på er första årsträff finns en del speciella aktiviteter: bl a träffarna "Ny på SWAG" och "Varulv för nybörjare" (ett spel där man måste vara minst åtta personer vilket kan vara svårt att få till om man inte känner andra).\n\nÅterkommande aktiviteter är pokerturneringen på torsdag kväll och på fredagen både musIQuiz och OpenStage (en talangshow, inte en tävling), samt lagtävlingen Årsträffsjakten som pågår under flera dagar. Dessa bör man förboka sig på för att vara säker på att få delta (man kan dock vara publik på OpenStage även spontant). Det finns även aktiviteter speciellt för unga medlemmar.\n\nIbland är det föredrag om Mensa, Nordiska Mensastiftelsen, och GCP och möten för olika arbetsgrupper. Lördagens årsmöte är en central punkt som brukar föregås av ärendeforum på fredagen, och ni är även välkomna till styrelsemötet på söndag förmiddag. Om du har någon specialkunskap kan du själv hålla en föreläsning – kontakta programansvarig.\n\nTips: Hur man anmäler sig står på hemsidan, men sedan tillkommer aktiviteter som inte kräver föranmälan så fyll inte schemat helt och hållet!',
            },
            {
                title: 'Om det är fullbokat?',
                body: 'Misströsta inte, ställ dig på kö till aktiviteten, anmäl att du är intresserad till ansvariga så kanske de kan ordna fler platser och kolla anslagstavlan (folk kan få förhinder eller dubbelbokat sig).\n\nAnnars finns det alltid andra aktiviteter/föreläsningar att ansluta till! Varför inte utmana dig själv genom att pröva något som du inte vet att du är intresserad av eller som är utanför din bekvämlighetszon? Du är ju bland (blivande) vänner!',
            },
            {
                title: 'Ändringar',
                body: 'Om du märker att du inte kommer hinna gå på en aktivitet så är det bra om du lämnar din plats till någon annan som kan vilja använda den – meddela på anslagstavlan eller kolla via årsträffssidan på Facebook eller säg det direkt till den ansvariga.',
            },
        ],
    },
    {
        id: 'boende',
        title: 'Boende',
        icon: 'hotel',
        subsections: [
            {
                title: '',
                body: 'Målet är att det ska finnas boende i alla prisklasser vid årsträffarna, och oftast är det billigare att dela rum med någon/några andra deltagare. Detta brukar samordnas i trådar i den officiella Facebook-gruppen: Lägg själv upp en tråd och efterlys önskat sällskap och/eller kolla om det finns någon som söker rumskamrat.\n\nOm man inte har FB kan man även kolla via sina lokala träffar och kontakter om någon ska på årsträffen och vill dela rum. Glöm inte att vara tydlig med eventuella allergier, sovvanor, snarkande, etc så blir det trevligare för alla.\n\nMånga har under årens lopp fått nya vänner genom att dela rum med mensaner de aldrig träffat före årsträffen!',
            },
        ],
    },
    {
        id: 'ankomst',
        title: 'Vid ankomsten till SWAG',
        icon: 'login',
        subsections: [
            {
                title: 'Vår egen reception',
                body: 'Utöver hotellreceptionen där man checkar in på sitt hotell ("huvudhotellet" eller annat), så har föreningen en egen receptionsdisk på ett väl markerat ställe (fråga om du är osäker). Där finns det medlemmar som bemannar och ser till att du checkar in, får en namnbricka (med nyckelband att hänga runt halsen så folk ser att du hör till sällskapet), eventuella biljetter till aktiviteter, osv.\n\nDet finns oftast klistermärken man kan sätta på namnbrickan för att visa om man är ny eller erfaren årsträffsbesökare, om man är ansiktsblind och om man är öppen för flirt. Märkena är frivilliga men ett enkelt sätt att signalera att man är öppen för kontakt (men glöm inte att ett leende och ett hej är en väldigt bra början till en vänskap!).\n\nVi brukar ha ett par ljusblåa rollups/flaggor med Mensas logotyp där man kan komma överens om att ses för att gå och äta tillsammans, eller för att gå på promenad eller liknande. Kolla med mensareceptionen om du vill anordna något och behöver säga en samlingsplats, de vet var det är lämpligt just i år.\n\nIbland finns en anslagstavla/whiteboard där sista-minuten-ändringar och lediga platser till föreläsningar kan annonseras. Många kommer till träffen ett par dagar tidigare, men den festliga invigningsceremonin sker när träffen officiellt startar, och då försöker så många som möjligt samlas. På invigningen delas Mensapriset ut, och ofta tas ett gruppfoto.',
            },
            {
                title: 'Orientering i lokalerna',
                body: 'När du checkat in och lagt ifrån dig dina saker rekommenderas att gå runt i lokalerna på hotellet/anläggningarna och se vad som finns. Ibland kommer deltagare sista dagen och säger förvånat "jag visste inte att det fanns ett spelrum här också!" och det är tråkigt att missa något man ville göra. \n\nTips: för en del aktiviteter används lokaler utanför själva hotellanläggningarna, och en del aktiviteter är utomhus, men då brukar det finnas möjlighet att samlas vid en träffpunkt vid entrén/receptionen och ta sällskap till dessa platser. Använd jourtelefonen till receptionen vid behov eller kolla i Mensa Sverige-appen eller Facebookgruppen eller någon av de inofficiella årsträffschattarna.',
            },
        ],
    },
    {
        id: 'under_swag',
        title: 'Under SWAG',
        icon: 'groups',
        subsections: [
            {
                title: 'Samlingspunkter',
                body: 'Vid årsträffsreceptionen finns några ställen som är speciellt utmärkta och de är bra platser att bestämma träff på. Där är det också tänkt att de som vill ha sällskap till en måltid ska kunna ses. Håll utkik efter ljusblå rolluper eller flaggor med Mensas logotyp!\n\nOm du vill ha sällskap för en stadsvandring, joggingtur, fika på stan eller liknande kan du själv lägga upp en efterlysning och föreslå att ses vid någon av dessa! Tänk på att det finns många andra som också söker sällskap, men att det kan vara svårt att se vilka som är blyga och inte törs ta kontakt respektive vilka som är introverta och inte vill bli störda, så visa gärna om du vill ha sällskap.\n\nSom tidigare sagts, ett leende och ett hej kan ta dig ganska långt – med namnskylten på dig signalerar du ju att du är en av deltagarna. Om någon missar att säga hej tillbaka kan det bero på att de är i djupa tankar, så prova att säga hej till någon annan istället. Snart nog så känner du igen några stycken som det känns tryggt att ansluta till!\n\nKom ihåg att det finns folk som är ansiktsblinda och det är många att hålla reda på, så säg gärna ditt namn även om ni setts förut.',
            },
            {
                title: 'Visa ditt intresse!',
                body: 'Än en gång: Årsträffen blir vad du gör den till. Ha inte för höga förväntningar utan kom med ett öppet sinne, och se till att du ger dig själv chansen att lära känna några nya människor – många kan vara olika dig själv, men det finns säkert några som du känner en oväntad samhörighet med.\n\nFörsta steget är att presentera dig själv och att våga ansluta till människor du inte träffat förut: alla är ju på årsträffen för att de vill umgås med andra mensaner och lära sig nya saker. Glöm inte att vara nyfiken och att lyssna!',
            },
            {
                title: 'Facebookgrupper',
                body: 'Det brukar finnas någon årsträffstråd i de flesta mensarelaterade grupper på Facebook, men tänk på att inte lägga upp bilder utan godkännande från alla som är med på bilderna! Vissa av våra medlemmar är ju hemliga med sitt medlemskap eller vill inte synas på bild. Fler och fler blir öppna med medlemskapet, men om du vill ta bilder bör du fråga om det är ok att dela i en viss grupp.\n\nDet finns även en Facebookgrupp som heter MiS – Rum 107 som man ibland hör talas om. Det är helt enkelt en privat festgrupp. Gruppen samlar folk som är mer partysugna och ibland samlas i någons rum, så själva gruppnamnet stämmer alltså inte med hotellets rumsnumrering. Detta är inget officiellt mensaevenemang men det kan vara bra att veta vad det är om folk pratar om "rum 107" så man inte känner sig utanför.\n\nVi rekommenderar de festlokaler som finns i programmet!',
            },
            {
                title: 'Uppförande under årsträffen',
                body: 'Allmänt bör vi tänka på att alla vi som är på årsträffen är representanter för Mensa Sverige och kan vara första kontakten med Mensa för dem vi möter. Vi förväntas visa respekt både för varandra och för folk runt omkring oss. Vi bör även följa de regler som finns på hotellen och de övriga lokaler vi håller till i.\n\nTips: Är du osäker på om något är ok, fråga först.',
            },
        ],
    },
    {
        id: 'buddies',
        title: 'SWAG Buddies',
        icon: 'favorite',
        subsections: [
            {
                title: '',
                body: 'Om du skulle känna dig lite vilsen kan du även spana efter SWAG Buddies som bär utstickande cerise band och är särskilt beredda på att hjälpa dig finna din plats i tillvaron. Prata gärna med dem om du saknar sällskap eller inte vet vad du ska göra härnäst!',
            },
        ],
    },
    {
        id: 'maltider',
        title: 'Måltiderna',
        icon: 'restaurant',
        subsections: [
            {
                title: 'Var hittar man sällskap?',
                body: 'Just vid måltiderna kan det vara lätt att känna sig osäker på vilket bord det är ok att sätta sig vid. Generellt gäller att det är ok att sätta sig där man ser en ledig stol, men man får komma ihåg att vissa av de andra deltagarna kan vara väldigt fokuserade när de pratar om något, så om de inte säger hej direkt och hälsar dig välkommen så betyder det inte att du inte är välkommen. Hälsa när det blir en lucka i samtalet och presentera dig så brukar det lösa sig.\n\nMan kan även hålla utkik efter erfarna deltagare och funktionärer som gärna hjälper de nya hitta lunchsällskap eller visar var en föreläsning är.\n\nI SWAG-gruppen på Facebook samt på anslagstavlan i receptionen kommer även samlingstider och platser för lunch-/middagssällskap att utlysas. Kolla i Mensa Sverige-appen är också ett tips.',
            },
            {
                title: 'Hur ska man klä sig?',
                body: 'Klä dig så att du känner dig bekväm, det brukar vara det bästa! T-shirt och jeans går utmärkt, eller klänning, eller kostym, eller om det blir en picknick i någon park kanske det passar med shorts och linne om det är varmt. Ingen speciell klädkod alltså. Förutom om man vill delta vid festmiddagen – då passar kanske inte shorts, men det brukar vara flera som bär kilt.',
            },
            {
                title: 'Vad gäller för lördagens middagar?',
                body: 'På lördagen hålls en eller flera middagar som bokas vid anmälan. Det brukar finnas en middag som är lite finare/festligare. Vid denna middag brukar det vara en trerättersmeny och underhållning. De som är med på festmiddagen klär ofta upp sig lite extra.\n\nDet brukar även finnas minst en mindre formell middag, ibland maskerad eller med något tema. Hur många olika middagsalternativ som finns varierar från år till år beroende på förutsättningarna. Läs vilka alternativ som finns på årets bokningssida. Ofta arrangeras också mindre middagar av medlemmar som inte vill gå på de större middagarna.\n\nFör att man ska få möjlighet att umgås och träffa nya vänner sker ibland bordsplacering via lottning på någon/några av middagarna. Det brukar också finnas tid före middagarna för att ge deltagarna chans att göra sig iordning och/eller mingla med andra deltagare. Spontana evenemang för att hjälpa varandra med hår, smink osv brukar dyka upp.\n\nEfter middagarna vidtar en eller flera gemensamma efterfester. Oavsett vilken middag du väljer finns det efterfest där alla är välkomna. Passa på att disco-dansa halva natten! Givetvis finns det även möjlighet att bara sitta och umgås i baren eller besöka spelrummet som är öppet dygnet runt.',
            },
        ],
    },
    {
        id: 'efter',
        title: 'Efter årsträffen',
        icon: 'home',
        subsections: [
            {
                title: '',
                body: 'Efter en årsträff brukar man se att många lägger till nya vänner på Facebook, likväl som man utbyter telefonnummer under träffens gång. Givetvis är detta frivilligt – om man är hemlig med sitt medlemskap kanske man inte plötsligt kan lägga till 20 nya Facebook-vänner samma dag som man kommer hem från en resa. Men det är ett tillfälle att knyta nya kontakter!\n\nEn del säger bara att de varit på en brädspelsträff, andra är öppna med att de varit på årsträffen och berättar för alla de känner om allt roligt de gjort, alltifrån eldslukning till spännande föredrag. Du väljer själv hur just du vill göra!\n\nMånga som varit med några år väljer att ansluta till årsträffen någon dag tidigare för att få tid att bara umgås utan programpunkter, och många tar ledigt från jobbet dagen efter för att hinna landa hemma i vardagen igen. Det är ju inte alltid det blir så mycket sömn under träffen när det är så mycket roligt man vill hinna med!\n\nIbland kan man få lite abstinens efter en årsträff – man saknar de där spontana diskussionerna om såväl högt som lågt och snabba kast mellan olika samtalsämnen. Då kan man med fördel planera in en träff med sin lokala Mensagrupp så fort som möjligt efter årsträffen, så man har något att se fram emot. Halvårsträffen är i november och den europeiska årliga träffen EMAG brukar vara i augusti. Det är många som även anmäler sig till dessa efter årsträffen för att det inte ska bli så långt till nästa tillfälle man får umgås med många mensaner i flera dagar.',
            },
        ],
    },
    {
        id: 'kontakt',
        title: 'Kontakta funktionärer',
        icon: 'phone',
        subsections: [
            {
                title: 'Mensareceptionen',
                body: '📞 0730-22 13 90\n\nOBS! Notera att alla arbetar frivilligt och ibland behöver sova. Icke brådskande allmänna frågor kan skickas till 2026@swag.mensa.se eller läggas upp i årsträffsgruppen på Facebook.',
            },
            {
                title: 'Trygghetsteamet',
                body: '📞 073-508 75 30\n\nTveka inte att ringa om det uppstår en tveksam situation. Vid allvarliga problem kan ombudsman nås via ombudsman@mensa.se och vår ordförande på ordforande@mensa.se',
            },
            {
                title: 'Ny på SWAG-ansvariga',
                body: 'Carl Troein: 072-801 04 07\nMagdalena Laurell: 070-623 50 43\n(Säkrast sms, men lägg gärna till som vän på FB och skriv ett meddelande i Messenger att du är på årsträffen)\n\nEller via fadder@mensa.se\n\nTa gärna kontakt med Eventgruppsansvarig med synpunkter inför kommande årsträffar!',
            },
        ],
    },
];
