require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
    try {
        const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + process.env.GEMINI_API_KEY);
        const data = await res.json();
        const flashModels = data.models.filter(m => m.name.includes('flash')).map(m => m.name);
        console.log("Flash models:", flashModels);
    } catch (e) {
        console.error(e);
    }
}
test();
