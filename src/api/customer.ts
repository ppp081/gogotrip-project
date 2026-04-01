import { apiFetch } from "./client";

export interface LineUser {
  line_user_id: string;
  display_name: string;
  picture_url: string;
  status_message: string;
  user_status: string;
  language: string;
  created_at: string;
  updated_at: string;
  user: number | null;
}

export interface CustomerBooking {
  id: string;
  trip: string;
  trip_name: string;
  group_size: number;
  total_price: string;
  status: "pending" | "confirmed" | "cancelled";
  created_at: string;
}

export interface CustomerDetail extends LineUser {
  email: string;
  phone: string;
  bookings: CustomerBooking[];
  total_spend: number;
}

export async function GetCustomersList(): Promise<LineUser[]> {
  try {
    const res = await apiFetch("/line-users/");
    if (!res.ok) throw new Error("Failed to fetch customers");
    const data = await res.json();
    return Array.isArray(data) ? data : data.results || [];
  } catch (error) {
    console.error("Error fetching customers:", error);
    return [];
  }
}

export async function GetCustomerById(id: string): Promise<CustomerDetail | null> {
  try {
    const res = await apiFetch(`/line-users/${id}/`);
    if (!res.ok) throw new Error("Failed to fetch customer detail");
    return await res.json();
  } catch (error) {
    console.error("Error fetching customer by id:", error);
    return null;
  }
}
