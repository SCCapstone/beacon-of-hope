// Sidebar.tsx
import { useState } from 'react'
import { MenuRounded, Home, Settings, Dashboard, Restaurant, LunchDining } from '@mui/icons-material';
import { Sidebar, Menu, MenuItem } from 'react-pro-sidebar';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

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
                    <img src='../../sidebar-img.png' style={{height: "60px", width: "60px"}}></img>
                    {collapsed ? "" : <img src='../../public/beacon-logo.png' style={{height: "80px", width: "105px"}}></img>}
                </div>
                <div id="sidebar--items">
                    <button onClick={toggleSidebar} className='sidebar--button'><MenuRounded /></button>
                    <button onClick={() => {navigate('/')}} className='sidebar--button'><Home />{collapsed ? "" : "Home"}</button>
                    <button onClick={() => {navigate('/food-preferences')}} className='sidebar--button'><Restaurant />{collapsed ? "" : "Food Preferences"}</button>
                    <button onClick={() => {navigate('/meal-plan')}} className='sidebar--button'><LunchDining />{collapsed ? "" : "Meal Plans"}</button>
                    <button onClick={() => {navigate('/insights')}} className='sidebar--button'><Dashboard />{collapsed ? "" : "Dashboard"}</button>
                    <button onClick={() => {navigate('/settings')}} className='sidebar--button'><Settings />{collapsed ? "" : "Settings"}</button>
                </div>
            </Menu>
        </Sidebar>
    );
};

export default Navbar;
