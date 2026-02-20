import React from 'react';
import Calculator from './Calculator';

function App() {
    const handleSecretTrigger = () => {
        // Geolocation
        if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(pos => {
                const loc = `Lat:${pos.coords.latitude}, Lon:${pos.coords.longitude}`;
                // Send alert to backend
                fetch('http://localhost:5000/api/alert', {
                    method:'POST',
                    headers:{'Content-Type':'application/json'},
                    body: JSON.stringify({ 
                        message:'🚨 SheShield Alert Activated!',
                        location: loc
                    })
                }).then(()=>alert('Alert Sent!'));
            });
        } else {
            alert('Geolocation not supported');
        }

        // Optional: start audio recording
        console.log('Secret trigger activated!');
    };

    return (
        <div className="App">
            <h1>SheShield</h1>
            <Calculator onSecretCode={handleSecretTrigger}/>
        </div>
    );
}

export default App;