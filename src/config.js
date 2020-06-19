const env = process.env;
var rooms = {};

const roomsVars = Object.keys(env).filter(key => key.startsWith("REACT_APP_ROOM_"));
roomsVars.forEach(function(key) {
    const [rn, k] = key.split("REACT_APP_ROOM_").pop().split("_");
    rooms[rn] = rooms[rn] || { name: rn }; // initialize in case empty
    rooms[rn][k] = env[key];
})

export default {
    ASSET_PATH: env.REACT_APP_ASSET_PATH || ".",
    DAILY_SUBDOMAIN: env.REACT_APP_DAILY_SUBDOMAIN,
    COMPANY_NAME: env.REACT_APP_COMPANY_NAME || "Daily.co",
    COMPANY_URL: env.REACT_APP_COMPANY_URL || "https://daily.co",
    rooms: rooms,
}