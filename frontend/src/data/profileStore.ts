export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  age: number;
  // Extended fields
  disabilities: string[];
  fears: string[];
  travelStyle: string[];
  budgetRange: string;
  duration: string;
  preferredTemperature: string;
  noGos: string[];
  travelMode: "solo" | "friends" | "";
  dietaryNeeds: string[];
  languages: string[];
  mobilityLevel: string;
  accommodationPrefs: string[];
  activityInterests: string[];
  dislikes: string[];
  onboardingComplete: boolean;
}

export interface GroupMemberPrefs {
  memberId: string;
  memberName: string;
  preferences: string[];
  dislikes: string[];
  budgetRange: string;
  mobilityLevel: string;
  dietaryNeeds: string[];
}

export interface TripVote {
  memberId: string;
  vote: "yes" | "no" | "nogo" | null;
}

export interface ScoredTrip {
  name: string;
  country: string;
  score: number;
  weatherC: number;
  weatherDesc: string;
  budgetEur: number;
  durationDays: number;
  travelStyle: string;
  hotel: string;
  checkIn: string;
  checkOut: string;
  activities: string[];
  breakdown: Record<string, number>;
  votes: TripVote[];
}

export interface ChatMessage {
  id: string;
  memberId: string;
  memberName: string;
  text: string;
  ts: number;
  isAI?: boolean;
}

export interface GroupWithPrefs {
  id: string;
  name: string;
  members: GroupMemberPrefs[];
  trips: ScoredTrip[];
  votingRound: number;
  decidedTrip?: string;
  chat?: ChatMessage[];
}

const PROFILE_KEY = "planly_profile";
const GROUPS_KEY = "planly_groups";
const MATCHES_KEY = "planly_matches";

const defaultProfile: UserProfile = {
  id: "self",
  name: "",
  avatar: "🧳",
  age: 25,
  disabilities: [],
  fears: [],
  travelStyle: [],
  budgetRange: "",
  duration: "",
  preferredTemperature: "",
  noGos: [],
  travelMode: "",
  dietaryNeeds: [],
  languages: [],
  mobilityLevel: "No restrictions",
  accommodationPrefs: [],
  activityInterests: [],
  dislikes: [],
  onboardingComplete: false,
};

export const getProfile = (): UserProfile => {
  const stored = localStorage.getItem(PROFILE_KEY);
  if (stored) return { ...defaultProfile, ...JSON.parse(stored) };
  return { ...defaultProfile };
};

export const saveProfile = (profile: UserProfile) => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};

export const isOnboardingComplete = (): boolean => {
  return getProfile().onboardingComplete;
};

// Groups
const defaultGroups: GroupWithPrefs[] = [
  {
    id: "1",
    name: "Summer Squad",
    votingRound: 0,
    members: [
      {
        memberId: "self",
        memberName: "You",
        preferences: [],
        dislikes: [],
        budgetRange: "",
        mobilityLevel: "No restrictions",
        dietaryNeeds: [],
      },
      {
        memberId: "m1",
        memberName: "David",
        preferences: ["Beach", "Good Food", "Relaxation"],
        dislikes: ["Extreme sports"],
        budgetRange: "€€",
        mobilityLevel: "No restrictions",
        dietaryNeeds: ["Vegetarian"],
      },
      {
        memberId: "m2",
        memberName: "Tobias",
        preferences: ["Culture", "Walking tours", "History"],
        dislikes: ["Night life"],
        budgetRange: "€€",
        mobilityLevel: "No restrictions",
        dietaryNeeds: [],
      },
    ],
    trips: [],
    chat: [
      { id: "c1", memberId: "m1", memberName: "David", text: "Did you see the photos from the trip to Venice?", ts: Date.now() - 1000 * 60 * 60 * 6 },
      { id: "c2", memberId: "m2", memberName: "Tobias", text: "Yeah, looks like they found the best food spots without even trying.", ts: Date.now() - 1000 * 60 * 60 * 5 },
      { id: "c3", memberId: "ai", memberName: "Planly AI", text: "I can summarise the trip ideas you've collected so far — just hit Start voting and I'll line up matching destinations.", ts: Date.now() - 1000 * 60 * 60 * 4, isAI: true },
    ],
  },
];

