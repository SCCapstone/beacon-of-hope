// App.tsx
import { useLocation } from "react-router-dom";

import UseRoutes from "./components/UseRoutes";
import Navbar from "./components/Navbar";

const  App: React.FC = () => {

  const location = useLocation();

  return (
    <div>
      {location.pathname !== '/welcome' && location.pathname !== '/login' && <Navbar />}
      <UseRoutes />
    </div>
  );
};

export default App;
