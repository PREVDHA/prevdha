import React from 'react';
import Calculator from './Calculator';
import { useRef } from "react";
import Contacts from "./Contacts.jsx";
import { useEffect } from 'react';
import { useState } from 'react';

function App() {
  const audioChunksRef = useRef([]);

  const handleSecretTrigger = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async pos => {
        const loc = `Lat:${pos.coords.latitude}, Lon:${pos.coords.longitude}`;

        try {
          const res = await fetch('https://prevdha.onrender.com/api/alert', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({
              message:'🚨 SheShield Alert Activated!',
              location: loc
            })
          });

          const body = await res.json();

          // If backend returns whatsappLinks, try to open them so user can send messages
          if (body && Array.isArray(body.whatsappLinks)) {
            body.whatsappLinks.forEach(w => {
              try {
                window.open(w.link, '_blank');
              } catch (e) {
                console.warn('Unable to open WhatsApp link', e);
              }
            });
          }

          alert('Alert processed');
        } catch (err) {
          console.error('Alert failed', err);
          alert('Failed to send alert');
        }
      });
    } else {
      // still attempt to send alert without location
      (async () => {
        try {
          const res = await fetch('https://prevdha.onrender.com/api/alert', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({
              message:'🚨 SheShield Alert Activated!',
              location: 'Unknown'
            })
          });
          const body = await res.json();
          if (body && Array.isArray(body.whatsappLinks)) {
            body.whatsappLinks.forEach(w => window.open(w.link, '_blank'));
          }
          alert('Alert processed');
        } catch (err) {
          console.error('Alert failed', err);
          alert('Failed to send alert');
        }
      })();
    }

    startRecording();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

        const audioURL = URL.createObjectURL(audioBlob);
        const a = document.createElement("a");
        a.href = audioURL;
        a.download = `SheShield_Evidence_${Date.now()}.webm`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      };

      mediaRecorder.start();

      setTimeout(() => {
        mediaRecorder.stop();
        stream.getTracks().forEach(track => track.stop());
      }, 60000);

    } catch (error) {
      alert("Microphone permission is required.");
      console.error(error);
    }
  };

  // Keyboard shortcut: Alt+S triggers SOS
  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey && e.key && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSecretTrigger();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []); // intentionally no deps so handler uses latest closure

  // Live location tracking state
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef(null);

  const startLiveTracking = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      return;
    }

    const success = async (pos) => {
      const latitude = pos.coords.latitude;
      const longitude = pos.coords.longitude;
      const timestamp = pos.timestamp;

      try {
        await fetch('https://prevdha.onrender.com/api/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude, longitude, timestamp })
        });
      } catch (err) {
        console.error('Failed to POST location', err);
      }
    };

    const error = (err) => {
      console.error('Live location error', err);
    };

    const id = navigator.geolocation.watchPosition(success, error, { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 });
    watchIdRef.current = id;
    setIsTracking(true);
  };

  const stopLiveTracking = () => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  };

  return (
    <div className="App">
      <h1>SheShield</h1>
      <Calculator onSecretCode={handleSecretTrigger}/>

      <div style={{marginTop:12}}>
        {isTracking ? (
          <button onClick={stopLiveTracking} style={{padding:'8px 12px', marginRight:8}}>Stop Live Tracking</button>
        ) : (
          <button onClick={startLiveTracking} style={{padding:'8px 12px', marginRight:8}}>Start Live Tracking</button>
        )}
        <button onClick={handleSecretTrigger} style={{padding:'8px 12px'}}>Send SOS Now</button>
      </div>

      <Contacts />
    </div>
  );
}

export default App;
