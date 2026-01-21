import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';

// ============================================================================
// THEME CONTEXT
// ============================================================================

const ThemeContext = createContext();

// Temas disponibles de PrimeReact
const THEMES = {
    light: 'lara-light-blue',
    dark: 'lara-dark-blue'
};

export const ThemeProvider = ({ children }) => {
    // Obtener tema guardado o usar 'light' por defecto
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('app-theme') || 'light';
    });

    // Función para cambiar el tema
    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const setThemeMode = useCallback((nextTheme) => {
        setTheme(nextTheme === 'dark' ? 'dark' : 'light');
    }, []);

    // Aplicar el tema cuando cambia
    useEffect(() => {
        // Guardar tema en localStorage
        localStorage.setItem('app-theme', theme);

        // Cambiar el link del tema de PrimeReact
        const themeLink = document.getElementById('app-theme');
        const themeName = THEMES[theme];
        const newHref = `https://unpkg.com/primereact/resources/themes/${themeName}/theme.css`;

        if (themeLink) {
            themeLink.href = newHref;
        } else {
            // Crear el link si no existe
            const link = document.createElement('link');
            link.id = 'app-theme';
            link.rel = 'stylesheet';
            link.href = newHref;
            document.head.appendChild(link);
        }

        // Agregar/remover clase dark al body para estilos personalizados
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: setThemeMode, isDark: theme === 'dark' }}>
            {children}
        </ThemeContext.Provider>
    );
};

// Hook personalizado para usar el contexto del tema
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme debe ser usado dentro de ThemeProvider');
    }
    return context;
};

export default ThemeContext;
