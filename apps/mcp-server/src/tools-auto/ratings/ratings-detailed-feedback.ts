import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type RatingsDetailedFeedbackTool = ToolDefinition<{
  seasonId: z.ZodNumber;
  userId: z.ZodNumber;
  accessToken: z.ZodString;
}>;

export function getRatingsDetailedFeedbackTool(): RatingsDetailedFeedbackTool {
  const name: string = 'ratings-detailed-feedback';

  const config: RatingsDetailedFeedbackTool[1] = {
    title: "Retrieve detailed user feedback",
    description: "Returns detailed feedback data for users.",
    inputSchema: {
      seasonId: z.number(),
      userId: z.number(),
      accessToken: z.string(),
    },
  };

  const cb: RatingsDetailedFeedbackTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/ratings/detailed-feedback`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
