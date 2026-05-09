export const CATEGORY_CATALOG = [
  {
    id: "personal",
    title: {
      ru: "Личные",
      en: "Personal"
    },
    description: {
      ru: "Намерения, основанные на внутренних переживаниях, привычках и личных целях персонажа.",
      en: "Intentions driven by inner mood, habits, and personal goals."
    },
    examples: {
      ru: [
        "Персонаж хочет восстановить своё честное имя.",
        "Персонаж ставит себе цель не ругаться весь раунд.",
        "Персонаж хочет поднять настроение окружающим."
      ],
      en: [
        "The character wants to restore their good name.",
        "The character sets a goal to avoid swearing for the whole round.",
        "The character wants to lift the mood of the crew."
      ]
    }
  }
,
  {
    id: "social",
    title: {
      ru: "Социальные",
      en: "Social"
    },
    description: {
      ru: "Сценарии про отношения с экипажем, встречи, мероприятия и общественную жизнь станции.",
      en: "Scenarios about relationships, meetings, events, and station social life."
    },
    examples: {
      ru: [
        "Организуй неформальную встречу коллег в баре.",
        "Проведи маленькое мероприятие или игру.",
        "Подготовь и распространи петицию."
      ],
      en: [
        "Organize an informal department gathering at the bar.",
        "Run a small event, game, or contest.",
        "Write and circulate a petition."
      ]
    }
  },
  {
    id: "professional",
    title: {
      ru: "Профессиональные",
      en: "Professional"
    },
    description: {
      ru: "Намерения, завязанные на должности и рабочих обязанностях персонажа.",
      en: "Intentions tied to the character's job and day-to-day duties."
    },
    examples: {
      ru: [
        "Проведи мини-инструктаж по здоровью для экипажа.",
        "Придумай и представь уникальное блюдо и напиток.",
        "Регулярно уточняй состояние и нужды отделов."
      ],
      en: [
        "Give a short health briefing to the crew.",
        "Invent and present a unique dish and drink.",
        "Regularly check in with departments about their current needs."
      ]
    }
  },
  {
    id: "conflict",
    title: {
      ru: "Конфликтные",
      en: "Conflict"
    },
    description: {
      ru: "Сценарии с соперничеством, противостоянием, давлением или расследованием против кого-то.",
      en: "Scenarios built around rivalry, opposition, pressure, or informal investigation."
    },
    examples: {
      ru: [
        "Добейся, чтобы другого сотрудника перестали воспринимать всерьёз.",
        "Оспаривай решения командования и продвигай альтернативы.",
        "Подставь другого члена экипажа так, чтобы он выглядел виноватым."
      ],
      en: [
        "Undermine another crew member's reputation.",
        "Challenge command decisions and push alternatives.",
        "Set someone up so they look responsible."
      ]
    }
  },
  {
    id: "criminal",
    title: {
      ru: "Криминальные / незаконные",
      en: "Criminal / Illegal"
    },
    description: {
      ru: "Нелегальные действия: кражи, мошенничество, подлог, похищения и другие нарушения.",
      en: "Illegal actions such as theft, fraud, forgery, abduction, and similar misconduct."
    },
    examples: {
      ru: [
        "Незаметно присвой себе что-нибудь ценное.",
        "Подделай документ и получи выгоду.",
        "Соверши нелетальное нападение и не оставь следов."
      ],
      en: [
        "Quietly pocket something valuable.",
        "Forge a document for personal gain.",
        "Pull off a non-lethal assault without leaving evidence."
      ]
    }
  },
  {
    id: "sabotage",
    title: {
      ru: "Диверсионные",
      en: "Sabotage"
    },
    description: {
      ru: "Сценарии саботажа станции, цепочек поставок, систем жизнеобеспечения и отвлекающих инцидентов.",
      en: "Sabotage scenarios aimed at supplies, station systems, or manufactured distractions."
    },
    examples: {
      ru: [
        "Нарушь цепочку поставок или саботируй снабжение.",
        "Вмешайся в энергетику или жизнеобеспечение так, чтобы сбои казались случайными.",
        "Создай ложные угрозы, отвлекающие безопасность."
      ],
      en: [
        "Disrupt supply flow or cargo delivery.",
        "Interfere with power or life support so failures look accidental.",
        "Create false threats that keep security busy."
      ]
    }
  },
  {
    id: "antag",
    title: {
      ru: "Антагонистические",
      en: "Antagonist"
    },
    description: {
      ru: "Особые намерения, связанные с ролевой логикой антагонистов.",
      en: "Special intentions linked to antagonist roleplay and manipulation."
    },
    examples: {
      ru: [
        "Найди недовольного члена экипажа и мягко склони к сотрудничеству.",
        "Сделай так, чтобы цель начала на тебя полагаться.",
        "Используй чужой голос или репутацию, чтобы создать путаницу."
      ],
      en: [
        "Find a dissatisfied crew member and gently recruit them.",
        "Make your target rely on you over time.",
        "Use another person's voice or reputation to create confusion."
      ]
    }
  },
  {
    id: "events",
    title: {
      ru: "Событийные / праздничные",
      en: "Events / Holiday"
    },
    description: {
      ru: "Сценарии, приуроченные к праздникам, датам и специальным станционным событиям.",
      en: "Scenarios tied to holidays, seasonal events, and special station moments."
    },
    examples: {
      ru: [
        "Подготовь подарок для Тайного Санты.",
        "Организуй маленький день рождения для члена экипажа.",
        "Устрой романтическую встречу на День святого Валентина."
      ],
      en: [
        "Prepare a Secret Santa gift.",
        "Arrange a small birthday surprise for a crew member.",
        "Set up a Valentine's Day meeting for two people."
      ]
    }
  },
  {
    id: "admin",
    title: {
      ru: "Административные",
      en: "Admin"
    },
    description: {
      ru: "Сценарии, запускаемые вручную администраторами для сюжетов, тематических раундов и обучающих режимов.",
      en: "Scenarios launched manually by admins for events, themed rounds, and guided experiences."
    },
    examples: {
      ru: [
        "Внезапная инспекция Центрального Командования.",
        "Предварительный брифинг для командного состава.",
        "Служебные подсказки и правила для специального режима."
      ],
      en: [
        "A surprise Central Command inspection.",
        "A pre-briefed command-side event scenario.",
        "Rule and hint scenarios for a special game mode."
      ]
    }
  }
];

