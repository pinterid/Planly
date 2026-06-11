export interface TravelerProfile {
  id: string;
  name: string;
  age: number;
  avatar: string;
  budget: string;
  style: string;
  destination: string;
  about: string[];
}

export interface TripOption {
  id: string;
  destination: string;
  country: string;
  price: string;
  duration: string;
  style: string;
  image: string;
  likeness: number; // 0-100 compatibility score
  likes: number; // social likes from other travelers
  weather: string;
  hotel: string;
  highlights: string[];
  description: string;
  tags: string[];
}

export interface Group {
  id: string;
  name: string;
  members: string[];
  budget: string;
  style: string;
  trips: { name: string; votes: number; voted: boolean }[];
  lastMessage?: string;
}

export const travelers: TravelerProfile[] = [
  {
    id: "1",
    name: "Anna",
    age: 31,
    avatar: "👩‍💼",
    budget: "€1,000",
    style: "Adventure",
    destination: "Open",
    about: [
      "I work as a marketing manager",
      "I am always open to new experiences",
      "I like to meet the locals",
    ],
  },
  {
    id: "2",
    name: "Max",
    age: 28,
    avatar: "🧑‍💻",
    budget: "€800",
    style: "Culture",
    destination: "Southern Europe",
    about: [
      "Software developer who loves history",
      "Prefer walking tours over bus tours",
      "Foodie at heart",
    ],
  },
  {
    id: "3",
    name: "Lisa",
    age: 26,
    avatar: "🎨",
    budget: "€600",
    style: "Relaxation",
    destination: "Beach destinations",
    about: [
      "Graphic designer & yoga enthusiast",
      "Looking for chill travel partners",
      "Love sunset spots",
    ],
  },
  {
    id: "4",
    name: "Markus",
    age: 44,
    avatar: "👨‍👩‍👧‍👦",
    budget: "€2,000",
    style: "Family",
    destination: "Kid-friendly",
    about: [
      "IT team lead with two kids",
      "Looking for family-friendly trips",
      "Enjoys outdoor activities",
    ],
  },
];

export const tripOptions: TripOption[] = [
  {
    id: "1",
    destination: "Barcelona",
    country: "Spain",
    price: "€450",
    duration: "5 Days",
    style: "Relax + Beach",
    image: "barcelona",
    likeness: 92,
    likes: 1284,
    weather: "26°C, Sunny",
    hotel: "Hotel Sol — 4★",
    highlights: ["Sagrada Família", "Barceloneta Beach", "Tapas tour in Gràcia"],
    description: "Sun-soaked Mediterranean city blending Gaudí architecture, golden beaches, and a buzzing food scene.",
    tags: ["Beach", "Culture", "Good Food", "Night life"],
  },
  {
    id: "2",
    destination: "Lisbon",
    country: "Portugal",
    price: "€380",
    duration: "4 Days",
    style: "Social + Nightlife",
    image: "lisbon",
    likeness: 87,
    likes: 964,
    weather: "24°C, Mild",
    hotel: "Pousada Lisboa — 4★",
    highlights: ["Alfama walking tour", "Tram 28 ride", "Fado night in Bairro Alto"],
    description: "Hilly, pastel-coloured capital famous for fado music, custard tarts, and a laid-back nightlife.",
    tags: ["Culture", "Night life", "Good Food"],
  },
  {
    id: "3",
    destination: "Berlin",
    country: "Germany",
    price: "€250",
    duration: "Weekend",
    style: "Culture + Food",
    image: "berlin",
    likeness: 74,
    likes: 612,
    weather: "19°C, Mild",
    hotel: "Hotel Adlon — 5★",
    highlights: ["Brandenburg Gate", "East Side Gallery", "Club night in Friedrichshain"],
    description: "Edgy, history-packed metropolis with world-class museums and a legendary club scene.",
    tags: ["Culture", "History", "Night life"],
  },
];

export const groups: Group[] = [
  {
    id: "1",
    name: "Group 1",
    members: ["Anna", "Max", "Lisa"],
    budget: "€600",
    style: "Mix",
    trips: [
      { name: "Lisbon", votes: 2, voted: false },
      { name: "Barcelona", votes: 1, voted: false },
      { name: "Berlin", votes: 0, voted: false },
    ],
    lastMessage: "What about Rome?",
  },
];
