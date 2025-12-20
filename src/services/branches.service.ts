import axios from "axios";
import { BASE_URL } from "./orderApi";

export const getBranchById = async (id: string) => {
    const token = localStorage.getItem("token");
    
    try {
        const response = await axios.get(
            `${BASE_URL}/branches/${id}`,
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

