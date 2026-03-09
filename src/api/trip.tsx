export interface TripImage {
  id: string;
  trip: string;
  image_url: string | null;
  image_type: string | null;
  image_thumbnail: boolean;
  created_at: string;
  image_base64?: string | null;
}

export interface Trip {
  id: number;
  name: string;
  description: string;
  content: string;
  location: string;
  province: string;
  country: string;
  category: string;
  category_label: string;
  price_per_person: string;
  capacity: number;
  start_date: string;
  end_date: string;
  thumbnail_image: string | null;
  images: TripImage[];
  created_by: number;
  created_by_name: string;
  created_at: string;
}


const BASE_URL = import.meta.env.VITE_BACKEND_API;
export async function GetTripsList(category?: string): Promise<Trip[]> {
  try {
    const url = category
      ? `${BASE_URL}/trips/?category=${encodeURIComponent(category)}`
      : `${BASE_URL}/trips/?page_size=100`

    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to fetch trips: ${res.statusText}`)

    const data = await res.json()

    // Support both DRF pagination and direct array
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;

    console.warn("Unexpected API response format:", data);
    return [];
  } catch (error) {
    console.error("Error fetching trips:", error)
    return []
  }
}


export async function GetTripById(id: string): Promise<Trip | null> {
  try {
    const res = await fetch(`${BASE_URL}/trips/${id}/`);
    if (!res.ok) {
      throw new Error(`Failed to fetch trip ${id}: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching trip by id:", error);
    return null;
  }
}


export interface Rating {
  id: string;
  trip: number | string; // Allow match with Trip ID which can be number or string
  user: number | string;
  trip_rating: number;
  service_rating: number;
  comment: string;
  created_at: string;
}

export async function GetRatingsList(): Promise<Rating[]> {
  try {
    const res = await fetch(`${BASE_URL}/ratings/`);
    if (!res.ok) throw new Error(`Failed to fetch ratings: ${res.statusText}`);
    const data = await res.json();
    return Array.isArray(data) ? data : data.results || [];
  } catch (error) {
    console.error("Error fetching ratings:", error);
    return [];
  }
}
