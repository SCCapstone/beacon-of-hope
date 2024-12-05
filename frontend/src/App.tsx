import { useLocation } from "react-router-dom";
import './App.css';

import UseRoutes from "./components/UseRoutes";
import Navbar from "./components/Navbar";

const  App: React.FC = () => {

  const location = useLocation();

  return (
    <div className="container">
      {location.pathname !== '/welcome' && location.pathname !== '/login' && <Navbar />}
      <UseRoutes />
    </div>
  );
};

export default App;
