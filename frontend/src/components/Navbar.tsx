// Sidebar.tsx
import { useState } from 'react'
import { MenuOutlined, Settings, StarBorder, EmojiEmotions, Dashboard } from '@mui/icons-material';
import { Sidebar, Menu, MenuItem } from 'react-pro-sidebar';

const Navbar: React.FC = () => {

    const [collapsed, setCollapsed] = useState(false);

    const toggleSidebar = () => {
        setCollapsed(!collapsed)
    };

    return (
        <Sidebar collapsed={collapsed}>
            <Menu>
                <MenuItem icon={<MenuOutlined />} onClick={toggleSidebar}></MenuItem>
                <MenuItem icon={<EmojiEmotions />}>Food Preferences</MenuItem>
                <MenuItem icon={<StarBorder />}>Trending</MenuItem>
                <MenuItem icon={<Dashboard />}>Dashboard</MenuItem>
                <MenuItem icon={<Settings />}>Settings</MenuItem>
            </Menu>
        </Sidebar>
    );
};

export default Navbar;