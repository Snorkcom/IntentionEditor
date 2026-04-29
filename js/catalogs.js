import {
  OPERATORS_BY_FIELD_TYPE,
  PREDICATE_OPERATORS,
  PREDICATE_SCOPES
} from "./constants.js";

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
  },
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
    "BisexualPrideDay",
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
    "HumanRightsDay",
    "InternationalPicnicDay",
    "KindnessDay",
    "LaborDay",
    "LeapDay",
    "LesbianDay",
    "LifeDay",
    "MayanDoomsday",
    "MikuDay",
    "MisterLizard",
    "MoMMIDay",
    "MonkeyDay",
    "MothersDay",
    "NationalComingOutDay",
    "NewYear",
    "OwlAndPussycatDay",
    "PiDay",
    "PrideMonth",
    "ProgrammersDay",
    "RandomKindness",
    "SayingHelloDay",
    "Sinterklaas",
    "SmilingDay",
    "SpiritDay",
    "StonewallRiotsAnniversary",
    "StPatricksDay",
    "StupidQuestionsDay",
    "SummerSolstice",
    "TalkLikeAPirateDay",
    "TeaDay",
    "Thanksgiving",
    "TowelDay",
    "TransgenderRemembranceDay",
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

const LOCALIZED_DICTIONARY_LABELS = {
  jobs: {
    AtmosphericTechnician: { ru: "Атмосферный техник", en: "Atmospheric Technician" },
    Bartender: { ru: "Бармен", en: "Bartender" },
    Borg: { ru: "Киборг", en: "Cyborg" },
    Botanist: { ru: "Ботаник", en: "Botanist" },
    Captain: { ru: "Капитан", en: "Captain" },
    CargoTechnician: { ru: "Техник снабжения", en: "Cargo Technician" },
    CBURN: { ru: "Карантинный офицер ЦентКома", en: "CentComm Quarantine Officer" },
    CentralCommandOfficial: { ru: "Представитель ЦентКома", en: "CentComm Official" },
    Chaplain: { ru: "Священник", en: "Chaplain" },
    Chef: { ru: "Повар", en: "Chef" },
    Chemist: { ru: "Химик", en: "Chemist" },
    ChiefEngineer: { ru: "Старший инженер", en: "Chief Engineer" },
    ChiefMedicalOfficer: { ru: "Главный врач", en: "Chief Medical Officer" },
    Clown: { ru: "Клоун", en: "Clown" },
    DeathSquad: { ru: "Отряд смерти", en: "Death Squad" },
    Detective: { ru: "Детектив", en: "Detective" },
    ERTChaplain: { ru: "Священник ОБР", en: "ERT Chaplain" },
    ERTEngineer: { ru: "Инженер ОБР", en: "ERT Engineer" },
    ERTJanitor: { ru: "Уборщик ОБР", en: "ERT Janitor" },
    ERTLeader: { ru: "Лидер ОБР", en: "ERT Leader" },
    ERTMedical: { ru: "Медик ОБР", en: "ERT Medic" },
    ERTSecurity: { ru: "Офицер ОБР", en: "ERT Security" },
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
    SalvageSpecialist: { ru: "Специалист по утилизации", en: "Salvage Specialist" },
    Scientist: { ru: "Учёный", en: "Scientist" },
    SecurityCadet: { ru: "Кадет СБ", en: "Security Cadet" },
    SecurityOfficer: { ru: "Офицер СБ", en: "Security Officer" },
    ServiceWorker: { ru: "Работник сервиса", en: "Service Worker" },
    StationAi: { ru: "ИИ станции", en: "Station AI" },
    StationEngineer: { ru: "Инженер станции", en: "Station Engineer" },
    TechnicalAssistant: { ru: "Технический ассистент", en: "Technical Assistant" },
    Visitor: { ru: "Посетитель", en: "Visitor" },
    Warden: { ru: "Смотритель", en: "Warden" }
  },
  departments: {
    Cargo: { ru: "Снабжение", en: "Cargo" },
    CentralCommand: { ru: "Центральное командование", en: "Central Command" },
    Civilian: { ru: "Гражданский", en: "Civilian" },
    Command: { ru: "Командование", en: "Command" },
    Engineering: { ru: "Инженерный", en: "Engineering" },
    Medical: { ru: "Медицинский", en: "Medical" },
    Science: { ru: "Научный", en: "Science" },
    Security: { ru: "Служба безопасности", en: "Security" },
    Silicon: { ru: "Кремниевые формы жизни", en: "Silicon" },
    Specific: { ru: "Станционный", en: "Station Specific" }
  },
  species: {
    Arachnid: { ru: "Арахнид", en: "Arachnid" },
    Diona: { ru: "Диона", en: "Diona" },
    Dwarf: { ru: "Дворф", en: "Dwarf" },
    Gingerbread: { ru: "Имбирный человечек", en: "Gingerbread" },
    Human: { ru: "Человек", en: "Human" },
    Moth: { ru: "Моль", en: "Moth" },
    Reptilian: { ru: "Рептилоид", en: "Reptilian" },
    Skeleton: { ru: "Скелет", en: "Skeleton" },
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
    GenericAntagonist: { ru: "Одиночный антагонист", en: "Solo Antagonist" },
    GenericFreeAgent: { ru: "Свободный агент", en: "Free Agent" },
    GenericSiliconAntagonist: { ru: "Кремниевый антагонист", en: "Silicon Antagonist" },
    GenericTeamAntagonist: { ru: "Командный антагонист", en: "Team Antagonist" },
    HeadRev: { ru: "Глава революции", en: "Head Revolutionary" },
    InitialInfected: { ru: "Первый заражённый", en: "Initial Infected" },
    MothershipCore: { ru: "Ядро ксеноборга", en: "Xenoborg Core" },
    Nukeops: { ru: "Ядерный оперативник", en: "Nuclear Operative" },
    NukeopsCommander: { ru: "Командир ядерных оперативников", en: "Nuclear Operative Commander" },
    NukeopsMedic: { ru: "Медик ядерных оперативников", en: "Nuclear Operative Corpsman" },
    ParadoxClone: { ru: "Парадоксальный клон", en: "Paradox Clone" },
    Rev: { ru: "Революционер", en: "Revolutionary" },
    SpaceNinja: { ru: "Космический ниндзя", en: "Space Ninja" },
    SubvertedSilicon: { ru: "Взломанный кремний", en: "Subverted Silicon" },
    Survivor: { ru: "Выживший", en: "Survivor" },
    Thief: { ru: "Вор", en: "Thief" },
    Traitor: { ru: "Предатель", en: "Traitor" },
    TraitorSleeper: { ru: "Спящий агент Синдиката", en: "Syndicate Sleeper Agent" },
    Wizard: { ru: "Волшебник", en: "Wizard" },
    Xenoborg: { ru: "Ксеноборг", en: "Xenoborg" },
    Zombie: { ru: "Зомби", en: "Zombie" }
  }
};

