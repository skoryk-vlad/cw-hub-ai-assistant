import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type RatingsStoreTool = ToolDefinition<{
  userId: z.ZodNumber;
  body: z.ZodObject<{ reason: z.ZodString; tagIds: z.ZodArray<z.ZodNumber>; feedback: z.ZodNullable<z.ZodString>; seasonId: z.ZodNumber }>;
  accessToken: z.ZodString;
}>;

export function getRatingsStoreTool(): RatingsStoreTool {
  const name: string = 'ratings-store';

  const config: RatingsStoreTool[1] = {
    title: "Upvote a team member",
    description: "Stores a vote for a specified user.",
    inputSchema: {
      userId: z.number(),
      body: z.object({ reason: z.string(), tagIds: z.array(z.number()), feedback: z.string().nullable(), seasonId: z.number() }),
      accessToken: z.string(),
    },
  };

  const cb: RatingsStoreTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.post(`${process.env.APP_URL}/ratings/vote/${params.userId}`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
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
