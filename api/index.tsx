// import {
//   init,
//   getFarcasterUserDetails,
//   validateFramesMessage,
// } from "@airstack/frames";
import { Button, Frog} from 'frog'
import { handle } from 'frog/vercel'
import { repped } from "../lib/repped.js";
import { negged } from "../lib/negged.js";
import { Box, Heading, Text, VStack, Spacer, vars } from "../lib/ui.js";
import redis from "../lib/redis.js";
import dotenv from 'dotenv';

// Uncomment this packages to tested on local server
// import { devtools } from 'frog/dev';
// import { serveStatic } from 'frog/serve-static';

// Load environment variables from .env file
dotenv.config();

const CHANNEL_URL = "https://warpcast.com/~/channel/castcred";

const baseUrlNeynarV2 = process.env.BASE_URL_NEYNAR_V2;

// init(process.env.AIRSTACK_API_KEY as string);

export const app = new Frog({
  assetsPath: "/",
  basePath: "/api",
  ui: { vars },
  browserLocation: 'https://github.com/Mr94t3z/castcreds',
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
          <Spacer size="16" />
          <Text align="center" size="18">
            +/- reputation weighted scale as an action bar.
          </Text>
          <Spacer size="22" />
          <Text decoration="underline" color="fcPurple" align="center"  size="14">
            By @injustcuz and @0x94t3z
          </Text>
        </VStack>
      </Box>
    ),
    intents: [
      <Button.AddCastAction action="/castcred">
        ⎋ Install Action
      </Button.AddCastAction>,
      <Button value="leaderboard" action="/leaderboard">
        🏆 Leaderboard
      </Button>,
      <Button value="start" action="/my-reputation">
        🎖️ My Reputation
      </Button>,
    ],
  });
});

app.castAction(
  '/castcred',
  (c) => {
    // Stringify the entire castId object
    const castId = JSON.stringify(c.actionData.castId);

    // Parse the message back to an object to extract fid
    const parsedCastId = JSON.parse(castId);
    const castFid = parsedCastId.fid;
    const fromFid = c.actionData.fid;

    return c.frame({ path: `/castcreed/${castFid}/from/${fromFid}`})
  }, 
  { name: "Castcred", icon: "log", description: "Reputation weighted scale as an action bar by @injustcuz and @0x94t3z"}
)

app.frame('/castcreed/:castFid/from/:fromFid', async (c) => {
  const { buttonValue } = c
  const { castFid, fromFid } = c.req.param();

  if (fromFid === castFid) {
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
                Nice Try
              </Heading>
              <Spacer size="16" />
              <Text align="center" color="green" size="18">
                You can't rep/neg cred on yourself.
              </Text>
              <Spacer size="22" />
              <Text decoration="underline" color="fcPurple" align="center"  size="14">
                By @injustcuz and @0x94t3z
              </Text>
            </VStack>
          </Box>
        ),
    });
  }

  try {
    const response = await fetch(`${baseUrlNeynarV2}/user/bulk?fids=${castFid}`, {
        method: 'GET',
        headers: {
            'accept': 'application/json',
            'api_key': process.env.NEYNAR_API_KEY || '',
        },
    });

    const userFarcasterData = await response.json();
    const userData = userFarcasterData.users[0];

    const username = userData.username;

    if (buttonValue === 'repped') {
      await repped(Number(castFid), username);
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
              <Spacer size="16" />
              <Text align="center" color="red" size="18">
                Repped cred for @{username} successfully!
              </Text>
              <Spacer size="22" />
              <Text decoration="underline" color="fcPurple" align="center"  size="14">
                By @injustcuz and @0x94t3z
              </Text>
            </VStack>
          </Box>
        ),
      });
    } else if (buttonValue === 'negged') {
      await negged(Number(castFid), username);
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
              <Spacer size="16" />
              <Text align="center" size="18">
                Negged cred for @{username} successfully!
              </Text>
              <Spacer size="22" />
              <Text decoration="underline" color="fcPurple" align="center"  size="14">
                By @injustcuz and @0x94t3z
              </Text>
            </VStack>
          </Box>
        ),
      });
    }

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
            <Spacer size="16" />
            <Text align="center" size="18">
              Choose to rep/neg cred for @{username} 👇🏻
            </Text>
            <Spacer size="22" />
            <Text decoration="underline" color="fcPurple" align="center"  size="14">
              By @injustcuz and @0x94t3z
            </Text>
          </VStack>
        </Box>
      ),
      intents: [
        <Button value='repped'>Repped (+)</Button>,
        <Button value='negged'>Negged (-)</Button>,
      ],
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
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
              Error
            </Heading>
            <Spacer size="16" />
            <Text align="center" size="18">
              Uh oh, something went wrong. Try again.
            </Text>
            <Spacer size="22" />
            <Text decoration="underline" color="fcPurple" align="center"  size="14">
              By @injustcuz and @0x94t3z
            </Text>
          </VStack>
        </Box>
    ),
  });
}
})

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

// Uncomment this line code to tested on local server
// devtools(app, { serveStatic });

export const GET = handle(app)
export const POST = handle(app)