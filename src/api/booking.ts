import { apiFetch, normalizeApiUrl } from "./client"

export type BookingStatus = "pending" | "confirmed" | "cancelled"

export interface Booking {
  id: string
  trip: string
  trip_name: string
  trip_province?: string
  customer: string
  customer_name: string
  customer_phone?: string
  /** ชื่อ LINE หรือ line_user_id จาก LineUser ที่ผูกกับลูกค้า */
  line_display?: string | null
  group_size: number
  total_price: string
  status: BookingStatus
  created_at: string
}

export type PaymentStatus =
  | "pending"
  | "slip_uploaded"
  | "verifying"
  | "paid"
  | "failed"
  | "refunded"

export interface Payment {
  id: string
  booking: string
  amount: string
  payment_method: string
  payment_status: PaymentStatus
  /** URL สลิป (Supabase หรือ public) */
  payment_url?: string | null
  slip_image?: string | null
  slip_uploaded_at?: string | null
  verified_by: string | null
  verified_by_name: string | null
  verified_at: string | null
  verification_notes: string
  transaction_id: string
  bank_account: string
  paid_at: string | null
  created_at: string
  updated_at: string
}

export interface BookingEquipment {
  id: string
  booking: string
  equipment: string
  equipment_name: string
  quantity: number
  total_price: string
}

interface PaginatedResponse<T> {
  results?: T[]
  next?: string | null
}

async function fetchAllPages<T>(initialPath: string): Promise<T[]> {
  const all: T[] = []
  const visited = new Set<string>()
  let nextUrl: string | null = initialPath

  while (nextUrl && !visited.has(nextUrl)) {
    visited.add(nextUrl)
    const path = normalizeApiUrl(nextUrl)
    const res = await apiFetch(path)
    if (!res.ok) throw new Error(`Fetch failed: ${res.statusText}`)
    const data: T[] | PaginatedResponse<T> = await res.json()

    if (Array.isArray(data)) {
      all.push(...data)
      break
    }

    all.push(...(data.results ?? []))
    nextUrl = data.next ? normalizeApiUrl(data.next) : null
  }

  return all
}

export async function DeleteBooking(id: string): Promise<boolean> {
  try {
    const res = await apiFetch(`/bookings/${id}/`, { method: "DELETE" })
    return res.ok || res.status === 204
  } catch {
    return false
  }
}

export async function GetAllBookings(): Promise<Booking[]> {
  try {
    return await fetchAllPages<Booking>(`/bookings/?page_size=100`)
  } catch (error) {
    console.error("Error fetching bookings:", error)
    return []
  }
}

export async function GetAllPayments(): Promise<Payment[]> {
  try {
    return await fetchAllPages<Payment>(`/payments/?page_size=100`)
  } catch (error) {
    console.error("Error fetching payments:", error)
    return []
  }
}

export async function GetAllBookingEquipments(): Promise<BookingEquipment[]> {
  try {
    return await fetchAllPages<BookingEquipment>(`/booking-equipments/?page_size=100`)
  } catch (error) {
    console.error("Error fetching booking equipments:", error)
    return []
  }
}

export async function GetBookingById(id: string): Promise<Booking | null> {
  try {
    const res = await apiFetch(`/bookings/${id}/`)
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`Failed: ${res.status}`)
    return (await res.json()) as Booking
  } catch (error) {
    console.error("GetBookingById:", error)
    return null
  }
}

export async function GetPaymentsByBooking(bookingId: string): Promise<Payment[]> {
  try {
    return await fetchAllPages<Payment>(
      `/payments/?booking_id=${encodeURIComponent(bookingId)}&page_size=100`,
    )
  } catch (error) {
    console.error("GetPaymentsByBooking:", error)
    return []
  }
}

export async function GetBookingEquipmentsByBooking(
  bookingId: string,
): Promise<BookingEquipment[]> {
  try {
    return await fetchAllPages<BookingEquipment>(
      `/booking-equipments/?booking=${encodeURIComponent(bookingId)}&page_size=100`,
    )
  } catch (error) {
    console.error("GetBookingEquipmentsByBooking:", error)
    return []
  }
}

