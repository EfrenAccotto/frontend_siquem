// ============================================================================
// IMPORTS
// ============================================================================
import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const Footer = () => {
    // ============================================================================
    // STATE
    // ============================================================================
    const [showBackToTop, setShowBackToTop] = useState(false);
    const currentYear = new Date().getFullYear();

    // ============================================================================
    // EFFECTS
    // ============================================================================

    // Detectar scroll para mostrar/ocultar botón back-to-top
    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 300);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // ============================================================================
    // EVENT HANDLERS
    // ============================================================================

    /**
     * Scroll suave al tope de la página
     */
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    // ============================================================================
    // DATA
    // ============================================================================

    const quickLinks = [
        { label: 'Inicio', url: '/inicio', icon: 'pi pi-home' },
        { label: 'Clientes', url: '/clientes', icon: 'pi pi-users' },
        { label: 'Productos', url: '/productos', icon: 'pi pi-box' },
        { label: 'Ventas', url: '/ventas', icon: 'pi pi-shopping-cart' },
        { label: 'Pedidos', url: '/pedidos', icon: 'pi pi-list' }
    ];

    const contactInfo = [
        { icon: 'pi pi-envelope', text: 'contacto@pampacode.com', type: 'email' },
        { icon: 'pi pi-phone', text: '+54 9 11 1234-5678', type: 'phone' },
        { icon: 'pi pi-map-marker', text: 'Buenos Aires, Argentina', type: 'address' }
    ];

    const socialLinks = [
        { icon: 'pi pi-github', url: 'https://github.com/pampacode', label: 'GitHub', color: '#333' },
        { icon: 'pi pi-linkedin', url: 'https://linkedin.com/company/pampacode', label: 'LinkedIn', color: '#0077b5' },
        { icon: 'pi pi-twitter', url: 'https://twitter.com/pampacode', label: 'Twitter', color: '#1da1f2' },
        { icon: 'pi pi-instagram', url: 'https://instagram.com/pampacode', label: 'Instagram', color: '#e4405f' }
    ];

    const legalLinks = [
        { label: 'Términos de Servicio', url: '#' },
        { label: 'Política de Privacidad', url: '#' },
        { label: 'Cookies', url: '#' }
    ];

    // ============================================================================
    // RENDER
    // ============================================================================
    return (
        <>
            {/* Back to Top Button */}
            <div
                className={`footer-back-to-top ${showBackToTop ? 'footer-back-to-top-visible' : ''}`}
                onClick={scrollToTop}
                role="button"
                tabIndex={0}
                aria-label="Volver arriba"
                onKeyPress={(e) => e.key === 'Enter' && scrollToTop()}
            >
                <i className="pi pi-arrow-up"></i>
            </div>

            {/* Main Footer */}
            <footer className="footer">
                <div className="footer-gradient"></div>

                <div className="footer-content">
                    {/* Company Info */}
                    <div className="footer-section">
                        <div className="footer-brand">
                            <i className="pi pi-code footer-brand-icon"></i>
                            <h3 className="footer-brand-name">PampaCode</h3>
                        </div>
                        <p className="footer-tagline">
                            Innovación y Tecnología al servicio de tu negocio
                        </p>
                        <p className="footer-description">
                            Desarrollamos soluciones tecnológicas de vanguardia con las mejores prácticas de UX/UI,
                            transformando ideas en experiencias digitales excepcionales.
                        </p>
                        <div className="footer-tech-badges">
                            <span className="footer-badge">React</span>
                            <span className="footer-badge">Node.js</span>
                            <span className="footer-badge">UX/UI</span>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="footer-section">
                        <h4 className="footer-section-title">Enlaces Rápidos</h4>
                        <ul className="footer-links">
                            {quickLinks.map((link, index) => (
                                <li key={index} className="footer-link-item">
                                    <a
                                        href={link.url}
                                        className="footer-link"
                                        aria-label={link.label}
                                    >
                                        <i className={`${link.icon} footer-link-icon`}></i>
                                        <span>{link.label}</span>
                                        <i className="pi pi-arrow-right footer-link-arrow"></i>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="footer-section">
                        <h4 className="footer-section-title">Contacto</h4>
                        <ul className="footer-contact">
                            {contactInfo.map((info, index) => (
                                <li key={index} className="footer-contact-item">
                                    <i className={`${info.icon} footer-contact-icon`}></i>
                                    <span className="footer-contact-text">{info.text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Social Media */}
                    <div className="footer-section">
                        <h4 className="footer-section-title">Síguenos</h4>
                        <p className="footer-social-text">
                            Mantente conectado con nosotros en nuestras redes sociales
                        </p>
                        <div className="footer-social">
                            {socialLinks.map((social, index) => (
                                <a
                                    key={index}
                                    href={social.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="footer-social-link"
                                    aria-label={social.label}
                                    style={{ '--social-color': social.color }}
                                >
                                    <i className={social.icon}></i>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="footer-bottom">
                    <div className="footer-bottom-content">
                        <div className="footer-copyright">
                            <i className="pi pi-copyright"></i>
                            <span>{currentYear} PampaCode. Todos los derechos reservados.</span>
                        </div>
                        <div className="footer-legal">
                            {legalLinks.map((link, index) => (
                                <React.Fragment key={index}>
                                    <a href={link.url} className="footer-legal-link">
                                        {link.label}
                                    </a>
                                    {index < legalLinks.length - 1 && <span className="footer-legal-separator">•</span>}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Decorative Wave */}
                <div className="footer-wave">
                    <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
                        <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
                    </svg>
                </div>
            </footer>
        </>
    );
};

// ============================================================================
// EXPORT
// ============================================================================
export default Footer;
