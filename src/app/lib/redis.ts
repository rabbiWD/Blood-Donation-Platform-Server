import { createClient } from "redis";
import config from "../config";

// let redisClient: ReturnType<typeof createClient> | null = null;

// export const getRedisClient = async () => {
// 	if (!redisClient) {
// 		try {
// 			redisClient = createClient({
// 				username: config.redis_user || "default",
// 				password: config.redis_password || "",
// 				socket: {
// 					host: config.redis_host || "localhost",
// 					port: config.redis_port ? Number(config.redis_port) : 6379,
// 				},
// 			});

// 			redisClient.on("error", (err) => {
// 				console.warn("Redis Client Error (fallback mode active):", err.message);
// 			});

// 			await redisClient.connect();
// 		} catch (err) {
// 			console.warn("Redis connection failed. Running without Redis cache.", err);
// 			redisClient = null;
// 		}
// 	}
// 	return redisClient;
// };

export const redisClient = createClient({
    username: config.redis_user,
    password: config.redis_password,
    socket: {
        host: config.redis_host,
        port: Number(config.redis_port)
    }
});
