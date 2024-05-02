import {
  init,
  getFarcasterUserDetails,
  validateFramesMessage,
} from "@airstack/frames";
import { Frog, Button } from "frog";
import { devtools } from "frog/dev";
import { serveStatic } from "frog/serve-static";
import { handle } from 'frog/vercel';
import { repped } from "../lib/repped.js";
import { negged } from "../lib/negged.js";
import { Box, Heading, Text, VStack, vars } from "../lib/ui.js";
import redis from "../lib/redis.js";
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const REPPED_URL =
  "https://warpcast.com/~/add-cast-action?url=https://castcreds.vercel.app/api/repped";

const NEGGED_URL =
  "https://warpcast.com/~/add-cast-action?url=https://castcreds.vercel.app/api/negged";

const CHANNEL_URL = "https://warpcast.com/~/channel/castcred";

init(process.env.AIRSTACK_API_KEY as string);

export const app = new Frog({
  assetsPath: "/",
  basePath: "/api",
  ui: { vars },
  browserLocation: 'https://github.com/Mr94t3z/castcreds',
});

// Cast action GET handler for repped
app.hono.get("/repped", async (c) => {
  return c.json({
    name: "Repped Creds",
    icon: "heart",
    description: "Repped Creds by @injustcuz and @0x94t3z",
    aboutUrl: "https://github.com/Mr94t3z/castcreds",
    action: {
      type: "post",
    },
  });
});

// Cast action POST handler for repped
app.hono.post("/repped", async (c) => {
  const body = await c.req.json();

  const { isValid, message } = await validateFramesMessage(body);
  const interactorFid = message?.data?.fid;
  const castFid = message?.data.frameActionBody.castId?.fid as number;
  if (isValid) {
    if (interactorFid === castFid) {
      return c.json({ message: "Nice try." }, 400);
    }

    const { data, error } = await getFarcasterUserDetails({
      fid: castFid,
    });

    if (error) {
      return c.json({ message: "Error. Try Again." }, 500);
    }

    const username = data?.profileName || '';

    await repped(castFid, username);

    let message = `You repped @${username}`;
    if (message.length > 30) {
      message = "Repped!";
    }

    return c.json({ message });
  } else {
    return c.json({ message: "Unauthorized" }, 401);
  }
});

// Cast action GET handler for negged
app.hono.get("/negged", async (c) => {
  return c.json({
    name: "Negged Creds",
    icon: "eye-closed",
    description: "Negged Creds by @injustcuz and @0x94t3z",
    aboutUrl: "https://github.com/Mr94t3z/castcreds",
    action: {
      type: "post",
    },
  });
});

// Cast action POST handler for negged
app.hono.post("/negged", async (c) => {
  const body = await c.req.json();

  const { isValid, message } = await validateFramesMessage(body);
  const interactorFid = message?.data?.fid;
  const castFid = message?.data.frameActionBody.castId?.fid as number;
  if (isValid) {
    if (interactorFid === castFid) {
      return c.json({ message: "Nice try." }, 400);
    }

    const { data, error } = await getFarcasterUserDetails({
      fid: castFid,
    });

    if (error) {
      return c.json({ message: "Error. Try Again." }, 500);
    }

    const username = data?.profileName || '';

    await negged(castFid, username);

    let message = `You negged @${username}`;
    if (message.length > 30) {
      message = "Negged!";
    }

    return c.json({ message });
  } else {
    return c.json({ message: "Unauthorized" }, 401);
  }
});

// Frame handlers
app.frame("/", (c) => {
  return c.res({
    image: (
      <Box
        grow
        alignVertical="center"
        backgroundColor="white"
        padding="32"
        border="1em solid rgb(71,42,145)"
      >
        <VStack gap="4">
          <Heading color="fcPurple" align="center" size="48">
            Castcred
          </Heading>
          <Text align="center" size="18">
            +/- reputation weighted scale as an action bar.
          </Text>
          <Text decoration="underline" color="fcPurple" align="center"  size="14">
            By @injustcuz and @0x94t3z
          </Text>
        </VStack>
      </Box>
    ),
    intents: [
      <Button.Link href={REPPED_URL}>⌁ Repped</Button.Link>,
      <Button.Link href={NEGGED_URL}>⌁ Negged</Button.Link>,
      <Button value="leaderboard" action="/leaderboard">
        🏆 Leaderboard
      </Button>,
      <Button value="start" action="/my-reputation">
        🎖️ My Reputation
      </Button>,
    ],
  });
});

app.frame("/leaderboard", async (c) => {
  const leaders = await redis.zrevrange("score", 0, 2, "WITHSCORES");
  const [firstFid, firstScore, secondFid, secondScore, thirdFid, thirdScore] =
    leaders;

  const firstName = await redis.hget("usernames", firstFid);
  const secondName = await redis.hget("usernames", secondFid);
  const thirdName = await redis.hget("usernames", thirdFid);

  return c.res({
    image: (
      <Box
        grow
        alignVertical="center"
        backgroundColor="white"
        padding="32"
        border="1em solid rgb(71,42,145)"
      >
        <VStack gap="4">
          <Heading color="fcPurple" align="center" size="48">
            Leaderboard
          </Heading>
          <Box>
            <Text align="left" size="24">
              🥇 @{firstName}: {firstScore}
            </Text>
            <Text align="left" size="24">
              🥈 @{secondName}: {secondScore}
            </Text>
            <Text align="left" size="24">
              🥉 @{thirdName}: {thirdScore}
            </Text>
          </Box>
        </VStack>
      </Box>
    ),
    intents: [
      <Button.Reset>⏏︎ Back</Button.Reset>,
      <Button.Link href={CHANNEL_URL}>/castcred</Button.Link>,
    ],
  });
});

app.frame("/my-reputation", async (c) => {
  const { frameData } = c;
  const { fid } = frameData as unknown as { buttonIndex?: number; fid?: string };
  
  let score = "0";
  try {
    score = (await redis.zscore("score", fid as string)) ?? "0";
  } catch (e) {}

  return c.res({
    image: (
      <Box
        grow
        alignVertical="center"
        backgroundColor="white"
        padding="32"
        border="1em solid rgb(71,42,145)"
      >
        <VStack gap="4">
          <Heading color="fcPurple" align="center" size="48">
            Your Reputation:
          </Heading>
          <Text align="center" size="32">
            {score}
          </Text>
        </VStack>
      </Box>
    ),
    intents: [
      <Button.Reset>⏏︎ Back</Button.Reset>,
      <Button.Link href={CHANNEL_URL}>/castcred</Button.Link>,
    ],
  });
});

// @ts-ignore
const isEdgeFunction = typeof EdgeFunction !== "undefined";
const isProduction = isEdgeFunction || (import.meta as any).env?.MODE !== "development";
devtools(app, isProduction ? { assetsPath: "/.frog" } : { serveStatic });

export const GET = handle(app);
export const POST = handle(app);