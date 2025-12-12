const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// --- Mock Database ---
const OWNERS = ['Alice Chen', 'Bob Smith', 'Charlie Kim', 'Diana Prince', 'Evan Wright', 'Fiona Gallagher', 'George Miller', 'Hannah Lee', 'Ian Stark', 'Julia Roberts'];
let vehicles = Array.from({ length: 10 }, (_, i) => ({
  id: `EV-${100 + i}`,
  model: 'Model X-Pro',
  owner: OWNERS[i],
  telemetry: {
    speed: 0,
    batteryTemp: 25,
    vibration: 2,
    brakeWear: 10
  }
}));

// --- Telemetry Generator ---
function generateTelemetry() {
  vehicles = vehicles.map(v => {
    // Chaos Factor: 5% chance of critical failure
    const chaos = Math.random() < 0.05;
    
    return {
      ...v,
      telemetry: {
        speed: parseFloat((Math.random() * 100).toFixed(1)),
        batteryTemp: chaos ? parseFloat((Math.random() * 40 + 60).toFixed(1)) : parseFloat((Math.random() * 10 + 20).toFixed(1)),
        vibration: chaos ? parseFloat((Math.random() * 80 + 10).toFixed(1)) : parseFloat((Math.random() * 5).toFixed(1)),
        brakeWear: v.telemetry.brakeWear + 0.1
      }
    };
  });
}

// Run generator every 5 seconds
setInterval(generateTelemetry, 5000);

// --- Endpoints ---

app.get('/api/vehicles', (req, res) => {
  res.json(vehicles);
});

app.get('/api/telemetry/:id', (req, res) => {
  const vehicle = vehicles.find(v => v.id === req.params.id);
  if (vehicle) {
    res.json(vehicle.telemetry);
  } else {
    res.status(404).json({ error: 'Vehicle not found' });
  }
});

// Mock Agent Action Endpoint
app.post('/api/agent/action', (req, res) => {
  const { agent, action, target } = req.body;
  console.log(`[${agent}] executing ${action} on ${target}`);
  res.json({ status: 'success', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`EV-GUARD Server running on port ${PORT}`);
});
