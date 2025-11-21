import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type RatingsFeedbackTool = ToolDefinition<{
  seasonId: z.ZodNumber;
  accessToken: z.ZodString;
}>;

export function getRatingsFeedbackTool(): RatingsFeedbackTool {
  const name: string = 'ratings-feedback';

  const config: RatingsFeedbackTool[1] = {
    title: "Retrieve user feedback",
    description: "Returns feedback data for the authenticated user.",
    inputSchema: {
      seasonId: z.number(),
      accessToken: z.string(),
    },
  };

  const cb: RatingsFeedbackTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/ratings/feedback`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
