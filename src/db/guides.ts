import type { Recipe } from '../types'

export type Guide = Required<Pick<Recipe, 'prepMin' | 'cookMin' | 'tools' | 'steps'>> & Pick<Recipe, 'tips'>

/**
 * Fiches de préparation des recettes fournies, pour 1 portion.
 * Quantités : `{foodId}` (selon la portion), `{foodId*k}` (poids cru, eau…). Voir lib/steps.ts.
 */
export const GUIDES: Record<string, Guide> = {
  'ex-porridge-proteine': {
    prepMin: 5, cookMin: 6,
    tools: ['petite casserole'],
    steps: [
      'Dans une petite casserole, verse {lait-demi-ecreme*1 ml} de lait et les flocons d\'avoine ({flocons-avoine-crus}), avec une pincée de sel : elle fait ressortir le goût.',
      'Chauffe à feu moyen en remuant souvent. Dès les premiers frémissements, baisse le feu et laisse cuire 4 à 5 min en remuant. C\'est prêt quand le porridge est crémeux et que la cuillère laisse une trace au fond. Il épaissit encore en refroidissant.',
      'Pendant la cuisson, coupe la banane ({banane}) en rondelles. Écrase-en la moitié à la fourchette et mélange-la au porridge : elle le sucre naturellement.',
      'Retire du feu et attends 1 min, puis incorpore le yaourt grec ({yaourt-grec-0}). Ne le fais pas bouillir : il tournerait.',
      'Verse dans un bol et pose le reste de banane dessus. Cannelle à volonté.',
    ],
    tips: [
      'Trop épais : allonge avec un peu de lait. Trop liquide : 1 min de cuisson en plus.',
      'Au micro-ondes : grand bol (ça déborde vite), 2 min 30 en deux fois en remuant entre les deux.',
    ],
  },

  'ex-poulet-riz-brocoli': {
    prepMin: 10, cookMin: 20,
    tools: ['casserole avec couvercle', 'poêle', 'passoire'],
    steps: [
      'Mets le riz ({riz-blanc-cru}) dans une passoire et rince-le sous l\'eau froide jusqu\'à ce que l\'eau soit presque claire : il collera moins.',
      'Porte à ébullition {riz-blanc-cru*1.6 ml} d\'eau avec une pincée de sel. Verse le riz, remue une fois, couvre et baisse à feu très doux. Compte 12 min sans soulever le couvercle, puis coupe le feu et laisse reposer 5 min, toujours couvert.',
      'Pendant ce temps, coupe le brocoli en petits bouquets ({brocoli-cuit}). Fais-le cuire 5 à 6 min à la vapeur ou dans l\'eau bouillante salée. Il doit rester vert vif : la pointe du couteau rentre sans forcer. Égoutte.',
      'Coupe le blanc de poulet ({poulet-blanc-cuit*1.35} cru) en dés de 2 cm. Sale, poivre, ajoute ½ c. à café de paprika et une pincée d\'ail en poudre.',
      'Chauffe l\'huile ({huile-olive}) dans la poêle à feu moyen-vif. Quand elle ondule, pose le poulet en une seule couche et n\'y touche pas pendant 2 min pour qu\'il dore. Retourne et poursuis 3 à 4 min. Il est cuit quand l\'intérieur est blanc, sans trace rosée.',
      'Ajoute le brocoli dans la poêle 1 min pour qu\'il prenne le goût. Sers avec le riz, un filet de citron sur le tout.',
    ],
    tips: [
      'Une fois cuits : {poulet-blanc-cuit} de poulet et ≈ 250 g de riz pour une portion, pratique si tu pèses l\'assiette.',
      'Riz basmati : même méthode, 10 min de cuisson suffisent.',
    ],
  },

  'pk-tajine-poulet-olives': {
    prepMin: 15, cookMin: 50,
    tools: ['cocotte ou tajine avec couvercle'],
    steps: [
      'Épluche et émince finement l\'oignon ({oignon}). Épluche les carottes ({carotte}) et coupe-les en bâtonnets. Hache 1 gousse d\'ail.',
      'Retire la peau du poulet : c\'est elle qui fait grimper les lipides. Il te faut {poulet-cuisse-cuite*1.35} de cuisse crue désossée, ou une grosse cuisse avec l\'os. Frotte-la avec ½ c. à café de gingembre moulu, ¼ c. à café de curcuma, une pincée de safran, du poivre et un peu de sel. Si tu as le temps, laisse mariner 30 min au frais.',
      'Chauffe l\'huile ({huile-olive}) à feu moyen dans la cocotte. Fais revenir l\'oignon et l\'ail 5 min en remuant, jusqu\'à ce qu\'ils soient translucides, sans les colorer.',
      'Ajoute le poulet et fais-le dorer 2 min sur chaque face. Verse de l\'eau jusqu\'à mi-hauteur du poulet, soit à peu près un verre.',
      'Couvre et laisse mijoter 25 min à feu doux. Ajoute les carottes, un peu d\'eau si la sauce a trop réduit, et poursuis 15 à 20 min à couvert. Le poulet est cuit quand la chair se détache facilement de l\'os.',
      'Rince les olives ({olives-vertes}) pour retirer l\'excès de sel et ajoute-les, avec quelques lamelles de citron confit si tu en as. Laisse 5 min sans couvercle : la sauce épaissit et doit napper la cuillère.',
      'Goûte et rectifie le sel. Parsème de coriandre et de persil hachés, et sers avec le khobz ({khobz}) pour saucer.',
    ],
    tips: [
      'Sale peu au départ : les olives et le citron confit sont déjà salés.',
      'Avec l\'os, compte 10 min de mijotage en plus.',
      'Encore meilleur réchauffé le lendemain.',
    ],
  },

  'ex-omelette-pain': {
    prepMin: 5, cookMin: 6,
    tools: ['poêle antiadhésive', 'grille-pain'],
    steps: [
      "Lave la tomate ({tomate}) et coupe-la en petits dés.",
      "Casse {oeuf-entier} dans un bol. Ajoute une pincée de sel, du poivre et 1 c. à soupe d'eau : l'omelette sera plus moelleuse. Bats à la fourchette 30 s, jusqu'à ce que blancs et jaunes soient bien mélangés.",
      "Mets le pain complet ({pain-complet}) à griller pendant que tu cuis l'omelette.",
      "Chauffe l'huile ({huile-olive}) dans la poêle à feu moyen. Fais revenir les dés de tomate 2 min, juste pour les attendrir.",
      "Verse les œufs. Laisse prendre 30 s, puis ramène les bords vers le centre avec une spatule en inclinant la poêle, pour que l'œuf encore liquide coule dessous. Recommence 2 ou 3 fois.",
      "Quand le dessus est encore légèrement baveux (2 à 3 min en tout), plie l'omelette en deux et fais-la glisser dans l'assiette : elle finit de cuire avec sa propre chaleur. Sers avec le pain grillé.",
    ],
    tips: [
      "Persil, ciboulette ou une pincée de cumin dans les œufs battus pour varier.",
      "Tu la préfères bien cuite : 1 min de plus avant de la plier.",
    ],
  },

  'ex-pates-bolognaise': {
    prepMin: 10, cookMin: 25,
    tools: ['sauteuse ou poêle profonde', 'grande casserole', 'passoire'],
    steps: [
      "Coupe les tomates ({tomate}) en petits dés en gardant le jus, ou prends des tomates concassées en boîte, même poids. Si tu en as, hache ¼ d'oignon et 1 gousse d'ail.",
      "Chauffe l'huile ({huile-olive}) dans la sauteuse à feu moyen et fais revenir l'oignon et l'ail 3 min.",
      "Monte à feu vif et ajoute le bœuf haché ({boeuf-hache-5}). Émiette-le à la spatule et laisse-le dorer 4 à 5 min sans remuer sans arrêt : il doit colorer, pas bouillir. Il est cuit quand il n'y a plus de rose.",
      "Ajoute les tomates, ½ c. à café d'origan ou d'herbes de Provence, du sel et du poivre. Baisse à feu doux et laisse mijoter 15 min à demi couvert, en remuant de temps en temps. La sauce est prête quand elle a épaissi et que la cuillère y laisse un sillon.",
      "Pendant ce temps, porte une grande casserole d'eau à ébullition (1 L pour 100 g de pâtes) et sale-la. Verse les pâtes ({pates-crues}) et cuis-les le temps indiqué sur le paquet moins 1 min, en remuant au début pour qu'elles ne collent pas.",
      "Garde un fond de verre d'eau de cuisson, puis égoutte. Mélange les pâtes à la sauce 1 min sur le feu, avec un peu d'eau de cuisson si c'est trop sec.",
    ],
    tips: [
      "Une pincée de sucre corrige l'acidité des tomates fraîches.",
      "Une fois cuites, les pâtes pèsent {pates-crues*2.3} : pratique pour peser l'assiette.",
    ],
  },

  'ex-saumon-pdt': {
    prepMin: 10, cookMin: 25,
    tools: ['casserole', 'poêle antiadhésive'],
    steps: [
      "Épluche {pommes-terre-cuites*1.05} de pommes de terre crues et coupe-les en morceaux de même taille (4 cm environ) pour qu'ils cuisent en même temps.",
      "Mets-les dans une casserole d'eau froide salée, porte à ébullition et compte 15 à 18 min. Elles sont cuites quand la pointe du couteau s'enfonce sans résistance. Égoutte.",
      "Pendant ce temps, coupe le brocoli en bouquets ({brocoli-cuit}) et cuis-le 5 à 6 min à la vapeur ou dans l'eau bouillante salée. Il doit rester vert vif.",
      "Sors le saumon du frigo 10 min avant : il te faut {saumon-cuit*1.2} de pavé cru. Sèche-le avec du papier absorbant, sale et poivre.",
      "Chauffe la poêle à feu moyen-vif, sans matière grasse : le saumon a la sienne. Pose le pavé côté peau et laisse 5 min sans y toucher, la peau devient croustillante. Retourne et compte 2 à 3 min. Il est cuit quand la chair se détache en lamelles et reste à peine nacrée au centre.",
      "Sers avec les pommes de terre et le brocoli, un filet de citron, et de l'aneth ou du persil si tu en as.",
    ],
    tips: [
      "Au four : 12 min à 200 °C, sur une plaque avec du papier cuisson.",
      "Ce qui est compté, ce sont {pommes-terre-cuites} de pommes de terre une fois cuites.",
    ],
  },

  'ex-pates-thon': {
    prepMin: 5, cookMin: 15,
    tools: ['grande casserole', 'poêle', 'passoire'],
    steps: [
      "Porte à ébullition une grande casserole d'eau (1 L pour 100 g de pâtes) et sale-la.",
      "Coupe les tomates ({tomate}) en dés et hache 1 gousse d'ail.",
      "Chauffe l'huile ({huile-olive}) dans la poêle à feu moyen. Fais revenir l'ail 30 s sans le laisser brunir, puis ajoute les tomates, du sel, du poivre et une pincée de piment ou d'origan. Laisse compoter 8 à 10 min : les tomates doivent fondre en sauce.",
      "Pendant ce temps, cuis les pâtes ({pates-crues}) le temps indiqué sur le paquet. Garde un fond de verre d'eau de cuisson avant d'égoutter.",
      "Égoutte le thon ({thon-naturel-egoutte}) en pressant le couvercle de la boîte, émiette-le et ajoute-le à la sauce hors du feu : trop cuit, il devient sec.",
      "Mélange les pâtes à la sauce avec un peu d'eau de cuisson pour lier. Persil ou basilic si tu en as.",
    ],
    tips: [
      "Une boîte de thon de 140 g donne environ 100 g égoutté.",
      "Quelques câpres ou olives noires vont très bien avec.",
    ],
  },

  'ex-couscous-poulet': {
    prepMin: 10, cookMin: 25,
    tools: ['casserole', 'poêle', 'saladier'],
    steps: [
      "Épluche les carottes ({carotte}) et coupe-les en bâtonnets. Fais-les cuire 15 min dans une casserole d'eau salée avec ½ c. à café de ras el hanout ou de cumin. Elles sont prêtes quand le couteau entre facilement. Garde le bouillon.",
      "Coupe le blanc de poulet ({poulet-blanc-cuit*1.35} cru) en morceaux. Assaisonne de sel, de poivre, de ½ c. à café de ras el hanout et d'une pincée de curcuma.",
      "Chauffe la moitié de l'huile ({huile-olive} en tout) dans la poêle à feu moyen-vif et fais dorer le poulet 6 à 8 min en le retournant. Il est cuit quand l'intérieur est blanc.",
      "Mets la semoule ({semoule-cru}) dans un saladier avec une pincée de sel et le reste de l'huile. Verse dessus {semoule-cru*1.2 ml} de bouillon des carottes bien chaud, couvre d'une assiette et attends 5 min.",
      "Égraine la semoule à la fourchette pour séparer les grains : elle doit être légère, sans paquets.",
      "Sers la semoule avec le poulet et les carottes, et un peu de bouillon par-dessus si tu aimes le couscous arrosé.",
    ],
    tips: [
      "Une poignée de pois chiches ou de raisins secs s'ajoute bien : ajoute-les aussi dans « Modifier » pour que les macros les comptent.",
    ],
  },

  'ex-sardines-riz': {
    prepMin: 10, cookMin: 20,
    tools: ['casserole avec couvercle', 'poêle-gril ou four'],
    steps: [
      "Lance le riz : rince {riz-blanc-cru} de riz, porte {riz-blanc-cru*1.6 ml} d'eau salée à ébullition, verse le riz, couvre et cuis 12 min à feu très doux. Laisse ensuite reposer 5 min hors du feu sans ouvrir.",
      "Il te faut {sardines-grillees*2} de sardines entières. Si le poissonnier ne l'a pas fait, vide-les en ouvrant le ventre au couteau, rince-les sous l'eau froide et essuie-les bien.",
      "Mélange 1 c. à café de cumin, 1 c. à café de paprika, du sel, 1 gousse d'ail écrasée, du persil haché et le jus d'½ citron. Frotte les sardines avec ce mélange.",
      "Chauffe une poêle-gril ou une poêle antiadhésive à feu vif, sans huile. Pose les sardines 3 à 4 min par face sans les bouger, pour que la peau grille et se décolle facilement. Elles sont cuites quand la chair se détache de l'arête. Au four : 10 min à 220 °C.",
      "Pendant la cuisson, coupe la tomate ({tomate}) en dés avec un peu d'oignon si tu en as, du sel, une pincée de cumin et un filet de citron : c'est ta salade.",
      "Sers les sardines avec le riz et la salade de tomates.",
    ],
    tips: [
      "Le poids compté est celui de la chair cuite, sans arêtes : {sardines-grillees}.",
      "À la poêle, ça enfume la cuisine : ouvre la fenêtre, ou passe au four.",
    ],
  },

  'ex-lentilles-oeufs': {
    prepMin: 10, cookMin: 30,
    tools: ['casserole', 'petite casserole'],
    steps: [
      "Il te faut {lentilles-cuites} de lentilles cuites : soit une boîte rincée et égouttée, soit {lentilles-cuites*0.4} de lentilles sèches, rincées, sans trempage.",
      "Lentilles sèches : mets-les dans une casserole avec 3 fois leur volume d'eau froide, les carottes ({carotte}) épluchées et coupées en rondelles, 1 feuille de laurier et ½ c. à café de cumin. Ne sale pas maintenant : le sel durcit la peau des lentilles.",
      "Porte à ébullition puis laisse frémir 20 à 25 min. Elles sont cuites quand elles s'écrasent facilement entre les doigts mais gardent leur forme. Sale en fin de cuisson et égoutte s'il reste de l'eau. Lentilles en boîte : cuis seulement les carottes 12 min dans l'eau salée, puis ajoute les lentilles 3 min pour les réchauffer.",
      "Pendant ce temps, plonge {oeuf-entier} dans l'eau bouillante : 7 min pour un jaune encore fondant, 9 min pour un jaune ferme. Passe-les sous l'eau froide et écale-les.",
      "Assaisonne lentilles et carottes avec l'huile ({huile-olive}), du sel, du poivre, un filet de vinaigre ou de citron, et un peu d'oignon rouge ou de persil.",
      "Sers tiède avec les œufs coupés en deux.",
    ],
    tips: [
      "Lentilles vertes ou blondes : même cuisson. Les corail cuisent en 10 min et se défont, garde-les pour les soupes.",
    ],
  },

  'ex-yaourt-amandes': {
    prepMin: 2, cookMin: 0,
    tools: [],
    steps: [
      "Verse le yaourt grec ({yaourt-grec-0}) dans un bol.",
      "Concasse grossièrement les amandes ({amandes}) au couteau, ou garde-les entières. Pour plus de goût, fais-les dorer 2 min à sec dans une poêle chaude en remuant.",
      "Parsème les amandes sur le yaourt. Cannelle ou quelques gouttes d'eau de fleur d'oranger si tu aimes.",
    ],
    tips: ["Sans balance : une amande pèse environ 1,2 g."],
  },

  'ex-fromage-blanc-pomme': {
    prepMin: 3, cookMin: 0,
    tools: [],
    steps: [
      "Lave la pomme ({pomme}), coupe-la en quartiers, retire le trognon et coupe-la en dés. Garde la peau : c'est là que sont les fibres.",
      "Verse le fromage blanc ({fromage-blanc-0}) dans un bol et ajoute les dés de pomme.",
      "Saupoudre de cannelle : elle relève le goût sans ajouter de sucre.",
    ],
    tips: ["Version chaude : les dés de pomme 2 min au micro-ondes avec la cannelle, puis sur le fromage blanc froid."],
  },

  'pk-bowl-yaourt-dattes': {
    prepMin: 5, cookMin: 0,
    tools: [],
    steps: [
      "Verse le yaourt grec ({yaourt-grec-0}) dans un bol et mélange-y les flocons d'avoine ({flocons-avoine-crus}).",
      "Laisse reposer 5 min : les flocons gonflent et ramollissent.",
      "Fends la datte ({dattes-medjool}) sur la longueur, retire le noyau et coupe-la en petits morceaux.",
      "Concasse les amandes ({amandes}) au couteau.",
      "Dispose la datte et les amandes sur le bol. Cannelle à volonté.",
    ],
    tips: [
      "Préparé la veille au soir et gardé au frigo, il est prêt au réveil, encore plus fondant.",
      "Pendant le Ramadan, c'est un bon s'hour : rapide et rassasiant.",
    ],
  },

  'pk-pancakes-proteines': {
    prepMin: 10, cookMin: 10,
    tools: ['mixeur ou blender', 'poêle antiadhésive'],
    steps: [
      "Mets dans le mixeur les flocons d'avoine ({flocons-avoine-crus}), la banane ({banane}) en morceaux, {oeuf-entier}, {blanc-oeuf} d'œuf et une pincée de sel. Mixe 30 s, jusqu'à obtenir une pâte lisse.",
      "Laisse reposer la pâte 5 min : les flocons absorbent le liquide et les pancakes se tiennent mieux.",
      "Chauffe la poêle à feu moyen et essuie-la avec un papier imbibé d'une goutte d'huile. Verse une petite louche de pâte par pancake (10 cm environ).",
      "Laisse cuire 2 min, jusqu'à ce que des bulles apparaissent à la surface et que les bords soient pris. Retourne avec une spatule et compte 1 min. S'ils colorent trop vite, baisse le feu : sinon ils brûlent dehors et restent crus dedans.",
      "Continue avec le reste de la pâte : ça fait 4 pancakes environ. Sers avec le miel ({miel}) en filet.",
    ],
    tips: [
      "Garde les premiers au chaud dans une assiette couverte d'un torchon.",
      "Cannelle ou fruits rouges dans la pâte pour varier.",
    ],
  },

  'pk-oeufs-khobz-jben': {
    prepMin: 5, cookMin: 5,
    tools: ['poêle antiadhésive'],
    steps: [
      "Coupe la tomate ({tomate}) en quartiers et le jben ({jben}) en tranches. Mets les olives ({olives-vertes}) dans une coupelle.",
      "Casse {oeuf-entier} dans un bol, ajoute du sel, ½ c. à café de cumin et une pincée de paprika, et bats légèrement.",
      "Chauffe la poêle à feu doux à moyen, sans matière grasse ou avec une goutte d'huile essuyée au papier. Verse les œufs.",
      "Remue doucement et sans arrêt à la spatule, en ramenant les bords vers le centre. Retire du feu quand ils sont encore un peu crémeux (2 à 3 min) : ils finissent de cuire dans la poêle chaude.",
      "Réchauffe le khobz ({khobz}) 1 min dans la poêle ou au grille-pain. Sers les œufs saupoudrés de cumin, avec le khobz, le jben, la tomate et les olives.",
    ],
    tips: ["Feu doux, œufs crémeux. Feu fort, œufs secs et caoutchouteux."],
  },

  'pk-shake-banane-avoine': {
    prepMin: 3, cookMin: 0,
    tools: ['blender ou mixeur'],
    steps: [
      "Verse le lait ({lait-demi-ecreme*1 ml}) dans le blender en premier : les lames tournent mieux.",
      "Ajoute la banane ({banane}) en morceaux, les flocons d'avoine ({flocons-avoine-crus}) et la whey ({whey}).",
      "Mixe 30 à 45 s, jusqu'à ce que les flocons ne fassent plus de grains. Ajoute quelques glaçons et mixe encore 10 s si tu le veux bien frais.",
      "Bois-le tout de suite : les flocons l'épaississent en quelques minutes.",
    ],
    tips: [
      "Banane congelée en rondelles : shake épais comme un milkshake, sans glaçons.",
      "Sans blender : flocons fins, banane écrasée à la fourchette, et un shaker.",
    ],
  },

  'pk-kefta-oeufs': {
    prepMin: 15, cookMin: 30,
    tools: ['tajine ou sauteuse avec couvercle'],
    steps: [
      "Prépare la kefta : mélange le bœuf haché ({boeuf-hache-5}) avec ½ c. à café de cumin, ½ c. à café de paprika, une pincée de piment, du sel, du poivre et 1 c. à soupe de persil et de coriandre hachés. Malaxe 1 min à la main pour que ça se tienne.",
      "Forme des boulettes de la taille d'une noix, les mains mouillées pour que la viande ne colle pas.",
      "Râpe ou coupe très finement les tomates ({tomate}), émince l'oignon ({oignon}) et hache 1 gousse d'ail.",
      "Chauffe l'huile ({huile-olive}) à feu moyen. Fais revenir l'oignon et l'ail 3 min, puis ajoute les tomates, ½ c. à café de cumin, ½ c. à café de paprika, du sel, du poivre et un demi-verre d'eau. Laisse mijoter 10 min à couvert.",
      "Dépose les boulettes dans la sauce, couvre et laisse cuire 10 à 12 min à feu doux en les retournant à mi-cuisson. La sauce doit réduire et devenir épaisse.",
      "Creuse un petit puits dans la sauce et casse {oeuf-entier} dedans. Couvre et compte 4 à 5 min : le blanc doit être pris et le jaune encore coulant.",
      "Parsème de coriandre et sers aussitôt, dans le tajine, avec le khobz ({khobz}).",
    ],
    tips: [
      "Sur un tajine en terre, utilise un diffuseur et un feu doux : il craint les chocs de chaleur.",
      "Jaune bien cuit : 2 min de plus à couvert.",
    ],
  },

  'pk-harira-poulet': {
    prepMin: 15, cookMin: 45,
    tools: ['grande casserole ou cocotte', 'fouet'],
    steps: [
      "Pois chiches : le plus simple est la boîte, rincée et égouttée ({pois-chiches-cuits}). Lentilles : {lentilles-cuites*0.4} de lentilles sèches, rincées, qui cuiront dans la soupe.",
      "Râpe ou mixe les tomates ({tomate}) en purée. Hache finement l'oignon ({oignon}), une petite branche de céleri, et une bonne poignée de coriandre et de persil (garde-en un peu pour la fin).",
      "Coupe le blanc de poulet ({poulet-blanc-cuit*1.35} cru) en petits dés. Chauffe l'huile ({huile-olive}) dans la casserole à feu moyen et fais revenir le poulet, l'oignon, le céleri et les herbes 5 min avec ½ c. à café de gingembre, ½ c. à café de poivre, ¼ c. à café de curcuma, une pincée de cannelle et du sel.",
      "Ajoute la purée de tomates, les lentilles et environ 500 ml d'eau par portion. Porte à ébullition, puis laisse frémir 25 min à couvert, jusqu'à ce que les lentilles soient tendres.",
      "Ajoute les pois chiches et poursuis 5 min.",
      "La tadouira : délaie la farine ({farine-ble}) dans un demi-verre d'eau froide en fouettant, sans grumeaux. Verse-la en filet dans la soupe frémissante en remuant sans arrêt. Laisse cuire 5 à 10 min en remuant souvent : la harira épaissit et doit napper la cuillère.",
      "Goûte et rectifie le sel et le poivre, ajoute le reste des herbes et un filet de citron. Sers bien chaud, avec la datte ({dattes-medjool}) à côté.",
    ],
    tips: [
      "Verse la tadouira petit à petit : d'un coup, elle fait des grumeaux et attache au fond.",
      "Elle se garde 3 jours au frigo et épaissit en refroidissant : rallonge avec un peu d'eau en la réchauffant.",
    ],
  },

  'pk-loubia-dinde': {
    prepMin: 10, cookMin: 30,
    tools: ['casserole avec couvercle', 'poêle'],
    steps: [
      "Il te faut {haricots-blancs-cuits} de haricots cuits. Le plus rapide : une boîte, rincée et égouttée. En sec : {haricots-blancs-cuits*0.4} de haricots trempés 12 h, puis cuits 1 h à 1 h 30 dans l'eau non salée avant de commencer.",
      "Râpe ou mixe les tomates ({tomate}). Hache l'oignon ({oignon}) et 2 gousses d'ail.",
      "Chauffe les deux tiers de l'huile ({huile-olive} en tout) dans la casserole à feu moyen. Fais revenir l'oignon et l'ail 3 min, puis ajoute les tomates, 1 c. à café de cumin, 1 c. à café de paprika, une pincée de piment, du sel, du poivre et un demi-verre d'eau.",
      "Ajoute les haricots et laisse mijoter 20 min à couvert à feu doux, en remuant de temps en temps. La sauce doit être épaisse et enrober les haricots : ajoute un peu d'eau si elle attache.",
      "Pendant ce temps, coupe l'escalope de dinde ({dinde-escalope-cuite*1.3} crue) en lamelles, sale, poivre et saupoudre de cumin. Fais-la sauter 4 à 5 min à feu vif dans le reste de l'huile, jusqu'à ce qu'elle soit dorée et blanche à cœur.",
      "Sers la loubia parsemée de persil et de coriandre, la dinde par-dessus, avec le khobz ({khobz}).",
    ],
    tips: [
      "Encore meilleure réchauffée, comme toutes les légumineuses.",
      "Un filet de citron au moment de servir réveille la sauce.",
    ],
  },

  'pk-poisson-chermoula': {
    prepMin: 20, cookMin: 30,
    tools: ['four', 'plat allant au four'],
    steps: [
      "Préchauffe le four à 200 °C.",
      "La chermoula : hache finement une grosse poignée de coriandre et de persil et 2 gousses d'ail. Mélange avec 1 c. à café de cumin, 1 c. à café de paprika, une pincée de piment, le jus d'½ citron, du sel et la moitié de l'huile ({huile-olive} en tout).",
      "Il te faut {poisson-blanc-cuit*1.25} de filet cru. Enrobe-le de chermoula et laisse mariner 20 min au frais, jusqu'à 2 h si tu as le temps.",
      "Pendant ce temps, épluche la patate douce ({patate-douce-cuite*1.15} crue) et coupe-la en cubes de 2 cm. Coupe la courgette ({courgette-cuite*1.15} crue) en demi-rondelles épaisses. Mélange-les dans le plat avec le reste de l'huile, du sel et du poivre.",
      "Enfourne les légumes 15 min. Remue, pose le poisson et sa marinade au milieu, et remets 12 à 15 min. Le poisson est cuit quand il devient blanc opaque et se défait en lamelles à la fourchette. La patate douce doit être tendre et un peu dorée.",
      "Sers avec un quartier de citron et le khobz ({khobz}).",
    ],
    tips: [
      "Merlan, colin ou dorade : même chermoula, seul le temps change selon l'épaisseur.",
      "Filet de plus de 2 cm d'épaisseur : 5 min de plus.",
    ],
  },

  'pk-crevettes-riz-poivrons': {
    prepMin: 10, cookMin: 20,
    tools: ['casserole avec couvercle', 'poêle ou wok'],
    steps: [
      "Lance le riz : rince {riz-blanc-cru} de riz, porte {riz-blanc-cru*1.6 ml} d'eau salée à ébullition, verse le riz, couvre et cuis 12 min à feu très doux. Laisse ensuite reposer 5 min hors du feu sans ouvrir.",
      "Il te faut {crevettes-cuites} de crevettes décortiquées cuites, ou {crevettes-cuites*1.25} de crevettes décortiquées crues. Surgelées : décongèle-les 5 min sous l'eau froide et sèche-les bien.",
      "Épépine le poivron ({poivron}) et coupe-le en lanières. Hache 2 gousses d'ail.",
      "Chauffe l'huile ({huile-olive}) dans la poêle à feu vif. Fais sauter le poivron 5 à 6 min : il doit rester un peu croquant et légèrement grillé par endroits.",
      "Ajoute l'ail, ½ c. à café de paprika, une pincée de piment et les crevettes. Crues : 2 à 3 min, jusqu'à ce qu'elles deviennent roses et forment un C (en O, elles sont trop cuites). Déjà cuites : 1 min, juste pour les réchauffer.",
      "Sale, ajoute un filet de citron et de la coriandre hachée, et sers sur le riz.",
    ],
    tips: ["Sors les crevettes du feu dès qu'elles sont roses : trop cuites, elles deviennent caoutchouteuses."],
  },

  'pk-dinde-pates-brocoli': {
    prepMin: 10, cookMin: 15,
    tools: ['grande casserole', 'poêle', 'passoire'],
    steps: [
      "Porte à ébullition une grande casserole d'eau salée (1 L pour 100 g de pâtes).",
      "Coupe le brocoli en petits bouquets ({brocoli-cuit}) et l'escalope de dinde ({dinde-escalope-cuite*1.3} crue) en dés de 2 cm. Sale et poivre la dinde, avec une pincée d'ail en poudre et de paprika.",
      "Verse les pâtes ({pates-crues}) dans l'eau bouillante et lance le minuteur selon le paquet.",
      "Pendant ce temps, chauffe l'huile ({huile-olive}) dans la poêle à feu moyen-vif et fais dorer la dinde 5 à 6 min en la retournant. Elle est cuite quand elle est blanche à cœur.",
      "4 min avant la fin de cuisson des pâtes, ajoute le brocoli dans la même casserole.",
      "Garde un fond de verre d'eau de cuisson, égoutte, puis mélange pâtes et brocoli avec la dinde dans la poêle 1 min, avec un peu d'eau de cuisson. Poivre et filet de citron.",
    ],
    tips: ["Pâtes courtes (penne, fusilli) : elles se mélangent mieux au brocoli."],
  },

  'pk-omelette-thon-pdt': {
    prepMin: 10, cookMin: 20,
    tools: ['casserole', 'poêle antiadhésive avec couvercle'],
    steps: [
      "Il te faut {pommes-terre-cuites} de pommes de terre cuites, soit {pommes-terre-cuites*1.05} crues épluchées. Coupe-les en rondelles de 5 mm et cuis-les 8 à 10 min dans l'eau bouillante salée : elles doivent être tendres mais tenir. Égoutte.",
      "Chauffe l'huile ({huile-olive}) dans la poêle à feu moyen et fais dorer les rondelles 5 min en les retournant.",
      "Bats {oeuf-entier} avec du sel, du poivre et une pincée de cumin ou de paprika. Égoutte et émiette le thon ({thon-naturel-egoutte}), et mélange-le aux œufs avec un peu de persil.",
      "Verse le mélange sur les pommes de terre. Baisse à feu doux, couvre et laisse cuire 6 à 8 min : le dessus doit être pris, à peine tremblotant au centre.",
      "Fais glisser sur une assiette. Sers chaud ou tiède, avec une salade si tu veux.",
    ],
    tips: ["Pour la dorer des deux côtés : pose une assiette sur la poêle, retourne d'un coup, et fais glisser l'omelette 2 min de l'autre côté."],
  },

  'pk-lben-dattes': {
    prepMin: 2, cookMin: 0,
    tools: [],
    steps: [
      "Secoue la bouteille et verse le lben ({lben*1 ml}) bien frais dans un grand verre.",
      "Fends la datte ({dattes-medjool}) sur la longueur et retire le noyau.",
      "Accompagne d'une poignée d'amandes ({amandes}).",
    ],
    tips: ["Pendant le Ramadan, c'est la façon classique de rompre le jeûne avant le ftour."],
  },

  'pk-fromage-blanc-miel': {
    prepMin: 3, cookMin: 2,
    tools: ['petite poêle (facultatif)'],
    steps: [
      "Verse le fromage blanc ({fromage-blanc-0}) dans un bol et fouette-le 20 s à la fourchette : il devient plus onctueux.",
      "Fais dorer les amandes ({amandes}) 2 min à sec dans une poêle chaude en remuant, puis concasse-les. C'est facultatif, mais elles sont bien plus parfumées.",
      "Parsème les amandes et verse le miel ({miel}) en filet.",
    ],
    tips: ["Sans balance : une cuillère à café de miel pèse environ 7 g, une cuillère à soupe 20 g."],
  },

  'pk-oeufs-durs-pomme': {
    prepMin: 2, cookMin: 12,
    tools: ['petite casserole'],
    steps: [
      "Porte une petite casserole d'eau à ébullition. Dépose délicatement {oeuf-entier} avec une cuillère : sortis du frigo quelques minutes avant, ils ne se fêlent pas.",
      "Compte 10 min à petits bouillons pour des œufs durs.",
      "Plonge-les dans un bol d'eau froide 2 min : la coquille s'enlève plus facilement et le jaune ne verdit pas.",
      "Écale-les, sale et poivre (une pincée de cumin, c'est très bon), et accompagne de la pomme ({pomme}).",
    ],
    tips: ["Les œufs durs se gardent 4 jours au frigo dans leur coquille : fais-en plusieurs d'un coup."],
  },

  'pk-shake-whey': {
    prepMin: 2, cookMin: 0,
    tools: ['shaker'],
    steps: [
      "Verse le lait froid ({lait-demi-ecreme*1 ml}) dans le shaker en premier : la poudre se mélange mieux.",
      "Ajoute la whey ({whey}), ferme bien et secoue 15 à 20 s.",
      "Bois-le dans la foulée.",
    ],
    tips: ["Le plus rapide après la séance pour avancer sur tes protéines de la journée."],
  },
}

const tokenIds = (steps: string[]) => [...steps.join(' ').matchAll(/\{([a-z0-9-]+)/g)].map((m) => m[1])

/**
 * Ajoute la fiche de préparation à une recette fournie. Sans effet si la recette a déjà des étapes,
 * ou si l'utilisateur a retiré un ingrédient cité dans les étapes. La note d'origine (une phrase)
 * est remplacée par la fiche, sauf si l'utilisateur l'a modifiée.
 */
export function withGuide(r: Recipe, seedNotes: (string | undefined)[] = [r.notes]): Recipe {
  const g = GUIDES[r.id]
  if (!g || r.steps !== undefined) return r
  const ids = new Set(r.ingredients.map((i) => i.foodId))
  if (!tokenIds([...g.steps, ...(g.tips ?? [])]).every((id) => ids.has(id))) return r
  const notes = !r.notes || seedNotes.includes(r.notes) ? undefined : r.notes
  return { ...r, ...g, notes }
}
