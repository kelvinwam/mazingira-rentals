export type UserRole = 'TENANT' | 'LANDLORD' | 'ADMIN';

export interface User {
  id:                string;
  phone:             string;
  full_name:         string | null;
  email:             string | null;
  role:              UserRole;
  is_active:         boolean;
  is_phone_verified: boolean;
  profile_photo:     string | null;
  created_at:        string;
}

export interface Area {
  id:            string;
  name:          string;
  slug:          string;
  county:        string;
  center_lat:    number;
  center_lng:    number;
  listing_count: number;
  avg_price_kes: number;
}

export interface Amenity {
  id:       string;
  name:     string;
  icon:     string;
  category: string;
}

export interface ListingCard {
  id:                 string;
  title:              string;
  price_kes:          number;
  deposit_kes:        number;
  bedrooms:           number;
  bathrooms:          number;
  is_available:       boolean;
  is_boosted:         boolean;
  verification_level: string;
  avg_rating:         number;
  review_count:       number;
  address_hint:       string;
  area_name:          string;
  area_slug:          string;
  primary_image:      string | null;
  thumbnail:          string | null;
}

export interface ListingDetail extends ListingCard {
  description:    string;
  floor_level:    number | null;
  latitude:       number;
  longitude:      number;
  last_confirmed_at: string | null;
  view_count:     number;
  landlord_name:  string;
  landlord_phone: string;
  landlord_photo: string | null;
  images:         { id: string; url: string; thumbnail_url: string; is_primary: boolean; display_order: number }[];
  amenities:      Amenity[];
  reviews:        Review[];
}

export interface Review {
  id:            string;
  rating:        number;
  body:          string | null;
  created_at:    string;
  reviewer_name: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data:    T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data:    T[];
  meta: {
    total:      number;
    page:       number;
    limit:      number;
    totalPages: number;
    hasMore:    boolean;
  };
}
