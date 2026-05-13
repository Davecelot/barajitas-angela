export type Sticker = {
  id: string
  number: number
  name: string
  isShiny?: boolean
}

export type Team = {
  id: string
  name: string
  flag: string
  group: string
  stickers: Sticker[]
}

type PlayerNames = [
  string, string, string, string, string, string, string, string, string,
  string, string, string, string, string, string, string, string, string,
]

// players: 18 names — positions 2-12 (indices 0-10), then 14-20 (indices 11-17)
function makeTeam(
  id: string,
  name: string,
  weAre: string,
  flag: string,
  group: string,
  players: PlayerNames,
): Team {
  const stickers: Sticker[] = [
    { id: `${id}-1`, number: 1, name: 'Escudo', isShiny: true },
    ...players.slice(0, 11).map((p, i) => ({ id: `${id}-${i + 2}`, number: i + 2, name: p })),
    { id: `${id}-13`, number: 13, name: `We Are ${weAre}`, isShiny: true },
    ...players.slice(11, 18).map((p, i) => ({ id: `${id}-${i + 14}`, number: i + 14, name: p })),
  ]
  return { id, name, flag, group, stickers }
}

// ── FWC — FIFA World Cup History ─────────────────────────────────────────────
export const fwcStickers: Sticker[] = Array.from({ length: 18 }, (_, i) => ({
  id: `fwc-${i + 1}`,
  number: i + 1,
  name: `Historia FWC ${i + 1}`,
  isShiny: false,
}))

// ── CC — Coca-Cola section ────────────────────────────────────────────────────
export const ccStickers: Sticker[] = [
  { id: 'cc-1', number: 1, name: 'Lamine Yamal', isShiny: true },
  { id: 'cc-2', number: 2, name: 'Joshua Kimmich', isShiny: true },
  { id: 'cc-3', number: 3, name: 'Harry Kane', isShiny: true },
  { id: 'cc-4', number: 4, name: 'Santiago Giménez', isShiny: true },
  { id: 'cc-5', number: 5, name: 'Joško Gvardiol', isShiny: true },
  { id: 'cc-6', number: 6, name: 'Federico Valverde', isShiny: true },
  { id: 'cc-7', number: 7, name: 'Jefferson Lerma', isShiny: true },
  { id: 'cc-8', number: 8, name: 'Enner Valencia', isShiny: true },
  { id: 'cc-9', number: 9, name: 'Gabriel Magalhães', isShiny: true },
  { id: 'cc-10', number: 10, name: 'Virgil van Dijk', isShiny: true },
  { id: 'cc-11', number: 11, name: 'Alphonso Davies', isShiny: true },
  { id: 'cc-12', number: 12, name: 'Emiliano Martínez', isShiny: true },
  { id: 'cc-13', number: 13, name: 'Raúl Jiménez', isShiny: true },
  { id: 'cc-14', number: 14, name: 'Lautaro Martínez', isShiny: true },
]

export const specialStickers: Sticker[] = [...fwcStickers, ...ccStickers]

// ── Teams ─────────────────────────────────────────────────────────────────────

