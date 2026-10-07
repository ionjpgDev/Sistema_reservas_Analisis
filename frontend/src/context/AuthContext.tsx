import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

// =====================================================
// TIPOS
// =====================================================
export interface Usuario {
    id: number;
    nombre: string;
    correo: string;
    rol: string;
    exp: number;
    iat?: number;
    [key: string]: unknown;
}

export const normalizarRol = (rol?: string | null): string => (rol ?? '').trim().toLowerCase();

export const tieneRol = (usuario: Usuario | null | undefined, ...roles: string[]) => {
    const rolActual = normalizarRol(usuario?.rol);
    return roles.some((rol) => normalizarRol(rol) === rolActual);
};

export interface AuthContextType {
    usuario: Usuario | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (nuevoToken: string) => void;
    logout: () => void;
}

interface AuthProviderProps {
    children: ReactNode;
}

// =====================================================
// CONTEXTO
// =====================================================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =====================================================
// PROVIDER
// =====================================================
export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [token, setToken] = useState<string | null>(
        localStorage.getItem('token') || null
    );

    const logout = (): void => {
        localStorage.removeItem('token');
        setToken(null);
        setUsuario(null);
    };

    const login = (nuevoToken: string): void => {
        localStorage.setItem('token', nuevoToken);
        setToken(nuevoToken);
        try {
            const decodificado = jwtDecode<Usuario>(nuevoToken);
            setUsuario(decodificado);
        } catch (error) {
            console.error("Error al leer el token", error);
            logout();
        }
    };

    // Validar el token y su expiración al recargar
    useEffect(() => {
        if (token) {
            try {
                const decodificado = jwtDecode<Usuario>(token);
                if (decodificado.exp * 1000 < Date.now()) {
                    logout();
                } else {
                    setUsuario(decodificado);
                }
            } catch (error) {
                logout();
            }
        }
    }, [token]);

    // SISTEMA AFK (30 minutos de inactividad)
    useEffect(() => {
        if (!token) return;

        let timeoutId: ReturnType<typeof setTimeout>;
        const TIEMPO_INACTIVIDAD = 30 * 60 * 1000;

        const reiniciarTemporizador = (): void => {
            if (timeoutId) clearTimeout(timeoutId);

            timeoutId = setTimeout(() => {
                console.warn("Sesión cerrada por inactividad (AFK)");
                logout();
                window.location.href = '/login';
            }, TIEMPO_INACTIVIDAD);
        };

        const eventosActividad: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'click', 'scroll'];

        reiniciarTemporizador();
        eventosActividad.forEach(evento =>
            window.addEventListener(evento, reiniciarTemporizador)
        );

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            eventosActividad.forEach(evento =>
                window.removeEventListener(evento, reiniciarTemporizador)
            );
        };
    }, [token]);

    return (
        <AuthContext.Provider
            value={{ usuario, token, isAuthenticated: !!token, login, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// =====================================================
// HOOK
// =====================================================
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de AuthProvider');
    }
    return context;
};