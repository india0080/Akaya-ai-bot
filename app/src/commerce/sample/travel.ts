/** SAMPLE travel results for the demo (fictional stays, sample fares). Booking buttons open the real partner search. */

export interface Offer {
  platform: string;
  price: number;
}

export interface SampleHotel {
  id: string;
  name: string;
  area: string;
  rating: number;
  reviews: number;
  perks: string[];
  tone: string;
  offers: Offer[];
}

export interface SampleFlight {
  id: string;
  airline: string;
  code: string;
  depart: string;
  arrive: string;
  duration: string;
  stops: string;
  offers: Offer[];
}

export interface SampleExperience {
  id: string;
  title: string;
  duration: string;
  rating: number;
  reviews: number;
  offers: Offer[];
}

export const HOTELS: SampleHotel[] = [
  {
    id: 'h1',
    name: 'Sea Breeze Resort',
    area: 'Calangute · 300 m to beach',
    rating: 4.3,
    reviews: 2140,
    perks: ['Pool', 'Breakfast', 'Free cancellation'],
    tone: 'cyan',
    offers: [
      { platform: 'booking', price: 6240 },
      { platform: 'agoda', price: 5980 },
      { platform: 'makemytrip', price: 6150 },
    ],
  },
  {
    id: 'h2',
    name: 'Palm Grove Villas',
    area: 'Anjuna · private pool',
    rating: 4.5,
    reviews: 860,
    perks: ['Villa', 'Kitchen', 'Wi-Fi'],
    tone: 'green',
    offers: [
      { platform: 'goibibo', price: 8760 },
      { platform: 'booking', price: 8900 },
      { platform: 'agoda', price: 9150 },
    ],
  },
  {
    id: 'h3',
    name: 'Fort View Hostel',
    area: 'Candolim · near Fort Aguada',
    rating: 4.1,
    reviews: 1310,
    perks: ['Dorms & privates', 'Café'],
    tone: 'orange',
    offers: [
      { platform: 'agoda', price: 1390 },
      { platform: 'booking', price: 1450 },
      { platform: 'cleartrip', price: 1520 },
    ],
  },
];

export const FLIGHTS: SampleFlight[] = [
  {
    id: 'f1',
    airline: 'IndiGo',
    code: '6E 2041',
    depart: '06:10',
    arrive: '08:45',
    duration: '2h 35m',
    stops: 'Non-stop',
    offers: [
      { platform: 'makemytrip', price: 5212 },
      { platform: 'goibibo', price: 5240 },
      { platform: 'cleartrip', price: 5199 },
    ],
  },
  {
    id: 'f2',
    airline: 'Air India',
    code: 'AI 883',
    depart: '10:55',
    arrive: '13:35',
    duration: '2h 40m',
    stops: 'Non-stop',
    offers: [
      { platform: 'cleartrip', price: 6480 },
      { platform: 'makemytrip', price: 6505 },
      { platform: 'skyscanner', price: 6420 },
    ],
  },
  {
    id: 'f3',
    airline: 'Akasa Air',
    code: 'QP 1305',
    depart: '17:20',
    arrive: '19:55',
    duration: '2h 35m',
    stops: 'Non-stop',
    offers: [
      { platform: 'goibibo', price: 4890 },
      { platform: 'makemytrip', price: 4935 },
    ],
  },
];

export const EXPERIENCES: SampleExperience[] = [
  {
    id: 'e1',
    title: 'Dudhsagar Falls jeep safari & spice farm',
    duration: 'Full day',
    rating: 4.6,
    reviews: 3820,
    offers: [
      { platform: 'klook', price: 2499 },
      { platform: 'getyourguide', price: 2650 },
    ],
  },
  {
    id: 'e2',
    title: 'Mandovi river sunset cruise',
    duration: '1.5 hours',
    rating: 4.4,
    reviews: 1960,
    offers: [
      { platform: 'klook', price: 899 },
      { platform: 'tripadvisor', price: 950 },
    ],
  },
  {
    id: 'e3',
    title: 'Old Goa churches heritage walk',
    duration: '3 hours',
    rating: 4.7,
    reviews: 640,
    offers: [
      { platform: 'getyourguide', price: 1200 },
      { platform: 'tripadvisor', price: 1290 },
    ],
  },
];

export const cheapest = (offers: Offer[]) => offers.reduce((a, b) => (b.price < a.price ? b : a));