export const getGroups = (): GroupWithPrefs[] => {
  const stored = localStorage.getItem(GROUPS_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(GROUPS_KEY, JSON.stringify(defaultGroups));
  return JSON.parse(JSON.stringify(defaultGroups));
};

export const saveGroups = (groups: GroupWithPrefs[]) => {
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
};

export const addGroup = (name: string): GroupWithPrefs => {
  const groups = getGroups();
  const profile = getProfile();
  const newGroup: GroupWithPrefs = {
    id: Date.now().toString(),
    name,
    votingRound: 0,
    members: [
      {
        memberId: profile.id,
        memberName: profile.name || "You",
        preferences: profile.activityInterests,
        dislikes: [...profile.dislikes, ...profile.noGos],
        budgetRange: profile.budgetRange,
        mobilityLevel: profile.mobilityLevel,
        dietaryNeeds: profile.dietaryNeeds,
      },
    ],
    trips: [],
    chat: [
      { id: `c${Date.now()}`, memberId: "ai", memberName: "Planly AI", text: "Group created. Invite your travel buddies and I'll start lining up trip ideas.", ts: Date.now(), isAI: true },
    ],
  };
  groups.push(newGroup);
  saveGroups(groups);
  return newGroup;
};

export const addChatMessage = (groupId: string, msg: Omit<ChatMessage, "id" | "ts">) => {
  const groups = getGroups();
  const g = groups.find((gr) => gr.id === groupId);
  if (!g) return;
  g.chat = g.chat || [];
  g.chat.push({ ...msg, id: Date.now().toString() + Math.random().toString(36).slice(2, 6), ts: Date.now() });
  saveGroups(groups);
};

// Matched buddies (mutual interest, persisted)
export const getMatches = (): string[] => {
  const stored = localStorage.getItem(MATCHES_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const addMatch = (travelerId: string) => {
  const m = getMatches();
  if (!m.includes(travelerId)) {
    m.push(travelerId);
    localStorage.setItem(MATCHES_KEY, JSON.stringify(m));
  }
};

export const removeMatch = (travelerId: string) => {
  const m = getMatches().filter((id) => id !== travelerId);
  localStorage.setItem(MATCHES_KEY, JSON.stringify(m));
};

// Trip compatibility scoring
interface TripCandidate {
  name: string;
  country: string;
  tags: string[];
  priceEur: number;
  weatherC: number;
  weatherDesc: string;
  hotel: string;
  activities: string[];
  accessibility: string;
  dietaryOptions: string[];
}

const tripCandidates: TripCandidate[] = [
  { name: "Barcelona", country: "Spain", tags: ["Beach", "Culture", "Good Food", "Night life", "Walking tours"], priceEur: 520, weatherC: 26, weatherDesc: "Sunny", hotel: "Hotel Sol", activities: ["Sagrada Família", "Beach day at Barceloneta", "Tapas tour"], accessibility: "Mostly accessible", dietaryOptions: ["Vegetarian", "Vegan", "Gluten-free"] },
  { name: "Lisbon", country: "Portugal", tags: ["Culture", "Night life", "Good Food", "History", "Beach"], priceEur: 420, weatherC: 24, weatherDesc: "Mild", hotel: "Pousada Lisboa", activities: ["Alfama walking tour", "Tram 28", "Fado night"], accessibility: "Hilly terrain", dietaryOptions: ["Vegetarian", "Vegan"] },
  { name: "Venice", country: "Italy", tags: ["Culture", "History", "Romance", "Good Food", "Walking tours"], priceEur: 480, weatherC: 18, weatherDesc: "Cloudy", hotel: "Hotel Saturnia", activities: ["Gondola ride", "St. Mark's Square", "Murano glass tour"], accessibility: "Partially accessible", dietaryOptions: ["Vegetarian", "Gluten-free"] },
  { name: "Berlin", country: "Germany", tags: ["Culture", "Night life", "History", "Adventure"], priceEur: 320, weatherC: 19, weatherDesc: "Mild", hotel: "Hotel Adlon", activities: ["Brandenburg Gate", "East Side Gallery", "Club night"], accessibility: "Fully accessible", dietaryOptions: ["Vegetarian", "Vegan", "Gluten-free", "Halal"] },
  { name: "Paris", country: "France", tags: ["Culture", "Good Food", "Romance", "History", "Walking tours"], priceEur: 580, weatherC: 21, weatherDesc: "Sunny", hotel: "Le Marais Boutique", activities: ["Eiffel Tower", "Louvre", "Seine dinner cruise"], accessibility: "Mostly accessible", dietaryOptions: ["Vegetarian", "Vegan", "Gluten-free"] },
  { name: "Naples", country: "Italy", tags: ["Good Food", "Culture", "Beach", "History"], priceEur: 380, weatherC: 28, weatherDesc: "Sunny", hotel: "Hotel Vesuvio", activities: ["Pompeii day trip", "Pizza tour", "Capri ferry"], accessibility: "Partially accessible", dietaryOptions: ["Vegetarian"] },
  { name: "Amsterdam", country: "Netherlands", tags: ["Culture", "Relaxation", "Walking tours", "Good Food", "Night life"], priceEur: 460, weatherC: 17, weatherDesc: "Cloudy", hotel: "Pulitzer Amsterdam", activities: ["Canal cruise", "Van Gogh Museum", "Bike tour"], accessibility: "Fully accessible", dietaryOptions: ["Vegetarian", "Vegan", "Gluten-free"] },
  { name: "Copenhagen", country: "Denmark", tags: ["Culture", "Relaxation", "Good Food", "Adventure"], priceEur: 640, weatherC: 16, weatherDesc: "Mild", hotel: "Nimb Hotel", activities: ["Tivoli Gardens", "Nyhavn walk", "Design district"], accessibility: "Fully accessible", dietaryOptions: ["Vegetarian", "Vegan", "Gluten-free"] },
];

const budgetToEur = (range: string): number => {
  // Parse "€<number>" format from onboarding slider
  const numMatch = range.match(/€\s*(\d{2,})/);
  if (numMatch) return parseInt(numMatch[1], 10);
  switch (range) {
    case "€": return 350;
    case "€€": return 600;
    case "€€€": return 1200;
    case "Under €300": return 300;
    case "€300–500": return 500;
    case "€500–1000": return 1000;
    case "€1000–2000": return 2000;
    case "€2000+": return 3000;
    default: return 800;
  }
};

const durationToDays = (d: string): number => {
  if (d.startsWith("1-2")) return 2;
  if (d.startsWith("2-4")) return 3;
  if (d.startsWith("4+")) return 6;
  return 4;
};

export const scoreTripsForGroup = (group: GroupWithPrefs, excludeNames: string[] = []): ScoredTrip[] => {
  return tripCandidates
    .filter((t) => !excludeNames.includes(t.name))
    .map((trip) => {
      const breakdown: Record<string, number> = {};
      let totalScore = 0;

      group.members.forEach((member) => {
        let memberScore = 0;

        // Preference match (up to 50 points)
        const prefMatches = member.preferences.filter((p) =>
          trip.tags.some((t) => t.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(t.toLowerCase()))
        ).length;
        const prefScore = member.preferences.length > 0 ? (prefMatches / member.preferences.length) * 50 : 25;
        memberScore += prefScore;

        // Dislike / no-go penalty
        const dislikeMatches = member.dislikes.filter((d) =>
          trip.tags.some((t) => t.toLowerCase().includes(d.toLowerCase()) || d.toLowerCase().includes(t.toLowerCase()))
        ).length;
        memberScore -= dislikeMatches * 15;

        // Dietary (up to 20)
        if (member.dietaryNeeds.length === 0) {
          memberScore += 20;
        } else {
          const dietMatch = member.dietaryNeeds.filter((d) =>
            trip.dietaryOptions.some((o) => o.toLowerCase() === d.toLowerCase())
          ).length;
          memberScore += (dietMatch / member.dietaryNeeds.length) * 20;
        }

        // Mobility (up to 15)
        if (member.mobilityLevel === "No restrictions") memberScore += 15;
        else if (trip.accessibility === "Fully accessible") memberScore += 15;
        else if (trip.accessibility === "Mostly accessible") memberScore += 10;
        else memberScore += 5;

        // Budget alignment (up to 15)
        const memberBudget = budgetToEur(member.budgetRange);
        if (trip.priceEur <= memberBudget) memberScore += 15;
        else if (trip.priceEur <= memberBudget * 1.2) memberScore += 8;
        else memberScore += 0;

        const finalScore = Math.max(0, Math.min(100, Math.round(memberScore)));
        breakdown[member.memberName] = finalScore;
        totalScore += finalScore;
      });

      const avgScore = group.members.length > 0 ? Math.round(totalScore / group.members.length) : 0;
      const profile = getProfile();
      const days = durationToDays(profile.duration);

      return {
        name: trip.name,
        country: trip.country,
        score: avgScore,
        weatherC: trip.weatherC,
        weatherDesc: trip.weatherDesc,
        budgetEur: trip.priceEur,
        durationDays: days,
        travelStyle: trip.tags.slice(0, 2).join(" + "),
        hotel: trip.hotel,
        checkIn: "29.07.",
        checkOut: "01.08.",
        activities: trip.activities,
        breakdown,
        votes: group.members.map((m) => ({ memberId: m.memberId, vote: null })),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
};

// Preset options for forms
export const DISABILITY_OPTIONS = ["Wheelchair user", "Visual impairment", "Hearing impairment", "Chronic pain", "None"];
export const FEAR_OPTIONS = ["Heights", "Flying", "Water/swimming", "Crowds", "Enclosed spaces", "None"];
export const TRAVEL_STYLE_OPTIONS = ["Adventure", "Relaxation", "Cultural", "Luxury", "Budget"];
export const BUDGET_OPTIONS = ["€", "€€", "€€€"];
export const DURATION_OPTIONS = ["1-2 Days", "2-4 Days", "4+ Days"];
export const TEMPERATURE_OPTIONS = ["Warm", "Mild", "Cool"];
export const NOGO_OPTIONS = ["Crowded Places", "Expensive Destinations", "Long Flights", "Unstable Weather", "Limited Connectivity"];
export const DIETARY_OPTIONS = ["Vegetarian", "Vegan", "Gluten-free", "Halal", "Kosher", "Lactose-free", "None"];
export const LANGUAGE_OPTIONS = ["English", "German", "French", "Spanish", "Italian", "Portuguese", "Dutch"];
export const MOBILITY_OPTIONS = ["No restrictions", "Limited walking", "Wheelchair accessible needed", "Elevator required"];
export const ACCOMMODATION_OPTIONS = ["Hotel", "Hostel", "Airbnb", "Resort", "Camping", "Boutique"];
export const ACTIVITY_OPTIONS = ["Beach", "Hiking", "Museums", "Night life", "Good Food", "Shopping", "Walking tours", "Water sports", "History", "Photography"];
