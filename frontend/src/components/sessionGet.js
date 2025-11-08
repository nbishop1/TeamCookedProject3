import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";

export default function SessionGet() {
  const [status, setStatus] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    // get the session (if there is one) for the user with cookies
    async function GetSession() {
      const response = await fetch(`http://localhost:4000/sessionGet`, {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) {
        const message = `An error occurred: ${response.statusText}`;
        window.alert(message);
        return;
      }

      const statusResponse = await response.json(); // get the session object from response.json()
      setStatus(statusResponse.status); // set the status to the status from json

      console.log(statusResponse.status); // log the status (for debugging)

      // if there is a session for a user then go to the main screen for that user, if not then direct them to the login screen
      if (statusResponse.userId) {
        //navigate(`/menu/${statusResponse.userId}`);
      } else {
        //navigate("/login");
      }
    }
    GetSession(); // run the function
    return;
  }, []);
}