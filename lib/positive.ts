import redis from "./redis.js";

export async function positive(fid: number, username: string) {
  const id = fid.toString();
  await redis.zincrby("positive", 1, id);
  await redis.hset("usernames", id, username);
}