function humanizeDictionaryValue(value) {
  return value
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .trim();
}

export function buildDictionaryLabel(id, entry) {
  if (!entry) {
    return humanizeDictionaryValue(id) || id;
  }

  const english = entry.en ?? humanizeDictionaryValue(id) ?? id;
  const russian = entry.ru;
  if (!russian) {
    return english;
  }

  return {
    ru: `${id} · ${russian}`,
    en: english
  };
}

export const VALUE_DICTIONARIES = {
  gameModes: [
    "AllAtOnce",
    "AllerAtOnce",
    "Deathmatch",
    "Dynamic",
    "Extended",
    "Greenshift",
    "KesslerSyndrome",
    "Nukeops",
    "Revolutionary",
    "Sandbox",
    "Secret",
    "Survival",
    "Traitor",
    "Wizard",
    "Xenoborgs",
    "Zombie",
    "Zombieteors"
  ],
  eventTags: [
    "AnimalsDay",
    "AnzacDay",
    "AprilFoolDay",
    "ArmisticeDay",
    "AutismAwarenessDay",
    "BastilleDay",
    "BeerDay",
    "Birthday13",
    "Birthday14",
    "BoxingDay",
    "CanadianThanksgiving",
    "ChineseNewYear",
    "Christmas",
    "CosmonauticsDay",
    "DoctorDay",
    "EarthDay",
    "Easter",
    "FathersDay",
    "FestiveSeason",
    "FirefighterDay",
    "FlowersDay",
    "FourTwenty",
    "FridayThirteenth",
    "FriendshipDay",
    "GarbageDay",
    "GroundhogDay",
    "Halloween",
    "InternationalPicnicDay",
    "KindnessDay",
    "LaborDay",
    "LeapDay",
    "LifeDay",
    "MayanDoomsday",
    "MikuDay",
    "MisterLizard",
    "MoMMIDay",
    "MonkeyDay",
    "MothersDay",
    "NewYear",
    "OwlAndPussycatDay",
    "PiDay",
    "ProgrammersDay",
    "RandomKindness",
    "SayingHelloDay",
    "Sinterklaas",
    "SmilingDay",
    "StPatricksDay",
    "StupidQuestionsDay",
    "SummerSolstice",
    "TalkLikeAPirateDay",
    "TeaDay",
    "Thanksgiving",
    "TowelDay",
    "UFODay",
    "USIndependenceDay",
    "ValentinesDay",
    "VeganDay",
    "WritersDay"
  ],
  jobs: [
    "AtmosphericTechnician",
    "Bartender",
    "Borg",
    "Botanist",
    "Captain",
    "CargoTechnician",
    "CBURN",
    "CentralCommandOfficial",
    "Chaplain",
    "Chef",
    "Chemist",
    "ChiefEngineer",
    "ChiefMedicalOfficer",
    "Clown",
    "DeathSquad",
    "Detective",
    "ERTChaplain",
    "ERTEngineer",
    "ERTJanitor",
    "ERTLeader",
    "ERTMedical",
    "ERTSecurity",
    "HeadOfPersonnel",
    "HeadOfSecurity",
    "Janitor",
    "Lawyer",
    "Librarian",
    "MedicalDoctor",
    "MedicalIntern",
    "Mime",
    "Musician",
    "Paramedic",
    "Passenger",
    "Psychologist",
    "Quartermaster",
    "Reporter",
    "ResearchAssistant",
    "ResearchDirector",
    "SalvageSpecialist",
    "Scientist",
    "SecurityCadet",
    "SecurityOfficer",
    "ServiceWorker",
    "StationAi",
    "StationEngineer",
    "TechnicalAssistant",
    "Visitor",
    "Warden"
  ],
  departments: [
    "Cargo",
    "CentralCommand",
    "Civilian",
    "Command",
    "Engineering",
    "Medical",
    "Science",
    "Security",
    "Silicon",
    "Specific"
  ],
  species: [
    "Arachnid",
    "Diona",
    "Dwarf",
    "Gingerbread",
    "Human",
    "Moth",
    "Reptilian",
    "Skeleton",
    "SlimePerson",
    "Vox",
    "Vulpkanin"
  ],
  sex: [
    "Female",
    "Male",
    "Unsexed"
  ],
  traits: [
    "Accentless",
    "Blindness",
    "FrenchAccent",
    "FrontalLisp",
    "GermanAccent",
    "Hemophilia",
    "ImpairedMobility",
    "Liar",
    "LightweightDrunk",
    "Monochromacy",
    "Muted",
    "Narcolepsy",
    "Pacifist",
    "PainNumbness",
    "Paracusia",
    "PoorVision",
    "ScottishAccent",
    "Snoring",
    "SocialAnxiety",
    "SouthernAccent",
    "SpanishAccent",
    "Unrevivable"
  ],
  antagRoles: [
    "Changeling",
    "Dragon",
    "GenericAntagonist",
    "GenericFreeAgent",
    "GenericSiliconAntagonist",
    "GenericTeamAntagonist",
    "HeadRev",
    "InitialInfected",
    "MothershipCore",
    "Nukeops",
    "NukeopsCommander",
    "NukeopsMedic",
    "ParadoxClone",
    "Rev",
    "SpaceNinja",
    "SubvertedSilicon",
    "Survivor",
    "Thief",
    "Traitor",
    "TraitorSleeper",
    "Wizard",
    "Xenoborg",
    "Zombie"
  ],
  objectiveTypes: [
    "AltarNanotrasenStealObjective",
    "AmePartFlatpackStealObjective",
    "BaseCaptainObjective",
    "BaseChangelingObjective",
    "BaseCMOStealObjective",
    "BaseCodeObjective",
    "BaseDragonObjective",
    "BaseFreeObjective",
    "BaseHelpProgressObjective",
    "BaseKeepAliveObjective",
    "BaseKillObjective",
    "BaseLivingObjective",
    "BaseNinjaObjective",
    "BaseObjective",
    "BaseParadoxCloneObjective",
    "BaseRDStealObjective",
    "BaseSocialObjective",
    "BaseStealObjective",
    "BaseSurviveObjective",
    "BaseTargetObjective",
    "BaseThiefObjective",
    "BaseThiefStealAnimalObjective",
    "BaseThiefStealCollectionObjective",
    "BaseThiefStealObjective",
    "BaseThiefStealStructureObjective",
    "BaseTraitorObjective",
    "BaseTraitorSocialObjective",
    "BaseTraitorStealObjective",
    "BaseWizardObjective",
    "BingusStealObjective",
    "BoozeDispenserStealObjective",
    "CaptainGunStealObjective",
    "CaptainIDStealObjective",
    "CaptainJetpackStealObjective",
    "CaptainSwordStealObjective",
    "CargoShuttleCircuitboardStealObjective",
    "CarpRiftsObjective",
    "ChangelingSurviveObjective",
    "ChemDispenserStealObjective",
    "ChiefEngineerToolbeltStealObjective",
    "ClipboardStealObjective",
    "ClothingEyesHudsStealCollectionObjective",
    "ClothingHeadHatWardenStealObjective",
    "ClothingHeadsetAltMedicalStealObjective",
    "ClothingNeckClownmedalStealObjective",
    "CMOCrewMonitorStealObjective",
    "CMOHyposprayStealObjective",
    "CorgiMeatStealObjective",
    "DieObjective",
    "DoorjackObjective",
    "DoorRemoteStealCollectionObjective",
    "DragonSurviveObjective",
    "EnergyMagnumStealObjective",
    "EscapeShuttleObjective",
    "EscapeThiefShuttleObjective",
    "FaxMachineCaptainStealObjective",
    "FlippoEngravedLighterStealObjective",
    "FreezerHeaterStealObjective",
    "HandTeleporterStealObjective",
    "HeadBedsheetStealCollectionObjective",
    "HeadCloakStealCollectionObjective",
    "HijackTradeStationObjective",
    "IanStealObjective",
    "IDCardsStealCollectionObjective",
    "KillRandomHeadObjective",
    "KillRandomPersonObjective",
    "KillStationAiObjective",
    "KnuckleDustersStealObjective",
    "LAMPStealCollectionObjective",
    "MagbootsStealObjective",
    "MailStealCollectionObjective",
    "MassArrestObjective",
    "McGriffStealObjective",
    "MedicalTechFabCircuitboardStealObjective",
    "MortyStealObjective",
    "NinjaSurviveObjective",
    "NuclearBombStealObjective",
    "NukeDiskStealObjective",
    "OfficerHandgunsStealCollectionObjective",
    "ParadoxCloneKillObjective",
    "ParadoxCloneLivingObjective",
    "PlantRDStealObjective",
    "RandomTraitorAliveObjective",
    "RandomTraitorProgressObjective",
    "RDHardsuitStealObjective",
    "RenaultStealObjective",
    "ShivaStealObjective",
    "SpiderChargeObjective",
    "StampStealCollectionObjective",
    "StealResearchObjective",
    "SupercritAnomaliesObjective",
    "TechnologyDiskStealCollectionObjective",
    "TegStealObjective",
    "TerrorObjective",
    "ToiletGoldenStealObjective",
    "TropicoStealObjective",
    "WalterStealObjective",
    "WantedListCartridgeStealObjective",
    "WizardDemonstrateObjective",
    "WizardSurviveObjective",
    "XenoArtifactStealObjective"
  ]
};

