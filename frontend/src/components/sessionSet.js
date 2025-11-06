import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";

export default function SessionSet() {
  const [status, setStatus] = useState("");

  const params = useParams();
  const navigate = useNavigate();

  useEffect (() => {
    // This sets the session for the current user based off thier id
    async function SetSession() {
      const id = params.id.toString();
      const response = await fetch(`http://localhost:4000/sessionSet/${id}`,
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
      const statusResponse = await response.json();       // get the session object from response.json()
      setStatus(statusResponse.status);                   // set the status to the status from json
      console.log(statusResponse.userId)                  // log the status (for debugging)
      //navigate(`/menu/${statusResponse.userId}`);         // move the user to their menu screen
    }
    SetSession();                                         // call the function
    return;
  },[]);
}