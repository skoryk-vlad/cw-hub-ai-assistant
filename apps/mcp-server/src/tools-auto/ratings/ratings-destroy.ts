import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type RatingsDestroyTool = ToolDefinition<{
  userId: z.ZodNumber;
  body: z.ZodObject<{ seasonId: z.ZodNumber }>;
  accessToken: z.ZodString;
}>;

export function getRatingsDestroyTool(): RatingsDestroyTool {
  const name: string = 'ratings-destroy';

  const config: RatingsDestroyTool[1] = {
    title: "Delete a user's vote",
    description: "Removes a vote and returns the affected count",
    inputSchema: {
      userId: z.number(),
      body: z.object({ seasonId: z.number() }),
      accessToken: z.string(),
    },
  };

  const cb: RatingsDestroyTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.delete(`${process.env.APP_URL}/ratings/vote/${params.userId}`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
      const responseString = JSON.stringify(response.data);
      return { content: [{ type: 'text', text: responseString }] };
    } catch (err) {
      let error =
        err instanceof AxiosError
          ? JSON.stringify(err.response.data)
          : JSON.stringify(err);

      return {
        content: [
          {
            type: 'text',
            text: `Request failed. Error: ${error}`,
          },
        ],
      };
    }
  };

  return [name, config, cb];
}
