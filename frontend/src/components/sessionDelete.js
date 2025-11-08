import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";

export default function SessionDelete() {
  const [status, setStatus] = useState("");

  const navigate = useNavigate();

  useEffect (() => {
    // deletes the session from mongo for the current user
    async function DeleteSession() {
      const response = await fetch(`http://localhost:4000/sessionDelete`,
        {
          method: "GET",
          credentials: 'include'
        }
      );
      if (!response.ok) {
        const message = `An error occurred: ${response.statusText}`;
        window.alert(message);
        return;
      }
      const statusResponse = await response.json();   // get the session object from response.json()
      setStatus(statusResponse.status);               // set the status to the status from json
      //navigate("/login");                             // return user to the login screen
    }
    DeleteSession();                                  // run the function
    return;
  },[]);
}