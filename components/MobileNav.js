"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileNav() {
    const pathname = usePathname();

    return (
        <nav className="mobile-nav">
            <Link href="/" className={pathname === '/' ? 'active' : ''}>
                Home
            </Link>
            <Link href="/chat" className={pathname === '/chat' ? 'active' : ''}>
                Chat
            </Link>
            <Link href="/terminal" className={pathname === '/terminal' ? 'active' : ''}>
                Terminal
            </Link>

            <style jsx>{`
                .mobile-nav {
                    display: none;
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: rgba(0, 0, 0, 0.95);
                    padding: 10px;
                    padding-bottom: calc(10px + env(safe-area-inset-bottom));
                    z-index: 1000;
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    border-top: 1px solid #ff0000;
                }

                .mobile-nav a {
                    flex: 1;
                    text-align: center;
                    color: #ffffff;
                    text-decoration: none;
                    padding: 12px;
                    border-radius: 8px;
                    transition: all 0.3s ease;
                    font-size: 14px;
                    min-height: 44px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .mobile-nav a:active {
                    background: rgba(255, 0, 0, 0.2);
                }

                .mobile-nav a.active {
                    color: #ff0000;
                    background: rgba(255, 0, 0, 0.1);
                }

                @media (max-width: 768px) {
                    .mobile-nav {
                        display: flex;
                        justify-content: space-around;
                        align-items: center;
                    }
                }

                /* iOS specific styles */
                @supports (-webkit-touch-callout: none) {
                    .mobile-nav {
                        padding-bottom: max(10px, env(safe-area-inset-bottom));
                    }
                }
            `}</style>
        </nav>
    );
} 