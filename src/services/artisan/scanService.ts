import { supabase } from '@/api/api';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

export interface ScanPlace {
    name: string;
    place_id: string;
    type: string;
    location: {
        lat: number;
        lon: number;
    };
    // Additional fields from Google Places API
    formatted_address?: string;
    formatted_phone_number?: string;
    international_phone_number?: string;
    types?: string;
    website?: string;
}

export interface CreateScanPayload {
    name: string;
    slug: string;
    description?: string;
    center: {
        lat: number;
        lon: number;
    };
    address_text: string;
    radius_meters: number;
    filters: {
        types: string[];
    };
    places: ScanPlace[];
    estimated_cost?: number; // Total credits to deduct for this scan
    cost_breakdown?: {
        detection_cost: number; // Cost already charged for detection
        scan_launch_cost: number; // Cost for scan launch
        total_facades: number; // Number of facades
    };
}

export interface CreateScanResponse {
    status: string;
    message: string;
    slug: string;
}


export const createScan = async (payload: CreateScanPayload): Promise<CreateScanResponse> => {
    // Get the current session from Supabase
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';
    console.log('token', token);
    
    console.log('Supabase token:', token ? 'Token found' : 'No token');
    
    const response = await fetch(`${BACKEND_URL}/storefront/scan`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('Error:', errorData);
        throw new Error(errorData.message || `Échec de la création du scan: ${response.statusText}`);
    }

    return response.json();
};