function humanizeDictionaryValue(value) {
  return value
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .trim();
}

function buildDictionaryLabel(id, entry) {
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

export const TEXT_BINDING_FIELDS = [
  { id: "characterName", label: { ru: "Имя персонажа", en: "Character name" } },
  { id: "job", label: { ru: "Профессия", en: "Job" } },
  { id: "department", label: { ru: "Отдел", en: "Department" } },
  { id: "age", label: { ru: "Возраст", en: "Age" } },
  { id: "species", label: { ru: "Вид", en: "Species" } },
  { id: "sex", label: { ru: "Пол", en: "Sex" } },
  { id: "traits", label: { ru: "Черты", en: "Traits" } },
  { id: "hasMindshield", label: { ru: "Есть mindshield", en: "Has mindshield" } },
  { id: "antagRole", label: { ru: "Роли антагониста", en: "Antag roles" } },
  { id: "antagObjectiveType", label: { ru: "Типы целей антагониста", en: "Antag objective types" } },
  { id: "mindId", label: { ru: "MindId", en: "MindId" } },
  { id: "ownerEntityUid", label: { ru: "Owner entity uid", en: "Owner entity uid" } }
];

export const ROUND_TEXT_BINDING_FIELDS = [
  { id: "stationName", label: { ru: "Имя станции", en: "Station name" } },
  { id: "stationTime", label: { ru: "Время станции", en: "Station time" } }
];

export const FIELD_DEFINITIONS = {
  round: {
    gameMode: {
      type: "string",
      dictionary: "gameModes",
      label: { ru: "Режим игры", en: "Game mode" }
    },
    stationTime: {
      type: "timespan",
      label: { ru: "Время станции", en: "Station time" }
    },
    crewCount: {
      type: "int",
      label: { ru: "Число членов экипажа", en: "Crew count" }
    },
    securityCount: {
      type: "int",
      label: { ru: "Число сотрудников СБ", en: "Security count" }
    },
    eventTags: {
      type: "list-string",
      dictionary: "eventTags",
      label: { ru: "Теги событий", en: "Event tags" }
    },
    "antagSummary.totalCount": {
      type: "int",
      label: { ru: "Всего антагонистов", en: "Antag total count" }
    },
    "antagSummary.gameModeAntagCount": {
      type: "int",
      label: { ru: "Антагонисты режима", en: "Game-mode antag count" }
    },
    "antagSummary.ghostRoleAntagCount": {
      type: "int",
      label: { ru: "Ghost-role антагонисты", en: "Ghost-role antag count" }
    },
    "antagSummary.byRole": {
      type: "map-int",
      dictionary: "antagRoles",
      keyLabel: { ru: "ID antag role", en: "Antag role id" },
      label: { ru: "Антагонисты по ролям", en: "Antag count by role" }
    },
    "antagSummary.byObjectiveType": {
      type: "map-int",
      dictionary: "objectiveTypes",
      keyLabel: { ru: "ID objective type", en: "Objective type id" },
      label: { ru: "Антагонисты по типам целей", en: "Antag count by objective type" }
    }
  },
  candidate: {
    job: {
      type: "string",
      dictionary: "jobs",
      label: { ru: "Профессия", en: "Job" }
    },
    department: {
      type: "string",
      dictionary: "departments",
      label: { ru: "Отдел", en: "Department" }
    },
    age: {
      type: "int",
      label: { ru: "Возраст", en: "Age" }
    },
    species: {
      type: "string",
      dictionary: "species",
      label: { ru: "Вид", en: "Species" }
    },
    sex: {
      type: "string",
      dictionary: "sex",
      label: { ru: "Пол", en: "Sex" }
    },
    traits: {
      type: "list-string",
      dictionary: "traits",
      label: { ru: "Черты", en: "Traits" }
    },
    hasMindshield: {
      type: "bool",
      label: { ru: "Есть защита разума", en: "Has mindshield" }
    },
    antagRole: {
      type: "list-string",
      dictionary: "antagRoles",
      label: { ru: "Роли антагониста", en: "Antag roles" }
    },
    antagObjectiveType: {
      type: "list-string",
      dictionary: "objectiveTypes",
      label: { ru: "Типы целей антагониста", en: "Antag objective types" }
    }
  }
};

export function getCategory(categoryId) {
  return CATEGORY_CATALOG.find(category => category.id === categoryId) ?? null;
}

export function getFieldDefinition(scope, field) {
  return FIELD_DEFINITIONS[scope]?.[field] ?? null;
}

export function getFieldOptions(scope) {
  return Object.entries(FIELD_DEFINITIONS[scope] ?? {}).map(([id, meta]) => ({
    id,
    ...meta
  }));
}

export function getDictionaryValues(dictionaryName) {
  return VALUE_DICTIONARIES[dictionaryName] ?? [];
}

export function getDictionaryLabel(dictionaryName, value) {
  if (!value) {
    return "";
  }

  const entry = LOCALIZED_DICTIONARY_LABELS[dictionaryName]?.[value] ?? null;
  return buildDictionaryLabel(value, entry);
}

export function getDictionaryOptions(dictionaryName) {
  return getDictionaryValues(dictionaryName).map(value => ({
    id: value,
    label: getDictionaryLabel(dictionaryName, value)
  }));
}

export function getAllowedOperators(scope, field, options = {}) {
  const definition = getFieldDefinition(scope, field);
  if (!definition) {
    return [PREDICATE_OPERATORS.equals];
  }

  const operators = [...(OPERATORS_BY_FIELD_TYPE[definition.type] ?? [PREDICATE_OPERATORS.equals])];
  if (scope === PREDICATE_SCOPES.candidate && options.allowCompareOperators !== false) {
    operators.push(PREDICATE_OPERATORS.sameAs, PREDICATE_OPERATORS.notSameAs);
  }

  return operators;
}
