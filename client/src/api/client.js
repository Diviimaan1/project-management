export const API_URL = "http://localhost:8000/api/v1";

/**
 * Wrapper around fetch to handle auth headers and error parsing
 */
export async function apiClient(endpoint, options = {}) {
    const token = localStorage.getItem("accessToken");

    const headers = {
        ...options.headers,
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    // Auto-set Content-Type to JSON unless it's FormData (file upload)
    if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    const config = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);

        // Handle 401 Unauthorized (token expired)
        if (response.status === 401) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
            // Optional: redirect to login
            if (!window.location.pathname.includes("/login")) {
                window.location.href = "/login";
            }
            throw new Error("Session expired");
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "API request failed");
        }

        return data;
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
}