const GAME_MODE_LABELS = {
  AllAtOnce: { ru: "Все и сразу", en: "All At Once" },
  AllerAtOnce: { ru: "Aller At Once", en: "Aller At Once" },
  Deathmatch: { ru: "Смертельный матч", en: "Deathmatch" },
  Dynamic: { ru: "Динамический", en: "Dynamic" },
  Extended: { ru: "Расширенный", en: "Extended" },
  Greenshift: { ru: "Гриншифт", en: "Greenshift" },
  KesslerSyndrome: { ru: "Синдром Кесслера", en: "Kessler Syndrome" },
  Nukeops: { ru: "Ядерные оперативники", en: "Nuclear Operatives" },
  Revolutionary: { ru: "Революция", en: "Revolutionary" },
  Sandbox: { ru: "Песочница", en: "Sandbox" },
  Secret: { ru: "Секрет", en: "Secret" },
  Survival: { ru: "Выживание", en: "Survival" },
  Traitor: { ru: "Предатели", en: "Traitor" },
  Wizard: { ru: "Волшебник", en: "Wizard" },
  Xenoborgs: { ru: "Ксеноборги", en: "Xenoborgs" },
  Zombie: { ru: "Зомби", en: "Zombie" },
  Zombieteors: { ru: "Зомби-метеоры", en: "Zombieteors" }
};

