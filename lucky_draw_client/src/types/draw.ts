export type DrawMode = "participant" | "pekon";

export interface ParticipantWinner {
  id: string;
  ticket_sequence: number;
  full_name: string;
  alamat: string;
  phone_number: string;
  unique_id: string;
  date_of_birth?: string | null;
  coupon_code: string | null;
  photo_path: string | null;
  has_won: boolean;
  created_at: string;
}

export interface PekonWinner {
  id: string;
  kecamatan: string;
  name: string;
  has_won: boolean;
  coupon_code: string | null;
  created_at: string;
}
