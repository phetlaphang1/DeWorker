import * as rai from './server/scripts/libs/rai.js';

const reply = await rai.promptBase("Hello, how are you?");
console.log("Reply:", reply);