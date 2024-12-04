// Sidebar.tsx
import { useState } from 'react'
import { Home, Settings, Dashboard, Restaurant, LunchDining } from '@mui/icons-material';
import { Sidebar, Menu, MenuItem } from 'react-pro-sidebar';
import { useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {

    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate()

    const toggleSidebar = () => {
        setCollapsed(!collapsed)
    };

    return (
        <Sidebar collapsed={collapsed} id='navbar' style={{position: "fixed", height: "100vh", width: collapsed ? "80px" : "250px"}}>
            <Menu>
                <div id='sidebar--header'>
                    <img src='../../public/sidebar-img.png' style={{height: "80px", width: "80px"}}></img>
                    <img src='../../public/beacon-logo.png' style={{height: "80px", width: "105px"}}></img>
                </div>
                <button id="sidebar--button" style={collapsed ? {marginLeft: "42px"} : {marginLeft: "212px"}} onClick={toggleSidebar}>{collapsed ? ">" : "<"}</button>
                <div id="sidebar--items">
                    <MenuItem icon={<Home />} onClick={() => {navigate('/')}} className='sidebar--item'>Home</MenuItem>
                    <MenuItem icon={<Restaurant />} onClick={() => {navigate('/food-preferences')}} className='sidebar--item'>Food Preferences</MenuItem>
                    <MenuItem icon={<LunchDining />} onClick={() => {navigate('/meal-plan')}} className='sidebar--item'>Meal Plans</MenuItem>
                    <MenuItem icon={<Dashboard />} onClick={() => {navigate('/insights')}} className='sidebar--item'>Dashboard</MenuItem>
                    <MenuItem icon={<Settings />} onClick={() => {navigate('/settings')}} className='sidebar--item'>Settings</MenuItem>
                </div>
            </Menu>
        </Sidebar>
    );
};

export default Navbar;