export const teams: Team[] = [
  // === GRUPO A ===
  makeTeam('mex', 'México', 'Mexico', '🇲🇽', 'A', [
    'Luis Malagon', 'Johan Vasquez', 'Jugador 4', 'Marcel Ruiz',
    'Jesus Gallardo', 'Israel Reyes', 'Diego Lainez', 'Alexis Vega',
    'Edson Alvarez', 'Orbelin Pineda', 'Santiago Gimenez',
    'Erick Sanchez', 'Jugador 15', 'Jugador 16', 'Jugador 17',
    'Jugador 18', 'Jugador 19', 'Jugador 20',
  ]),
  makeTeam('rsa', 'Sudáfrica', 'South Africa', '🇿🇦', 'A', [
    'Ronwen Williams', 'Sipho Chaine', 'Aubrey Modiba', 'Jugador 5',
    'Mbekezeli Mbokazi', 'Khuluman Ndamane', 'Siyabonga Ngezana', 'Mbekezeli Mbokazi',
    'Nkosinathi Sibisi', 'Teboho Mokoena', 'Mihlali Mayambela',
    'Bathusi Aubaas', 'Sipho Sithole', 'Sipho Mbule', 'Lyle Foster',
    'Mohau Nkota', 'Oswin Appollis', 'Jugador 20',
  ]),
  makeTeam('kor', 'Corea República', 'Korea Republic', '🇰🇷', 'A', [
    'Seunggyu Kim', 'Hyeongyu Joo', 'Minjae Kim', 'Yumin Cho',
    'Myeongjae Lee', 'Hanbeom Lee', 'Taeseuk Lee', 'Jugador 9',
    'Jaesung Lee', 'Hyeongyu Oh', 'Kangin Lee',
    'Seungho Paik', 'Jens Castrop', 'Donggyeong Lee', 'Gijesung Cho',
    'Heungmin Son', 'Jugador 19', 'Jugador 20',
  ]),
  makeTeam('cze', 'Chequia', 'Czechia', '🇨🇿', 'A', [
    'Matej Kovar', 'Jindrich Stanek', 'Ladislav Krejci', 'Vladimir Coufal',
    'Jugador 6', 'Tomas Holes', 'David Zima', 'Michal Sadilek',
    'Lukas Provod', 'Lukas Cerv', 'Tomas Soucek',
    'Pavel Sulc', 'Matej Vydra', 'Vasil Kusej', 'Tomas Chory',
    'Jugador 18', 'Adam Hlozek', 'Patrik Schick',
  ]),

  // === GRUPO B ===
  makeTeam('can', 'Canadá', 'Canada', '🇨🇦', 'B', [
    'Dayne St.Clair', 'Alphonso Davies', 'Alistair Johnston', 'Samuel Adekugbe',
    'Riche Larvea', 'Derek Cornelius', 'Moïse Bombito', 'Stephen Eustáquio',
    'Kamal Miller', 'Ismaël Koné', 'Liam Millar',
    'Jacob Shaffelburg', 'Mathieu Choinière', 'Niko Sigur', 'Cyle Larin',
    'Jonathan David', 'Tajon Buchanan', 'Jonathan David',
  ]),
  makeTeam('bih', 'Bosnia-Herzegovina', 'Bosnia-Herzegovina', '🇧🇦', 'B', [
    'Nikola Vasilj', 'Amar Dedić', 'Sead Kolašinac', 'Tarik Muharemović',
    'Nihad Mujakić', 'Nikoli Katić', 'Amir Hadžiahmetović', 'Benjamin Tahirović',
    'Armin Gigović', 'Ima Šunjić', 'Ivan Bašić',
    'Dženis Burnić', 'Edin Bajraktarević', 'Amar Memić', 'Simeun Demirović',
    'Edin Džeko', 'Gamed Baždar', 'Hariz Tabaković',
  ]),
  makeTeam('qat', 'Qatar', 'Qatar', '🇶🇦', 'B', [
    'Hasan Haraam', 'Sultan Al-Brake', 'Lucas Mendes', 'Homam Ahmed',
    'Boualem Khoukhi', 'Pedro Miguel', 'Tarek Salman', 'Mohammed Mannai',
    'Ismail Boudiaf', 'Hamid Fatehi', 'Kesi Madibo',
    'Mohammed Waad', 'Abdulaziz Hatem', 'Nasser Al-Hayyoo', 'Edmilson Junior',
    'Akram Hassan Afif', 'Ahmed Al-Ganehi', 'Almoez Ali',
  ]),
  makeTeam('sui', 'Suiza', 'Switzerland', '🇨🇭', 'B', [
    'Yann Sommer', 'Yvon Mvogo', 'Manuel Akanji', 'Ricardo Rodríguez',
    'Nico Elvedi', 'Fabian Schär', 'Silvan Widmer', 'Granit Xhaka',
    'Denis Zakaria', 'Remo Fröhler', 'Fabian Rieder',
    'Ardon Jashari', 'Xherdan Shaqiri', 'Michel Aebischer', 'Breel Embolo',
    'Ruben Vargas', 'Dan Ndoye', 'Zeki Amdouni',
  ]),

  // === GRUPO C ===
  makeTeam('bra', 'Brasil', 'Brazil', '🇧🇷', 'C', [
    'Jugador 2', 'Bento', 'Marquinhos', 'Éder Militão',
    'Gabriel Magalhães', 'Danilo', 'Wesley', 'Lucas Paquetá',
    'Casemiro', 'Bruno Guimarães', 'Luiz Henrique',
    'Jugador 14', 'Vinicius Jr.', 'João Pedro', 'Matheus Cunha',
    'Gabriel Martinelli', 'Raphinha', 'Estêvão',
  ]),
  makeTeam('mar', 'Marruecos', 'Morocco', '🇲🇦', 'C', [
    'Yassine Bounou', 'Munir El Kajoui', 'Achraf Hakimi', 'Noussair Mazraoui',
    'Nayef Aguerd', 'Roman Saiss', 'Jawad El Yamio', 'Adam Masina',
    'Sofyan Amrabat', 'Azzedine Ounahi', 'Eliesse Ben Seghir',
    'Bilal El Khannouss', 'Ismael Saibari', 'Youssef En-Nesyri', 'Abde Ezzalzouli',
    'Soufiane Rahimi', 'Brahim Diaz', 'Ayoub El Kaabi',
  ]),
  makeTeam('hai', 'Haití', 'Haiti', '🇭🇹', 'C', [
    'Johny Placide', 'Carlens Arcus', 'Martin Expérience', 'Jean-Kevin Duverne',
    'Ricardo Adé', 'Duke Lacroix', 'Garven Metusala', 'Hannes Delcroix',
    'Leverton Pierre', 'Danley Jean Jacques', 'Jean-Ricner Bellegarde',
    'Christopher Attys', 'Derrick Etienne Jr', 'Josue Casimir', 'Ruben Providence',
    'Duckens Nazon', 'Louicius Deedson', 'Frantzdy Pierrot',
  ]),
  makeTeam('sco', 'Escocia', 'Scotland', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'C', [
    'Angus Gunn', 'Jugador 3', 'Jack Hendry', 'Kieran Tierney',
    'Aaron Hickey', 'Andrew Robertson', 'Scott McKenna', 'John Souttar',
    'Anthony Ralston', 'Grant Hanley', 'Scott McTominay',
    'Lewis Ferguson', 'Ryan Christie', 'Kieran McLean', 'John McGinn',
    'Lyndon Dykes', 'Che Adams', 'Ben Doak',
  ]),

  // === GRUPO D ===
  makeTeam('usa', 'Estados Unidos', 'USA', '🇺🇸', 'D', [
    'Matt Turner', 'Chris Richards', 'Tim Ream', 'Mark McKenzie',
    'Alex Freeman', 'Antonee Robinson', 'Tyler Adams', 'Tanner Tessmann',
    'Weston McKennie', 'Christian Roldan', 'Timothy Weah',
    'Diego Luna', 'Malik Tillman', 'Christian Pulisic', 'Brenden Aaronson',
    'Ricardo Pepi', 'Haji Wright', 'Folarin Balogun',
  ]),
  makeTeam('par', 'Paraguay', 'Paraguay', '🇵🇾', 'D', [
    'Roberto Fernández', 'Orlando Gill', 'Gustavo Gómez', 'Fabián Balbuena',
    'Juan José Cáceres', 'Omar Alderete', 'Javier Alonso', 'Mathías Villasanti',
    'Díego Gómez', 'Damián Bobadilla', 'Andrés Cubas',
    'Matías Galarza Fonda', 'Julio Enciso', 'Alfonso Romero Gamarra', 'Miguel Almirón',
    'Ramón Sosa', 'Biel Romero', 'Óscar Arriola',
  ]),
  makeTeam('aus', 'Australia', 'Australia', '🇦🇺', 'D', [
    'Jugador 2', 'Joe Gauci', 'Mark Souttar', 'Alessandro Circati',
    'Jordan Bos', 'Aziz Behich', 'Cameron Burgess', 'Liam Miller',
    'Milos Degenek', 'Jackson Irvine', 'Riley McGree',
    "Aaron O'Neill", 'Connor Metcalfe', 'Patrick Valère', 'Craig Goodwin',
    'Kusini Yengi', 'Nestory Irankunda', 'Mohamed Toure',
  ]),
  makeTeam('tur', 'Türkiye', 'Türkiye', '🇹🇷', 'D', [
    'Mert Günok', 'Mert Müldür', 'Zeki Çelik', 'Abdülkerim Bardakcı',
    'Çağlar Söyüncü', 'Merih Demiral', 'Ferdi Kadıoğlu', 'Kaan Ayhan',
    'İsmail Yüksek', 'Hakan Çalhanoğlu', 'Orkun Kökcü',
    'Arda Güler', 'Rıfat Can Kanveçi', 'Yusuf Akçiçek', 'Can Uzun',
    'Barış Alper Yılmaz', 'Kerem Aktürkoğlu', 'Kenan Yıldız',
  ]),

  // === GRUPO E ===
  makeTeam('ger', 'Alemania', 'Germany', '🇩🇪', 'E', [
    'Jugador 2', 'Jonathan Tah', 'David Raum', 'Nico Schlotterbeck',
    'Antonio Rüdiger', 'Waldemar Anton', 'Alou Nmecha', 'Maximilian Mittelstädt',
    'Jonas Hofmann', 'Florian Wirtz', 'Felix Nmecha',
    'Leon Goretzka', 'Jamal Musiala', 'Serge Gnabry', 'İlkay Gündoğan',
    'Leroy Sané', 'Karim Adeyemi', 'Nick Woltemade',
  ]),
  makeTeam('cuw', 'Curaçao', 'Curaçao', '🇨🇼', 'E', [
    'Jugador 2', 'Armando Obispo', 'Sherel Floranus', 'Jurien Gaari',
    'Joher Brunet', 'Roshon Van Eijma', 'Shuranov Sambo', 'Darrío Comenincia',
    'Godfried Roemeratoe', 'Leandro Bacuna', 'Leandro Bacuna Jr.',
    'Elói Gorre', 'Elói Gorre Jr.', 'Jérémy Margaritha', 'Jürgen Locadia',
    'Josery Antonisse', 'Gilmar Kastaneer', 'Sokuè Hansen',
  ]),
  makeTeam('ecu', 'Ecuador', 'Ecuador', '🇪🇨', 'E', [
    'Hernán Galíndez', 'Gonzalo Valle', 'Piero Hincapié', 'Pervis Estupiñán',
    'Willian Pacho', 'Ángelo Preciado', 'Joel Ordóñez', 'Moises Caicedo',
    'Alan Franco', 'Kendry Paez', 'Pedro Vite',
    'John Veboah', 'Leonardo Campana', 'Gonzalo Plata', 'Nilson Angulo',
    'Alan Minda', 'Kevin Rodriguez', 'Enner Valencia',
  ]),
  makeTeam('civ', "Costa de Marfil", "Côte d'Ivoire", '🇨🇮', 'E', [
    'Jugador 2', 'Cheikh Konan', 'Wilfried Singo', 'Odilon Kossounou',
    "Evan N'Dicka", 'Willy Boly', 'Emmanuel Agbadou', 'Ousmane Diomande',
    'Franck Kessié', 'Seko Fofana', 'Ibrahim Sangaré',
    'Jean-Philippe Gbamin', 'Joël Diallo', 'Sébastien Haller', 'Gohi Bi Zoro Cyriac',
    'Yvan Diomande', 'Evann Guessand', 'Oumar Diakité',
  ]),

  // === GRUPO F ===
  makeTeam('ned', 'Países Bajos', 'Netherlands', '🇳🇱', 'F', [
    'Bart Verbruggen', 'Virgil van Dijk', 'Micky van de Ven', 'Jurrien Timber',
    'Denzel Dumfries', 'Nathan Aké', 'Jeremie Frimpong', 'Jan Paul van Hecke',
    'Tijjani Reijnders', 'Ryan Gravenberch', 'Teun Koopmeiners',
    'Frenkie de Jong', 'Xavi Simons', 'Justin Kluivert', 'Memphis Depay',
    'Donyell Malen', 'Wout Weghorst', 'Cody Gakpo',
  ]),
  makeTeam('jpn', 'Japón', 'Japan', '🇯🇵', 'F', [
    'Jugador 2', 'Kenji Yonezawa', 'Akiru Seko', 'Jamesai Suzuki',
    'Daiel Takeuchi', 'Jugador 7', 'Kashiu Sano', 'Yuo Soma',
    'Ao Tanaka', 'Jugador 11', 'Takefusa Kubo',
    'Nao Doan', 'Noto Nakamura', 'Daiki Hashioka', 'Shoto Machino',
    'Jugador 18', 'Jugador 19', 'Jugador 20',
  ]),
  makeTeam('tun', 'Túnez', 'Tunisia', '🇹🇳', 'F', [
    'Bechir Ben Saïd', 'Amen Dammam', 'Wajdi Valery', 'Montassir Talbi',
    'Nader Meghar', 'Ali Abdi', 'Bilal Iqhizel', 'Elies Skhiri',
    'Houcef Laroubi', 'Ferjani Sassi', 'Abdelmejid Kerkeni',
    'Hamza Rafia', 'Elias Achouri', 'Elias Saar', 'Naim Maatoui',
    'Seifallah Ltaief', 'Bayallah Ltaief', 'Nabil Ifemi',
  ]),
  makeTeam('swe', 'Suecia', 'Sweden', '🇸🇪', 'F', [
    'Victor Johansson', 'Isak Iben', 'Gabriel Gudmundsson', 'Emil Holm',
    'Victor Nilsson Lindelöf', 'Isak Bergvall', 'Lukas Bergvall', 'Albin Ekdal',
    'Jesper Karlström', 'Nils Awari', 'Mattias Svanberg',
    'Daniel Svensson', 'Kim Serna', 'Adam Bardole', 'Niklas Klaußnitzer',
    'Dejan Kulusevski', 'Alexander Isak', 'Viktor Gyökeres',
  ]),

  // === GRUPO G ===
  makeTeam('bel', 'Bélgica', 'Belgium', '🇧🇪', 'G', [
    'Thomas Gouault', 'Arthur Theate', 'Timothy Castagne', 'Zeno Débast',
    'Brandon Mechele', 'Maxim De Cuyper', 'Thomas Meunier', 'Youri Tielemans',
    'Amadou Onana', 'Jugador 11', 'Alexis Saelemaekers',
    'Dodi Lukebakio', 'Kevin De Bruyne', 'Jeremy Doku', 'Charles De Ketelaere',
    'Leandro Trossard', 'Lois Openda', 'Romelu Lukaku',
  ]),
  makeTeam('egy', 'Egipto', 'Egypt', '🇪🇬', 'G', [
    'Jugador 2', 'Mohamed Hany', 'Mohamed Hamdy', 'Jugador 5',
    'Khaled Sobhi', 'Ramy Rabeh', 'Hossam Abdelmazrou', 'Ahmed Fatouh',
    'Hamza Atiya', 'Zizo', 'Hamdi Fathy',
    'Mohamed Lashen', 'Emam Ashour', 'Omari Faisal', 'Mohamed Salah',
    'Mostafa Mohamed', 'Trezeguet', 'Marwan Hamid',
  ]),
  makeTeam('irn', 'IR Irán', 'IR Iran', '🇮🇷', 'G', [
    'Alireza Beiranvand', 'Morteza Pouraliganji', 'Ehsan Hajsafi', 'Milad Mohammadi',
    'Milad Khalilzadeh', 'Saman Ghoddos', 'Karim Ansarifard', 'Haedeh Moharami',
    'Alireza Haroani', 'Jugador 11', 'Ali Karimi',
    'Tmas Noorafkan', 'Ali Chesmi', 'Sardar Azmoun', 'Jugador 17',
    'Jugador 18', 'Jugador 19', 'Jugador 20',
  ]),
  makeTeam('nzl', 'Nueva Zelanda', 'New Zealand', '🇳🇿', 'G', [
    'Jugador 2', 'Alyx Poulsen', 'Michael Boxall', 'Liberato Cacace',
    'Tim Payne', 'Pito Brooke', 'Francis De Vries', 'Finn Surman',
    'Joe Bell', 'Sarpreet Singh', 'Ryan Thomas',
    'Matthew Garbett', 'Oliver Stanisljevic', 'Ben Old', 'Chris Wood',
    'Elijah Just', 'Callum McCowatt', 'Jugador 20',
  ]),

  // === GRUPO H ===
  makeTeam('esp', 'España', 'Spain', '🇪🇸', 'H', [
    'Unai Simón', 'Robin Le Normand', 'Aymeric Laporte', 'Juan Miijber',
    'Jugador 6', 'Dani Carvajal', 'Marc Cucurella', 'Martín Zubimendi',
    'Rodri', 'Pedri', 'Fabián Ruiz',
    'Jugador 14', 'Lamine Yamal', 'Dani Olmo', 'Nico Williams',
    'Ferran Torres', 'Álvaro Morata', 'Mikel Oyarzabal',
  ]),
  makeTeam('cpv', 'Cabo Verde', 'Cabo Verde', '🇨🇻', 'H', [
    'Pica', 'Logan Costa', 'Jugador 4', 'Diney',
    'Steven Moreira', 'Wagner Pina', 'Joao Paulo', 'Vannick Semedo',
    'Kevin Pina', 'Patrick Andrade', 'Jamiro Monteiro',
    'Deroy Duarte', 'Garry Rodrigues', 'Jugador 16', 'Ryan Mendes',
    'Dailon Livramento', 'Willy Semedo', 'Bebe',
  ]),
  makeTeam('sau', 'Arabia Saudita', 'Saudi Arabia', '🇸🇦', 'H', [
    'Nawaf Alaqidi', 'Abdulrahman Al-Sanbi', 'Saud Abdulhamid', 'Nawaf Bouwashl',
    'Jihad Thakri', 'Moteb Al-Harbi', 'Hassan Altambakti', 'Musab Aljuwayr',
    'Ziyad Aljohani', 'Abdullah Alkhaibari', 'Nasser Aldawsari',
    'Saleh Abu Alshamat', 'Marwan Alsahafi', 'Salem Aldawsari', 'Abdulrahman Al-Aboud',
    'Feras Akbrikan', 'Saleh Alshehri', 'Abdullah Al-Hamdan',
  ]),
  makeTeam('uru', 'Uruguay', 'Uruguay', '🇺🇾', 'H', [
    'Sergio Rochet', 'Santiago Mele', 'Ronald Araujo', 'José María Giménez',
    'Sebastian Caceres', 'Mathias Olivera', 'Guillermo Varela', 'Nahitan Nandez',
    'Federico Valverde', 'Giorgian De Arrascaeta', 'Rodrigo Bentancur',
    'Manuel Ugarte', 'Nicolás de la Cruz', 'Maxi Araujo', 'Darwin Núñez',
    'Federico Viñas', 'Rodrigo Aguirre', 'Facundo Pellistri',
  ]),

  // === GRUPO I ===
  makeTeam('fra', 'Francia', 'France', '🇫🇷', 'I', [
    'Jugador 2', 'Jugador 3', 'William Saliba', 'Jules Koundé',
    'Jugador 6', 'Jugador 7', 'Lucas Digne', 'Jugador 9',
    'Jugador 10', 'Jugador 11', 'Adrien Rabiot',
    'Jugador 14', 'Jugador 15', 'Jugador 16', 'Jugador 17',
    'Kingsley Coman', 'Jugador 19', 'Jugador 20',
  ]),
  makeTeam('sen', 'Senegal', 'Senegal', '🇸🇳', 'I', [
    'Jugador 2', 'Yehvann Diouf', 'Jugador 4', 'Abdoulaye Seck',
    'Kalidou Koulibaly', 'Jugador 7', 'Kalidou Koulibaly', 'Jugador 9',
    'Jugador 10', 'Pape Gueye', 'Habib Diarra',
    'Jugador 14', 'Jugador 15', 'Jugador 16', 'Jugador 17',
    'Iliman Ndiaye', 'Jugador 19', 'Jugador 20',
  ]),
  makeTeam('nor', 'Noruega', 'Norway', '🇳🇴', 'I', [
    'Jugador 2', 'Jugador 3', 'Jugador 4', 'Jugador 5',
    'Jugador 6', 'Jugador 7', 'Jugador 8', 'Jugador 9',
    'Jugador 10', 'Jugador 11', 'Jugador 12',
    'Jugador 14', 'Jugador 15', 'Jugador 16', 'Jugador 17',
    'Jugador 18', 'Jugador 19', 'Jugador 20',
  ]),
  makeTeam('irq', 'Irak', 'Iraq', '🇮🇶', 'I', [
    'Jugador 2', 'Rebin Sulaka', 'Hussein Ali', 'Jugador 5',
    'Jugador 6', 'Zaid Tahseen', 'Manaf Younis', 'Zidane Iqbal',
    'Jugador 10', 'Ibrahim Bayesh', 'Ali Jasim',
    'Youssef Amyn', 'Aimar Sher', 'Jugador 16', 'Osama Rashid',
    'Jugador 18', 'Aymen Hussein', 'Jugador 20',
  ]),

  // === GRUPO J ===
  makeTeam('arg', 'Argentina', 'Argentina', '🇦🇷', 'J', [
    'Emiliano Martinez', 'Nahuel Molina', 'Cristian Romero', 'Nicolas Otamendi',
    'Nicolas Tagliafico', 'Leonardo Balerdi', 'Enzo Fernandez', 'Alexis Mac Allister',
    'Rodrigo De Paul', 'Exequiel Palacios', 'Leandro Paredes',
    'Nico Paz', 'Franco Mastantuono', 'Nico Gonzalez', 'Lionel Messi',
    'Lautaro Martinez', 'Julian Alvarez', 'Giuliano Simeone',
  ]),
  makeTeam('alg', 'Argelia', 'Algeria', '🇩🇿', 'J', [
    'Alexis Guendouz', 'Ramy Bensebaini', 'Youcef Atal', 'Rayan Aït-Nouri',
    'Mohamed Amine Tougai', 'Aïssa Mandi', 'Ismael Bennacer', 'Houssem Aquar',
    'Hicham Boudaoui', 'Ramiz Zerrouki', 'Nabil Bentalab',
    'Farés Chaibi', 'Riyad Mahrez', 'Said Benrahma', 'Anis Hadj Moussa',
    'Amine Gouiri', 'Baghdad Bounedjah', 'Mohammed Amoura',
  ]),
  makeTeam('jor', 'Jordania', 'Jordan', '🇯🇴', 'J', [
    'Jugador 2', 'Ihsan Haddad', 'Mohammad Abu Hashish', 'Yictam Al-Arab',
    'Abdullah Nasib', 'Saleem Obaid', 'Mohammad Abualnaadi', 'Ibrahim Baadin',
    'Nizar Al-Rashdan', 'Nyr Al-Rawabdeh', 'Mohammad Abu Taha',
    'Jamal Jawnaha', 'Mousa Al-Taamari', 'Nazar Al-Naimat', 'Hamza Al-Mareh',
    'Al-Olwami', 'Mohammad Abu Zrayek', 'Ibrahim Samir',
  ]),
  makeTeam('aut', 'Austria', 'Austria', '🇦🇹', 'J', [
    'Alexander Schlager', 'Patrick Pentz', 'David Alaba', 'Kevin Danso',
    'Philipp Lienhart', 'Stefan Posch', 'Phillipp Mwene', 'Alexander Prass',
    'Xaver Schlager', 'Marcel Sabitzer', 'Konrad Laimer',
    'Florian Grillitsch', 'Nicolas Seiwald', 'Romano Schmid', 'Patrick Wimmer',
    'Christoph Baumgartner', 'Michael Gregoritsch', 'Marko Arnautović',
  ]),

  // === GRUPO K ===
  makeTeam('por', 'Portugal', 'Portugal', '🇵🇹', 'K', [
    'Diogo Costa', 'José Sá', 'Rúben Dias', 'João Cancelo',
    'Diogo Dalot', 'Nuno Mendes', 'Gonçalo Inácio', 'Bernardo Silva',
    'Bruno Fernandes', 'Rúben Neves', 'Vitinha',
    'João Neves', 'Cristiano Ronaldo', 'Francisco Trincão', 'João Félix',
    'Gonçalo Ramos', 'Pedro Neto', 'Rafael Leão',
  ]),
  makeTeam('cod', 'Congo DR', 'Congo DR', '🇨🇩', 'K', [
    'Lionel Mpasi', 'Aaron Wan-Bissaka', 'Axel Tuanzebe', 'Arthur Masuaku',
    'Chancel Mbemba', 'Joris Kayembe', 'Charles Pickel', "Ngal'ayel Mukau",
    'Edo Kayembe', 'Samuel Moutoussamy', 'Noah Sadiki',
    'Théo Bongonda', 'Meschak Elia', 'Yoane Wissa', 'Brian Cipenga',
    'Fiston Mayele', 'Cédric Bakambu', 'Nathanaël Mbuku',
  ]),
  makeTeam('uzb', 'Uzbekistán', 'Uzbekistan', '🇺🇿', 'K', [
    'Utkir Yusupov', 'Farrukh Sayfiev', 'Sherzod Nashrullaev', 'Umar Eshmurodov',
    'Husniddin Aliqulov', 'Rustam Ashurmatov', 'Kholiqbar Alijonov', 'Abdukodir Khusanov',
    'Odiljon Hamrobekov', 'Otabek Shukurov', 'Jamshid Iskanderov',
    'Azizbek Turgunboev', 'Khojimat Erkinov', 'Eldor Shomurodov', 'Oston Urunov',
    'Jaloliddin Masharipov', 'Igor Sergeev', 'Abbosbek Fayzullaev',
  ]),
  makeTeam('col', 'Colombia', 'Colombia', '🇨🇴', 'K', [
    'Kevin Castano', 'Jugador 3', 'James Rodriguez', 'Jhon Lucumi',
    'Davinson Sanchez', 'Yerry Mina', 'Richard Rios', 'Luis Diaz',
    'Jefferson Lerma', 'Santiago Arias', 'Jugador 12',
    'Jorge Carrascal', 'Juan Fernando Quintero', 'Jhon Cordoba', 'Jhon Arias',
    'Jhon Arias', 'Jugador 19', 'Luis Diaz',
  ]),

  // === GRUPO L ===
  makeTeam('eng', 'Inglaterra', 'England', '🏴', 'L', [
    'Jordan Pickford', 'John Stones', 'Marc Guehi', 'Ezri Konsa',
    'Trent Alexander-Arnold', 'Reece James', 'Dan Burn', 'Declan Rice',
    'Harry Kane', 'Cole Palmer', 'Jude Bellingham',
    'Morgan Rogers', 'Anthony Gordon', 'Eberechi Eze', 'Phil Foden',
    'Harry Kane', 'Marcus Rashford', 'Jugador 20',
  ]),
  makeTeam('cro', 'Croacia', 'Croatia', '🇭🇷', 'L', [
    'Dominik Livakovic', 'Jugador 3', 'Josko Gvardiol', 'Josip Stanisic',
    'Martin Baturina', 'Josip Sutalo', 'Kristijan Jakic', 'Luka Modric',
    'Mateo Kovacic', 'Martin Baturina', 'Lovro Majer',
    'Mario Pasalic', 'Petar Sucic', 'Ivan Perisic', 'Marco Pasalic',
    'Andrej Kramaric', 'Marko Pasalic', 'Franjo Ivanovic',
  ]),
  makeTeam('gha', 'Ghana', 'Ghana', '🇬🇭', 'L', [
    'Lawrence Ati-Zigi', 'Tariq Lamptey', 'Mohammed Salisu', 'Alidu Seidu',
    'Alexander Djiku', 'Gideon Mensah', 'Caleb Yirenkyi', 'Abdul Issahaku Fatawu',
    'Thomas Partey', 'Jugador 11', 'Kamaldeen Sulemana',
    'Mohammed Kudus', 'Inaki Williams', 'Jugador 16', 'Jugador 17',
    'Joseph Paintsil', 'Jugador 19', 'Jugador 20',
  ]),
  makeTeam('pan', 'Panamá', 'Panama', '🇵🇦', 'L', [
    'Jugador 2', 'Luis Mejia', 'Fidel Escobar', 'Andres Andrade',
    'Jugador 6', 'Eric Davis', 'Jose Cordoba', 'Cesar Blackman',
    'Christian Martinez', 'Anibal Godoy', 'Jugador 12',
    'Edgar Barcenas', 'Carlos Harvey', 'Ismael Diaz', 'Jose Fajardo',
    'Cecilio Waterman', 'Jose Luis Rodriguez', 'Alberto Quintero',
  ]),
]

