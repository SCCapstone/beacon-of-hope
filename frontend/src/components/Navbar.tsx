// Sidebar.tsx
import { useState } from 'react'
import { MenuOutlined, Home, Settings, Dashboard, Restaurant, LunchDining } from '@mui/icons-material';
import { Sidebar, Menu, MenuItem } from 'react-pro-sidebar';
import { useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {

    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate()

    const toggleSidebar = () => {
        setCollapsed(!collapsed)
    };

    return (
        <Sidebar collapsed={collapsed}>
            <Menu>
                <MenuItem icon={<MenuOutlined />} onClick={toggleSidebar}></MenuItem>
                <MenuItem icon={<Home />} onClick={() => {navigate('/')}}>Home</MenuItem>
                <MenuItem icon={<Restaurant />} onClick={() => {navigate('/food-preferences')}}>Food Preferences</MenuItem>
                <MenuItem icon={<LunchDining />} onClick={() => {navigate('/meal-plan')}}>Meal Plans</MenuItem>
                <MenuItem icon={<Dashboard />} onClick={() => {navigate('/insights')}}>Dashboard</MenuItem>
                <MenuItem icon={<Settings />} onClick={() => {navigate('/settings')}}>Settings</MenuItem>
            </Menu>
        </Sidebar>
    );
};

export default Navbar;