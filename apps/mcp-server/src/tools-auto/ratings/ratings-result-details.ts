import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type RatingsResultDetailsTool = ToolDefinition<{
  seasonId: z.ZodNumber;
  userId: z.ZodNumber;
  tagId: z.ZodNumber;
  accessToken: z.ZodString;
}>;

export function getRatingsResultDetailsTool(): RatingsResultDetailsTool {
  const name: string = 'ratings-result-details';

  const config: RatingsResultDetailsTool[1] = {
    title: "Fetch detailed rating results",
    description: "Returns a list of detailed rating results.",
    inputSchema: {
      seasonId: z.number(),
      userId: z.number(),
      tagId: z.number(),
      accessToken: z.string(),
    },
  };

  const cb: RatingsResultDetailsTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/ratings/result-details`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