const EVENT_TAG_LABELS = {
  AnimalsDay: { ru: "День животных", en: "Animals Day" },
  AnzacDay: { ru: "День АНЗАК", en: "Anzac Day" },
  AprilFoolDay: { ru: "День смеха", en: "April Fools Day" },
  ArmisticeDay: { ru: "День перемирия", en: "Armistice Day" },
  AutismAwarenessDay: { ru: "День осведомлённости об аутизме", en: "Autism Awareness Day" },
  BastilleDay: { ru: "День взятия Бастилии", en: "Bastille Day" },
  BeerDay: { ru: "День пива", en: "Beer Day" },
  Birthday13: { ru: "День рождения Space Station 13", en: "Space Station 13 Birthday" },
  Birthday14: { ru: "День рождения Space Station 14", en: "Space Station 14 Birthday" },
  BoxingDay: { ru: "День подарков", en: "Boxing Day" },
  CanadianThanksgiving: { ru: "Канадский День благодарения", en: "Canadian Thanksgiving" },
  ChineseNewYear: { ru: "Китайский Новый год", en: "Chinese New Year" },
  Christmas: { ru: "Рождество", en: "Christmas" },
  CosmonauticsDay: { ru: "День космонавтики", en: "Cosmonautics Day" },
  DoctorDay: { ru: "День врача", en: "Doctor's Day" },
  EarthDay: { ru: "День Земли", en: "Earth Day" },
  Easter: { ru: "Пасха", en: "Easter" },
  FathersDay: { ru: "День отца", en: "Father's Day" },
  FestiveSeason: { ru: "Праздничный сезон", en: "Festive Season" },
  FirefighterDay: { ru: "День пожарного", en: "Firefighter's Day" },
  FlowersDay: { ru: "День цветов", en: "Flowers Day" },
  FridayThirteenth: { ru: "Пятница, 13-е", en: "Friday the 13th" },
  FriendshipDay: { ru: "День дружбы", en: "Friendship Day" },
  GarbageDay: { ru: "День мусора", en: "Garbage Day" },
  GroundhogDay: { ru: "День сурка", en: "Groundhog Day" },
  Halloween: { ru: "Хэллоуин", en: "Halloween" },
  InternationalPicnicDay: { ru: "Международный день пикника", en: "International Picnic Day" },
  KindnessDay: { ru: "День доброты", en: "Kindness Day" },
  LaborDay: { ru: "День труда", en: "Labor Day" },
  LeapDay: { ru: "Високосный день", en: "Leap Day" },
  LifeDay: { ru: "День жизни", en: "Life Day" },
  MayanDoomsday: { ru: "Годовщина конца света майя", en: "Mayan Doomsday Anniversary" },
  MikuDay: { ru: "День Хацунэ Мику", en: "Hatsune Miku Day" },
  MisterLizard: { ru: "День рождения мистера Ящера", en: "Mister Lizard's Birthday" },
  MonkeyDay: { ru: "День обезьян", en: "Monkey Day" },
  MothersDay: { ru: "День матери", en: "Mother's Day" },
  NewYear: { ru: "Новый год", en: "New Year" },
  OwlAndPussycatDay: { ru: "День совы и кошечки", en: "Owl and Pussycat Day" },
  PiDay: { ru: "День числа Пи", en: "Pi Day" },
  ProgrammersDay: { ru: "День программиста", en: "Programmers' Day" },
  RandomKindness: { ru: "День случайных добрых дел", en: "Random Acts of Kindness Day" },
  SayingHelloDay: { ru: "День приветствий", en: "Saying Hello Day" },
  Sinterklaas: { ru: "Синтерклаас", en: "Sinterklaas" },
  SmilingDay: { ru: "День улыбки", en: "Smiling Day" },
  StPatricksDay: { ru: "День святого Патрика", en: "St. Patrick's Day" },
  StupidQuestionsDay: { ru: "День глупых вопросов", en: "Stupid Questions Day" },
  SummerSolstice: { ru: "Летнее солнцестояние", en: "Summer Solstice" },
  TalkLikeAPirateDay: { ru: "День пиратской речи", en: "Talk-Like-a-Pirate Day" },
  TeaDay: { ru: "День чая", en: "National Tea Day" },
  Thanksgiving: { ru: "День благодарения", en: "Thanksgiving" },
  TowelDay: { ru: "День полотенца", en: "Towel Day" },
  UFODay: { ru: "День НЛО", en: "UFO Day" },
  USIndependenceDay: { ru: "День независимости США", en: "US Independence Day" },
  ValentinesDay: { ru: "День святого Валентина", en: "Valentine's Day" },
  VeganDay: { ru: "День вегана", en: "Vegan Day" },
  WritersDay: { ru: "День писателя", en: "Writer's Day" }
};

