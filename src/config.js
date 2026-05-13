const env = import.meta.env;
const rooms = {};

// Vite uses VITE_ prefix for env vars
const roomsVars = Object.keys(env).filter(key => key.startsWith("VITE_ROOM_"));
roomsVars.forEach(function(key) {
    const [rn, k] = key.split("VITE_ROOM_").pop().split("_");
    rooms[rn] = rooms[rn] || { name: rn };
    rooms[rn][k] = env[key];
});

export default {
    ASSET_PATH: env.VITE_ASSET_PATH || ".",
    DAILY_SUBDOMAIN: env.VITE_DAILY_SUBDOMAIN,
    COMPANY_NAME: env.VITE_COMPANY_NAME || "Daily.co",
    COMPANY_URL: env.VITE_COMPANY_URL || "https://daily.co",
    rooms: rooms,
}
