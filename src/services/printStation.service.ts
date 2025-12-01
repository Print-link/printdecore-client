import axios from "axios";
import { BASE_URL } from "./orderApi";

export const getPrintStationById = async (id: string) => {
    const token = localStorage.getItem("token");
    
    try {
        const response = await axios.get(
            `${BASE_URL}/clients/get-print-station-by-id/${id}`,
            {
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching print station:", error);
        throw error;
    }
};