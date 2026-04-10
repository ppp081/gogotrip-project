import { apiFetch, normalizeApiUrl } from "./client";

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
  id: string | number;
  name: string;
  description: string;
  content: string;
  location: string;
  province: string;
  country: string;
  category: string;
  category_label: string;
  /** false = ซ่อนจากหน้าลูกค้า (staff ยังจัดการได้) */
  is_active?: boolean;
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

export async function GetTripsList(category?: string): Promise<Trip[]> {
  try {
    const path = category
      ? `/trips/?category=${encodeURIComponent(category)}`
      : `/trips/?page_size=100`;

    const res = await apiFetch(path);
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
    const res = await apiFetch(`/trips/${id}/`);
    if (!res.ok) {
      throw new Error(`Failed to fetch trip ${id}: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching trip by id:", error);
    return null;
  }
}

export async function UpdateTrip(
  id: string,
  data: Partial<
    Pick<
      Trip,
      | "name"
      | "description"
      | "content"
      | "location"
      | "province"
      | "category"
      | "country"
      | "price_per_person"
      | "capacity"
      | "start_date"
      | "end_date"
      | "is_active"
    >
  >
): Promise<Trip | null> {
  try {
    const res = await apiFetch(`/trips/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Failed to update trip: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error updating trip:", error);
    return null;
  }
}

export interface Booking {
  id: string;
  trip: string;
  trip_name: string;
  customer: string;
  customer_name: string;
  group_size: number;
  total_price: string;
  status: "pending" | "confirmed" | "cancelled";
  created_at: string;
}

export async function GetBookingsByTrip(tripId: string): Promise<Booking[]> {
  try {
    const res = await apiFetch(`/bookings/?trip=${tripId}`);
    if (!res.ok) throw new Error(`Failed to fetch bookings: ${res.statusText}`);
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return [];
  }
}


export interface Rating {
  id: string;
  trip: number | string; // Allow match with Trip ID which can be number or string
  user: number | string;
  user_name?: string;
  trip_rating: number;
  service_rating: number;
  comment: string;
  created_at: string;
}

interface PaginatedResponse<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
}

export interface SummaryIssue {
  title: string
  description: string
  severity: "critical" | "warning" | "info"
  mentions: number
}

export interface SummaryHighlight {
  title: string
  description: string
  mentions: number
}

export interface SummaryFaq {
  question: string
  answer?: string
  responses?: number
}

export interface AISummary {
  id: string
  total_reviews: number
  average_rating: number
  sentiment: {
    positive: { count: number; percentage: number }
    neutral: { count: number; percentage: number }
    negative: { count: number; percentage: number }
  }
  highlights?: SummaryHighlight[]
  issues: SummaryIssue[]
  suggestion: string
  suggestion_bullets?: string[]
  faqs: SummaryFaq[]
  ratings_stats: { stars: number; count: number; percentage: number }[]
  created_at: string
}

export async function GetLatestSummary(): Promise<AISummary | null> {
  try {
    const res = await apiFetch(`/summaries/latest/`)
    if (!res.ok) return null
    return await res.json()
  } catch (error) {
    console.error("Error fetching latest summary:", error)
    return null
  }
}

export async function GenerateSummary(): Promise<AISummary | null> {
  try {
    const res = await apiFetch(`/summaries/generate/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
    if (!res.ok) throw new Error(`Generate failed: ${res.statusText}`)
    return await res.json()
  } catch (error) {
    console.error("Error generating summary:", error)
    return null
  }
}

export async function DeleteRating(id: string): Promise<boolean> {
  try {
    const res = await apiFetch(`/ratings/${id}/`, { method: "DELETE" })
    return res.ok || res.status === 204
  } catch (error) {
    console.error("Error deleting rating:", error)
    return false
  }
}

export async function GetRatingsList(): Promise<Rating[]> {
  try {
    const allRatings: Rating[] = [];
    const visitedUrls = new Set<string>();
    let nextUrl: string | null = `/ratings/?page_size=100`;

    while (nextUrl && !visitedUrls.has(nextUrl)) {
      visitedUrls.add(nextUrl);

      const res = await apiFetch(normalizeApiUrl(nextUrl));
      if (!res.ok) throw new Error(`Failed to fetch ratings: ${res.statusText}`);

      const data: Rating[] | PaginatedResponse<Rating> = await res.json();

      if (Array.isArray(data)) {
        allRatings.push(...data);
        break;
      }

      allRatings.push(...(data.results || []));
      nextUrl = data.next ? normalizeApiUrl(data.next) : null;
    }

    return allRatings;
  } catch (error) {
    console.error("Error fetching ratings:", error);
    return [];
  }
}