// ── Stickers Angela already has (pre-seeded from photo analysis) ──────────────
export const defaultCollected = new Set<string>([
  // MEX
  'mex-1', 'mex-2', 'mex-5', 'mex-6', 'mex-9', 'mex-10', 'mex-12',
  // RSA
  'rsa-1', 'rsa-3', 'rsa-4', 'rsa-9', 'rsa-11', 'rsa-12',
  'rsa-14', 'rsa-15', 'rsa-16', 'rsa-17',
  // KOR
  'kor-2', 'kor-3', 'kor-5', 'kor-6', 'kor-7', 'kor-11', 'kor-16', 'kor-17',
  // CZE
  'cze-1', 'cze-5',
  // CAN
  'can-2', 'can-5', 'can-7', 'can-10', 'can-12',
  'can-15', 'can-17', 'can-18', 'can-19',
  // BIH
  'bih-7', 'bih-12', 'bih-20',
  // QAT
  'qat-2', 'qat-3', 'qat-4', 'qat-5', 'qat-6', 'qat-7', 'qat-8',
  'qat-10', 'qat-12', 'qat-13', 'qat-14', 'qat-16', 'qat-18', 'qat-20',
  // SUI
  'sui-4', 'sui-5', 'sui-8', 'sui-9', 'sui-11', 'sui-12', 'sui-13',
  'sui-14', 'sui-15', 'sui-16', 'sui-18', 'sui-19', 'sui-20',
  // BRA
  'bra-1', 'bra-3', 'bra-7', 'bra-9', 'bra-11', 'bra-15', 'bra-16', 'bra-17', 'bra-20',
  // SCO
  'sco-4', 'sco-7', 'sco-8', 'sco-9', 'sco-11', 'sco-12',
  'sco-15', 'sco-16', 'sco-17', 'sco-19', 'sco-20',
  // USA
  'usa-3', 'usa-9', 'usa-13', 'usa-20',
  // PAR
  'par-1', 'par-2', 'par-6', 'par-7', 'par-8', 'par-10',
  'par-15', 'par-16', 'par-19', 'par-20',
  // AUS
  'aus-3', 'aus-4', 'aus-6', 'aus-9', 'aus-11', 'aus-16', 'aus-18', 'aus-20',
  // TUR
  'tur-1', 'tur-2', 'tur-5', 'tur-6', 'tur-10', 'tur-13', 'tur-16',
  // GER
  'ger-1', 'ger-4', 'ger-5', 'ger-6', 'ger-8', 'ger-9', 'ger-10',
  'ger-12', 'ger-13', 'ger-15', 'ger-17', 'ger-18',
  // CUW
  'cuw-1', 'cuw-3', 'cuw-4', 'cuw-5', 'cuw-6', 'cuw-8', 'cuw-9',
  'cuw-12', 'cuw-13', 'cuw-14', 'cuw-15', 'cuw-18', 'cuw-19',
  // CIV
  'civ-3', 'civ-5', 'civ-9', 'civ-10', 'civ-13', 'civ-14', 'civ-15', 'civ-17',
  // JPN
  'jpn-1', 'jpn-2', 'jpn-3', 'jpn-5', 'jpn-6', 'jpn-10', 'jpn-11',
  'jpn-14', 'jpn-15', 'jpn-16', 'jpn-18', 'jpn-19', 'jpn-20',
  // SWE
  'swe-5', 'swe-7', 'swe-9', 'swe-16', 'swe-18',
  // TUN
  'tun-1', 'tun-2', 'tun-3', 'tun-4', 'tun-5', 'tun-6',
  'tun-8', 'tun-9', 'tun-10', 'tun-11', 'tun-12',
  'tun-14', 'tun-15', 'tun-17', 'tun-18', 'tun-19', 'tun-20',
  // BEL
  'bel-8', 'bel-13', 'bel-14', 'bel-18',
  // EGY
  'egy-1', 'egy-2', 'egy-3', 'egy-4', 'egy-5', 'egy-6', 'egy-8',
  'egy-10', 'egy-12', 'egy-13', 'egy-14', 'egy-17', 'egy-18', 'egy-19', 'egy-20',
  // IRN
  'irn-1', 'irn-2', 'irn-3', 'irn-4', 'irn-8', 'irn-11', 'irn-12', 'irn-16',
  // NZL
  'nzl-3', 'nzl-7', 'nzl-10', 'nzl-15', 'nzl-18', 'nzl-19', 'nzl-20',
  // ESP
  'esp-1', 'esp-2', 'esp-4', 'esp-5', 'esp-6', 'esp-9', 'esp-11',
  'esp-13', 'esp-14', 'esp-15', 'esp-18', 'esp-19',
  // CPV
  'cpv-2', 'cpv-7', 'cpv-8',
  // FRA
  'fra-2', 'fra-3', 'fra-6', 'fra-7', 'fra-9', 'fra-10',
  'fra-11', 'fra-14', 'fra-15', 'fra-16', 'fra-17', 'fra-19',
  // SEN
  'sen-1', 'sen-4', 'sen-7', 'sen-9', 'sen-10',
  'sen-14', 'sen-15', 'sen-16', 'sen-17',
  // IRQ
  'irq-1', 'irq-2', 'irq-5', 'irq-6', 'irq-10',
  'irq-16', 'irq-18', 'irq-20',
  // JOR
  'jor-4', 'jor-5', 'jor-8', 'jor-9', 'jor-12', 'jor-13',
  'jor-16', 'jor-18', 'jor-19', 'jor-20',
  // UZB
  'uzb-7', 'uzb-10', 'uzb-18',
  // COL
  'col-1', 'col-4', 'col-5', 'col-6', 'col-7', 'col-9',
  'col-10', 'col-11', 'col-13', 'col-14', 'col-16', 'col-18',
  // POR
  'por-2', 'por-6', 'por-7', 'por-8', 'por-9', 'por-10', 'por-11', 'por-12',
  'por-14', 'por-15', 'por-19', 'por-20',
  // ENG
  'eng-1', 'eng-2', 'eng-5', 'eng-7', 'eng-9',
  'eng-11', 'eng-12', 'eng-15', 'eng-16', 'eng-17',
  // CRO
  'cro-2', 'cro-5', 'cro-6', 'cro-9', 'cro-14', 'cro-17',
  // GHA
  'gha-1', 'gha-2', 'gha-3', 'gha-4', 'gha-5', 'gha-6',
  'gha-7', 'gha-10', 'gha-13',
  // PAN
  'pan-1', 'pan-10', 'pan-13', 'pan-15', 'pan-17',
])

export const totalStickers =
  specialStickers.length + teams.reduce((acc, t) => acc + t.stickers.length, 0)
