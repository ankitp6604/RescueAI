//importing libraries
const cors = require("cors");
const express = require("express");
const session = require("express-session");
require("dotenv").config();
const OpenAI = require('openai');
const fetch = require('node-fetch');

const bodyParser = require("body-parser");
const { Server } = require('socket.io');
const http = require('http');

//initializing app + defining port
const app = express();
const server = http.createServer(app);
const port = 3001;

// Constants for Hugging Face
const EMERGENCY_MODEL = "facebook/blenderbot-400M-distill";
const ANALYSIS_MODEL = "deepset/roberta-base-squad2";

//connecting middlewear
app.use(bodyParser.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {},
  })
);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Store sessions by socket ID
const sessions = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Initialize session for this socket
  sessions.set(socket.id, {
    emergency: undefined,
    name: undefined,
    location: undefined,
    number: undefined,
    init: false
  });

  socket.on('initiate_call', () => {
    convo = "Dispatcher: 1 1 2, what is your emergency?";
    id = Math.floor(Math.random() * 100) * Math.floor(Math.random() * 100);
    hangUp = false;
    redo = [0, 0, 0, 0];
    count = 1;
    emergency = "undefined";
    callerName = "undefined";
    location = "undefined";
    number = "undefined";

    // Reset session for new call
    sessions.set(socket.id, {
      emergency: undefined,
      name: undefined,
      location: undefined,
      number: undefined,
      init: true
    });

    socket.emit('ai_response', {
      message: "1 1 2, what is your emergency?",
      shouldSpeak: true
    });
  });

  socket.on('speech_data', async (data) => {
    try {
      console.log('Received speech data:', data);
      const voiceInput = data.transcript;
      
      const session = sessions.get(socket.id);
      if (!session) {
        throw new Error('No session found');
      }

      const aiResponse = await generateAIResponse(session, voiceInput);
      console.log('AI Response:', aiResponse);
      
      // Update conversation after getting response
      convo += `\nCaller: ${voiceInput}\nDispatcher: ${aiResponse}`;
      
      // Emit AI response
      socket.emit('ai_response', {
        message: aiResponse,
        shouldSpeak: true
      });

      if (hangUp) {
        socket.emit('end_call');
      }

      // Emit updated dashboard data with current session state
      io.emit("call progress event", {
        inProgress: !hangUp,
        emergency: session.emergency || "undefined",
        name: session.name || "undefined",
        location: session.location || "undefined",
        number: session.number || "undefined",
        transcript: convo,
        id: id,
      });

    } catch (error) {
      console.error('Error in speech_data handler:', error);
      socket.emit('ai_response', {
        message: "I'm sorry, there was an error. Please try again.",
        shouldSpeak: true
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    sessions.delete(socket.id);
  });
});

// Initialize OpenAI with the new configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// defining the global variables that will be utilized in various routes
let convo;
let count;
let hangUp;
let redo;
let emergency;
let callerName;
let location;
let number;
let id;

// Function to query Hugging Face API
async function queryHuggingFace(model, inputs) {
  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGING_FACE_TOKEN}`,
          'Content-Type': 'application/json',
        },
        method: "POST",
        body: JSON.stringify({ inputs }),
      }
    );
    return await response.json();
  } catch (error) {
    console.error('Hugging Face API Error:', error);
    throw error;
  }
}

// transcribe endpoints handles twilio calls (initializes call, and calls /respond enpoint for responce)
app.post("/transcribe", async (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();

  if (!req.session.init) {
    twiml.say(
      { voice: "Polly.Joanna-Neural" },
      "9 1 1, what is your emergency?"
    );

    convo += "Dispatcher: 1 1 2, what is your emergency?";
    id = Math.floor(Math.random() * 100) * Math.floor(Math.random() * 100);
    req.session.init = true;
    hangUp = false;
    redo = [0, 0, 0, 0];
    count = 1;
    convo = "";
    emergency = "undefined";
    callerName = "undefined";
    location = "undefined";
    number = "undefined";
  }

  // Listen for user input and pass it to the /respond endpoint
  twiml.gather({
    enhanced: "false",
    speechTimeout: "auto",
    speechModel: "phone_call",
    input: "speech",
    action: `/respond`,
  });

  //  Returning the TwiML response
  res.set("Content-Type", "text/xml");
  res.send(twiml.toString());
});

// respond endpoint handles responce generation and call termination
app.post("/respond", async (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  const voiceInput = req.body.SpeechResult;
  convo += `\nCaller: ${voiceInput}\nDispatcher: `;

  let aiResponse = await generateAIResponse(req, voiceInput);
  twiml.say({ voice: "Polly.Joanna-Neural" }, aiResponse);

  if (hangUp) {
    twiml.hangup();
    emergency = req.session.emergency;
    callerName = req.session.name;
    location = req.session.location;
    number = req.session.number;
    console.log("post hangup 2");

    req.session.emergency = null;
    req.session.name = null;
    req.session.location = null;
    req.session.number = null;
    req.session.init = null;
  }

  io.emit("call progress event", {
    inProgress: hangUp ? false : true,
    emergency: emergency,
    name: callerName,
    location: location,
    number: number,
    transcript: convo,
    id: id,
  });

  twiml.redirect({ method: "POST" }, `/transcribe`);
  res.set("Content-Type", "text/xml");
  res.send(twiml.toString());
});

// generateAIResponce generates the next dispatcher line
async function extractInformation(type, context) {
  try {
    let question;
    switch(type) {
      case 'name':
        question = "Extract only the person's full name without any extra words. If multiple names are mentioned, return only the most likely full name.";
        break;
      case 'number':
        question = "Extract only the phone number digits without any words. If multiple numbers are mentioned, return only the most likely phone number.";
        break;
      case 'location':
        question = "Extract only the complete location or address without any extra words or prefixes like 'yes it is' or 'at'.";
        break;
      default:
        throw new Error('Invalid extraction type');
    }

    const response = await queryHuggingFace(ANALYSIS_MODEL, {
      question: question,
      context: context
    });

    return response.answer || "undefined";
  } catch (error) {
    console.error(`Error extracting ${type}:`, error);
    return "undefined";
  }
}

async function generateAIResponse(session, voiceInput) {
  try {
    console.log("Current session state:", session);
    count += 1;

    const currentEmergency = session.emergency;
    const currentLocation = session.location;
    const currentName = session.name;
    const currentNumber = session.number;

    if (!currentEmergency) {
      const response = await queryHuggingFace(ANALYSIS_MODEL, {
        question: "What type of emergency is mentioned? Answer with only: fire, medical, police, or undefined",
        context: voiceInput.toLowerCase()
      });

      let emergencyresp = response.answer || "undefined";
      if (emergencyresp.includes('fire')) emergencyresp = 'fire';
      else if (emergencyresp.includes('medical')) emergencyresp = 'medical';
      else if (emergencyresp.includes('police')) emergencyresp = 'police';
      else emergencyresp = 'undefined';

      if (emergencyresp === "undefined" && redo[0] < 1) {
        redo[0] += 1;
        return "I understand you need help, can you tell me what the emergency is?";
      }

      session.emergency = emergencyresp;
      emergency = emergencyresp;
      return "Okay, stay calm. Can you tell me your location?";
    }

    if (!currentLocation) {
      const extractedLocation = await extractInformation('location', voiceInput);
      
      if (extractedLocation === "undefined" && redo[1] < 1) {
        redo[1] += 1;
        return "I need to know where you are. Please tell me your location clearly.";
      }

      session.location = extractedLocation;
      location = extractedLocation;
      return "Okay, can I get your full name";
    }

    if (!currentName) {
      const extractedName = await extractInformation('name', voiceInput);
      
      if (extractedName === "undefined" && redo[2] < 1) {
        redo[2] += 1;
        return "Could you please tell me your full name clearly?";
      }

      session.name = extractedName;
      callerName = extractedName;
      return "and whats your phone number just in case we are disconnected";
    }

    if (!currentNumber) {
      const extractedNumber = await extractInformation('number', voiceInput);
      
      if (extractedNumber === "undefined" && redo[3] < 1) {
        redo[3] += 1;
        return "I need a contact number. Please tell me your phone number clearly.";
      }

      session.number = extractedNumber;
      number = extractedNumber;
    }

    if (count >= 3) {
      hangUp = true;
      return "Don't worry, help is on the way. I'm going to end the call to coordinate dispatch efforts, but you should hear back from 9-1-1 officers really soon.";
    }

    return "Stay calm, help is on the way. Can you tell me more about the situation?";

  } catch (error) {
    console.error('Error in generateAIResponse:', error);
    throw error;
  }
}



const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

