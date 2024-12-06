import { useState } from 'react';
import { MenuRounded, Home, Settings, Dashboard, Restaurant, LunchDining, Logout } from '@mui/icons-material';
import { Sidebar, Menu } from 'react-pro-sidebar';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar: React.FC = () => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();

    const toggleSidebar = () => {
        setCollapsed(!collapsed);
    };

    return (
        <Sidebar collapsed={collapsed} id="navbar">
            <Menu>
                {/* Header Section */}
                <div id="sidebar--header">
                    <img src="../../sidebar-img.png" style={{ height: "60px", width: "60px" }} alt="Sidebar Icon" />
                    {collapsed ? "" : <img src="../../beacon-logo.png" style={{ height: "80px", width: "105px" }} alt="Beacon Logo" />}
                </div>

                {/* Items Section */}
                <div id="sidebar--items">
                    <button onClick={toggleSidebar} className="sidebar--button"><MenuRounded /></button>
                    <button onClick={() => { navigate('/home'); }} className="sidebar--button"><Home />{collapsed ? "" : "Home"}</button>
                    <button onClick={() => { navigate('/food-preferences'); }} className="sidebar--button"><Restaurant />{collapsed ? "" : "Food Preferences"}</button>
                    <button onClick={() => { navigate('/meal-plan'); }} className="sidebar--button"><LunchDining />{collapsed ? "" : "Meal Plans"}</button>
                    <button onClick={() => { navigate('/insights'); }} className="sidebar--button"><Dashboard />{collapsed ? "" : "Dashboard"}</button>
                    <button onClick={() => { navigate('/settings'); }} className="sidebar--button"><Settings />{collapsed ? "" : "Settings"}</button>
                </div>

                {/* Logout Section */}
                <div id="sidebar--logout">
                    <button onClick={() => { navigate('/'); }} className="sidebar--button"><Logout />{collapsed ? "" : "Logout"}</button>
                </div>
            </Menu>
        </Sidebar>
    );
};

export default Navbar;
