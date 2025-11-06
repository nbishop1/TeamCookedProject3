import React from "react";
import { Route, Routes } from "react-router-dom";
import SessionSet from "./components/sessionSet.js";
import SessionGet from "./components/sessionGet.js";
import SessionDelete from "./components/sessionDelete.js";

const App = () => {
  return (
    <div>
      <Routes>
        <Route path ="/" element={<SessionGet />} />
        <Route path ="/sessionSet/:id" element={<SessionSet />} />
        <Route path ="/sessionDelete" element={<SessionDelete />} />
      </Routes>
    </div>
  );
}
export default App;