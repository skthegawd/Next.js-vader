import Sidebar from './Sidebar';
import '../styles/globals.css';

export default function Layout({ children }) {
    return (
        <div className="layout-container">
            <Sidebar />
            <main className="content-area">{children}</main>
        </div>
    );
}