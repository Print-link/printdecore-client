import axios, { AxiosError } from 'axios';

// API Configuration - Uses same pattern as api.ts
const USE_LOCALHOST = true; // Set to true for localhost, false for production

const PRODUCTION_API_BASE = 'https://piper-server-prototype-ts.onrender.com/api/clients';
const LOCALHOST_API_BASE = 'http://localhost:3000/api/clients';

const getBaseUrl = (): string => {
//   if (import.meta.env.VITE_API_BASE_URL) {
//     return import.meta.env.VITE_API_BASE_URL;
//   }
  return USE_LOCALHOST ? LOCALHOST_API_BASE : PRODUCTION_API_BASE;
};

export interface OrderResponse {
  success: boolean;
  data?: {
    orders: any[];
  };
  message?: string;
  error?: string;
}

export const getClientOrders = async (clientId: string): Promise<OrderResponse> => {
  const token = localStorage.getItem('token');
  const baseUrl = getBaseUrl();
  
  try {
    const response = await axios.get<OrderResponse>(`${baseUrl}/get-client-orders/${clientId}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    return response.data;
  } catch (error) {
    console.error('Get Client Orders Error:', error);
    
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<OrderResponse>;
      const errorMessage = axiosError.response?.data?.message || 
                          axiosError.response?.data?.error || 
                          axiosError.message || 
                          'Failed to fetch orders';
      
      const customError: any = new Error(errorMessage);
      customError.status = axiosError.response?.status || 500;
      customError.statusText = axiosError.response?.statusText || 'Internal Server Error';
      throw customError;
    }
    
    throw error;
  }
};