const OBJECTIVE_TYPE_LABEL_OVERRIDES = {
  CarpRiftsObjective: { ru: "Открыть разломы карпов", en: "Open carp rifts objective" },
  DieObjective: { ru: "Погибнуть", en: "Die objective" },
  DoorjackObjective: { ru: "Взлом дверей", en: "Doorjack objective" },
  EscapeShuttleObjective: { ru: "Побег на шаттле", en: "Escape on shuttle objective" },
  EscapeThiefShuttleObjective: { ru: "Побег вора на шаттле", en: "Thief shuttle escape objective" },
  HijackTradeStationObjective: { ru: "Угон торговой станции", en: "Hijack trade station objective" },
  KillRandomHeadObjective: { ru: "Устранить случайного главу", en: "Kill random head objective" },
  KillRandomPersonObjective: { ru: "Устранить случайного персонажа", en: "Kill random person objective" },
  KillStationAiObjective: { ru: "Устранить ИИ станции", en: "Kill station AI objective" },
  MassArrestObjective: { ru: "Массовые аресты", en: "Mass arrest objective" },
  ParadoxCloneKillObjective: { ru: "Устранение парадоксального клона", en: "Paradox clone kill objective" },
  ParadoxCloneLivingObjective: { ru: "Выживание парадоксального клона", en: "Paradox clone survival objective" },
  RandomTraitorAliveObjective: { ru: "Сохранить предателя в живых", en: "Keep fellow traitor alive objective" },
  RandomTraitorProgressObjective: { ru: "Помочь прогрессу предателя", en: "Help fellow traitor progress objective" },
  SpiderChargeObjective: { ru: "Подрыв паучьего заряда", en: "Spider charge objective" },
  StealResearchObjective: { ru: "Кража исследований", en: "Steal research objective" },
  SupercritAnomaliesObjective: { ru: "Вывести аномалии в сверхкрит", en: "Supercritical anomalies objective" },
  TerrorObjective: { ru: "Террор", en: "Terror objective" },
  WizardDemonstrateObjective: { ru: "Продемонстрировать силу волшебника", en: "Wizard demonstration objective" },
  WizardSurviveObjective: { ru: "Выжить волшебником", en: "Wizard survival objective" }
};

