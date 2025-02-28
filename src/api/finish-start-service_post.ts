import { users } from "@clerk/clerk-sdk-node";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { generateToken, headers } from "../lambda-helpers";
import randomstring from "randomstring";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { userId, callbackToken, service } = JSON.parse(event.body) as {
    service: string;
    callbackToken: string;
    userId: string;
  };

  if (!userId) {
    return {
      statusCode: 400,
      body: "UserId is required",
      headers: headers(event),
    };
  }

  const { checkoutToken, ...rest } = await users
    .getUser(userId)
    .then((r) => r.privateMetadata as { checkoutToken?: string });
  if (!checkoutToken) {
    return {
      statusCode: 401,
      body: "User not awaiting a service start.",
      headers: headers(event),
    };
  }
  if (checkoutToken !== callbackToken) {
    return {
      statusCode: 401,
      body: "Unauthorized call to finish starting service.",
      headers: headers(event),
    };
  }

  await users.updateUser(userId, {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore https://github.com/clerkinc/clerk-sdk-node/pull/12#issuecomment-785306137
    privateMetadata: JSON.stringify(rest),
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore https://github.com/clerkinc/clerk-sdk-node/pull/12#issuecomment-785306137
    publicMetadata: JSON.stringify({
      [service]: {
        token: generateToken(userId),
      },
    }),
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
    headers: headers(event),
  };
};
