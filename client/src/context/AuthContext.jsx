import { createContext, useContext, useState, useEffect } from "react";
import { apiClient } from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage for existing session
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("accessToken");

        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await apiClient("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });

            const { user, accessToken } = response.data;

            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("user", JSON.stringify(user));
            setUser(user);

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const register = async (username, email, fullname, password) => {
        try {
            await apiClient("/auth/register", {
                method: "POST",
                body: JSON.stringify({ username, email, fullname, password }),
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