const OBJECTIVE_TYPE_TOKEN_RU = {
  Altar: "алтарь",
  Ame: "ДАМ",
  Animal: "животное",
  Base: "базовая",
  Bedsheet: "простыня",
  Bingus: "Бингус",
  Bomb: "бомба",
  Booze: "алко",
  Captain: "капитан",
  Cargo: "карго",
  Cards: "карты",
  Cartridge: "картридж",
  Chem: "хим",
  Chief: "шеф",
  Circuitboard: "плата",
  Clipboard: "планшет",
  Clone: "клон",
  Clothing: "одежда",
  Cloak: "плащ",
  CMO: "главврач",
  Code: "коды",
  Collection: "коллекция",
  Corgi: "корги",
  Crew: "экипаж",
  Demonstrate: "демонстрация",
  Dispenser: "раздатчик",
  Door: "дверь",
  Dragon: "дракон",
  Engineer: "инженер",
  Energy: "энергетический",
  Eyes: "очки",
  Fab: "фаб",
  Fax: "факс",
  Flatpack: "упаковка",
  Flippo: "Флиппо",
  Free: "свободная",
  Freezer: "морозильник",
  Gun: "пистолет",
  Hand: "ручной",
  Handguns: "пистолеты",
  Hat: "шляпа",
  Head: "голова",
  Heater: "нагреватель",
  Help: "помощь",
  Huds: "HUD",
  Hypospray: "гипоспрей",
  Ian: "Иан",
  ID: "ID",
  Hijack: "угон",
  Jetpack: "джетпак",
  Keep: "сохранение",
  Kill: "устранение",
  Knuckle: "кастет",
  LAMP: "ЛАМП",
  List: "список",
  Living: "выживание",
  Magboots: "магбуты",
  Magnum: "магнум",
  Mail: "почта",
  Mass: "массовый",
  McGriff: "МакГрифф",
  Meat: "мясо",
  Medical: "медицинский",
  Monitor: "монитор",
  Morty: "Морти",
  Nanotrasen: "Нанотрейзен",
  Neck: "шея",
  Ninja: "ниндзя",
  Nuclear: "ядерный",
  Nuke: "нюк",
  Objective: "цель",
  Officer: "офицер",
  Part: "часть",
  Paradox: "парадокс",
  Person: "персонаж",
  Plant: "растение",
  Progress: "прогресс",
  RD: "НИО",
  Random: "случайный",
  Renault: "Рено",
  Research: "исследования",
  Remote: "пульт",
  Shiva: "Шива",
  Social: "социальная",
  Spider: "паучий",
  Stamp: "штамп",
  Station: "станция",
  Steal: "кража",
  Structure: "структура",
  Survive: "выживание",
  Sword: "меч",
  Target: "цель",
  Tech: "тех",
  Technology: "технологический",
  Teg: "Тег",
  Teleporter: "телепортер",
  Terror: "террор",
  Thief: "вор",
  Toilet: "туалет",
  Toolbelt: "пояс для инструментов",
  Trade: "торговый",
  Traitor: "предатель",
  Tropico: "Тропико",
  Walter: "Вальтер",
  Wanted: "разыскиваемых",
  Warden: "смотритель",
  Wizard: "волшебник",
  Xeno: "ксено",
  Artifact: "артефакт"
};

function splitCamelTokens(value) {
  return value
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function translateObjectivePhraseRu(value) {
  return splitCamelTokens(value)
    .map(token => OBJECTIVE_TYPE_TOKEN_RU[token] ?? token)
    .join(" ");
}

function buildObjectiveTypeRussianLabel(id) {
  const override = OBJECTIVE_TYPE_LABEL_OVERRIDES[id];
  if (override) {
    return override.ru;
  }

  const raw = id.replace(/Objective$/, "");

  if (raw.startsWith("Base")) {
    const phrase = translateObjectivePhraseRu(raw.slice(4));
    return phrase ? `Базовая цель: ${phrase}` : "Базовая цель";
  }

  if (raw.endsWith("StealCollection")) {
    return `Кража коллекции: ${translateObjectivePhraseRu(raw.slice(0, -"StealCollection".length))}`;
  }

  if (raw.endsWith("StealStructure")) {
    return `Кража структуры: ${translateObjectivePhraseRu(raw.slice(0, -"StealStructure".length))}`;
  }

  if (raw.endsWith("StealAnimal")) {
    return `Кража животного: ${translateObjectivePhraseRu(raw.slice(0, -"StealAnimal".length))}`;
  }

  if (raw.endsWith("Steal")) {
    return `Кража: ${translateObjectivePhraseRu(raw.slice(0, -"Steal".length))}`;
  }

  if (raw.endsWith("Survive")) {
    return `Выживание: ${translateObjectivePhraseRu(raw.slice(0, -"Survive".length))}`;
  }

  if (raw.endsWith("Kill")) {
    return `Устранение: ${translateObjectivePhraseRu(raw.slice(0, -"Kill".length))}`;
  }

  if (raw.endsWith("Living")) {
    return `Выживание: ${translateObjectivePhraseRu(raw.slice(0, -"Living".length))}`;
  }

  if (raw.endsWith("HelpProgress")) {
    return `Помощь прогрессу: ${translateObjectivePhraseRu(raw.slice(0, -"HelpProgress".length))}`;
  }

  if (raw.endsWith("KeepAlive")) {
    return `Сохранить в живых: ${translateObjectivePhraseRu(raw.slice(0, -"KeepAlive".length))}`;
  }

  if (raw.endsWith("Demonstrate")) {
    return `Демонстрация: ${translateObjectivePhraseRu(raw.slice(0, -"Demonstrate".length))}`;
  }

  return translateObjectivePhraseRu(raw);
}

const OBJECTIVE_TYPE_LABELS = Object.fromEntries(
  VALUE_DICTIONARIES.objectiveTypes.map(id => [
    id,
    {
      ru: buildObjectiveTypeRussianLabel(id),
      en: OBJECTIVE_TYPE_LABEL_OVERRIDES[id]?.en ?? humanizeDictionaryValue(id)
    }
  ])
);

export const LOCALIZED_DICTIONARY_LABELS = {
  gameModes: GAME_MODE_LABELS,
  eventTags: EVENT_TAG_LABELS,
  objectiveTypes: OBJECTIVE_TYPE_LABELS,
  jobs: {
    AtmosphericTechnician: { ru: "Атмосферный техник", en: "Atmospheric Technician" },
    Bartender: { ru: "Бармен", en: "Bartender" },
    Botanist: { ru: "Ботаник", en: "Botanist" },
    Captain: { ru: "Капитан", en: "Captain" },
    CargoTechnician: { ru: "Грузчик", en: "Cargo Technician" },
    Chaplain: { ru: "Священник", en: "Chaplain" },
    Chef: { ru: "Повар", en: "Chef" },
    Chemist: { ru: "Химик", en: "Chemist" },
    ChiefEngineer: { ru: "Старший инженер", en: "Chief Engineer" },
    ChiefMedicalOfficer: { ru: "Главный врач", en: "Chief Medical Officer" },
    Clown: { ru: "Клоун", en: "Clown" },
    Detective: { ru: "Детектив", en: "Detective" },
    HeadOfPersonnel: { ru: "Глава персонала", en: "Head of Personnel" },
    HeadOfSecurity: { ru: "Глава службы безопасности", en: "Head of Security" },
    Janitor: { ru: "Уборщик", en: "Janitor" },
    Lawyer: { ru: "Юрист", en: "Lawyer" },
    Librarian: { ru: "Библиотекарь", en: "Librarian" },
    MedicalDoctor: { ru: "Врач", en: "Medical Doctor" },
    MedicalIntern: { ru: "Интерн", en: "Medical Intern" },
    Mime: { ru: "Мим", en: "Mime" },
    Musician: { ru: "Музыкант", en: "Musician" },
    Paramedic: { ru: "Парамедик", en: "Paramedic" },
    Passenger: { ru: "Пассажир", en: "Passenger" },
    Psychologist: { ru: "Психолог", en: "Psychologist" },
    Quartermaster: { ru: "Квартирмейстер", en: "Quartermaster" },
    Reporter: { ru: "Репортёр", en: "Reporter" },
    ResearchAssistant: { ru: "Научный ассистент", en: "Research Assistant" },
    ResearchDirector: { ru: "Научный руководитель", en: "Research Director" },
    SalvageSpecialist: { ru: "Утилизатор", en: "Salvage Specialist" },
    Scientist: { ru: "Учёный", en: "Scientist" },
    SecurityCadet: { ru: "Кадет СБ", en: "Security Cadet" },
    SecurityOfficer: { ru: "Офицер СБ", en: "Security Officer" },
    ServiceWorker: { ru: "Сервисный работник", en: "Service Worker" },
    StationAi: { ru: "ИИ станции", en: "Station AI" },
    StationEngineer: { ru: "Инженер", en: "Station Engineer" },
    TechnicalAssistant: { ru: "Технический ассистент", en: "Technical Assistant" },
    Warden: { ru: "Смотритель", en: "Warden" },
	Roboticist: { ru: "Робототехник", en: "Roboticist" },
	Boxer: { ru: "Боксёр", en: "Boxer" },
	Zookeeper: { ru: "Зоотехник", en: "Zookeeper" },
  },
  departments: {
    Cargo: { ru: "Снабжение", en: "Cargo" },
    CentralCommand: { ru: "Центральное командование", en: "Central Command" },
    Civilian: { ru: "Сервисный", en: "Civilian" },
    Command: { ru: "Командование", en: "Command" },
    Engineering: { ru: "Инженерный", en: "Engineering" },
    Medical: { ru: "Медицинский", en: "Medical" },
    Science: { ru: "Научный", en: "Science" },
    Security: { ru: "Служба безопасности", en: "Security" },
  },
  species: {
    Arachnid: { ru: "Арахнид", en: "Arachnid" },
    Diona: { ru: "Диона", en: "Diona" },
    Dwarf: { ru: "Дворф", en: "Dwarf" },
    Human: { ru: "Человек", en: "Human" },
    Moth: { ru: "Моль", en: "Moth" },
    Reptilian: { ru: "Рептилоид", en: "Reptilian" },
    SlimePerson: { ru: "Слаймолюд", en: "Slime Person" },
    Vox: { ru: "Вокс", en: "Vox" },
    Vulpkanin: { ru: "Вульпканин", en: "Vulpkanin" }
  },
  sex: {
    Female: { ru: "Женский", en: "Female" },
    Male: { ru: "Мужской", en: "Male" },
    Unsexed: { ru: "Бесполый", en: "Unsexed" }
  },
  traits: {
    Accentless: { ru: "Без акцента", en: "Accentless" },
    Blindness: { ru: "Слепота", en: "Blindness" },
    FrenchAccent: { ru: "Французский акцент", en: "French Accent" },
    FrontalLisp: { ru: "Шепелявость", en: "Frontal Lisp" },
    GermanAccent: { ru: "Немецкий акцент", en: "German Accent" },
    Hemophilia: { ru: "Гемофилия", en: "Hemophilia" },
    ImpairedMobility: { ru: "Ограниченная подвижность", en: "Impaired Mobility" },
    Liar: { ru: "Лжец", en: "Liar" },
    LightweightDrunk: { ru: "Легко пьянеет", en: "Lightweight Drunk" },
    Monochromacy: { ru: "Монохромия", en: "Monochromacy" },
    Muted: { ru: "Немота", en: "Muted" },
    Narcolepsy: { ru: "Нарколепсия", en: "Narcolepsy" },
    Pacifist: { ru: "Пацифист", en: "Pacifist" },
    PainNumbness: { ru: "Нечувствительность к боли", en: "Pain Numbness" },
    Paracusia: { ru: "Паракузия", en: "Paracusia" },
    PoorVision: { ru: "Плохое зрение", en: "Poor Vision" },
    ScottishAccent: { ru: "Шотландский акцент", en: "Scottish Accent" },
    Snoring: { ru: "Храп", en: "Snoring" },
    SocialAnxiety: { ru: "Социальная тревожность", en: "Social Anxiety" },
    SouthernAccent: { ru: "Южный акцент", en: "Southern Accent" },
    SpanishAccent: { ru: "Испанский акцент", en: "Spanish Accent" },
    Unrevivable: { ru: "Неоживляемый", en: "Unrevivable" }
  },
  antagRoles: {
    Changeling: { ru: "Генокрад", en: "Changeling" },
    Dragon: { ru: "Космический дракон", en: "Space Dragon" },
    GenericSiliconAntagonist: { ru: "Кремниевый антагонист", en: "Silicon Antagonist" },
    HeadRev: { ru: "Глава революции", en: "Head Revolutionary" },
    InitialInfected: { ru: "Нулевой заражённый", en: "Initial Infected" },
    MothershipCore: { ru: "Ядро ксеноборга", en: "Xenoborg Core" },
    Nukeops: { ru: "Ядерный оперативник", en: "Nuclear Operative" },
    NukeopsCommander: { ru: "Командир ядерных оперативников", en: "Nuclear Operative Commander" },
    NukeopsMedic: { ru: "Медик ядерных оперативников", en: "Nuclear Operative Corpsman" },
    ParadoxClone: { ru: "Парадоксальный клон", en: "Paradox Clone" },
    Rev: { ru: "Революционер", en: "Revolutionary" },
    SpaceNinja: { ru: "Космический ниндзя", en: "Space Ninja" },
    SubvertedSilicon: { ru: "Взломанный киборг", en: "Subverted Silicon" },
    Survivor: { ru: "Выживший", en: "Survivor" },
    Thief: { ru: "Вор", en: "Thief" },
    Traitor: { ru: "Предатель", en: "Traitor" },
    TraitorSleeper: { ru: "Спящий агент Синдиката", en: "Syndicate Sleeper Agent" },
    Wizard: { ru: "Волшебник", en: "Wizard" },
    Xenoborg: { ru: "Ксеноборг", en: "Xenoborg" },
    Zombie: { ru: "Зомби", en: "Zombie" }
  }
};
