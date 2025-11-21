import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type RatingsGetUsersCountTool = ToolDefinition<{
  offset: z.ZodNullable<z.ZodNumber>;
  limit: z.ZodNullable<z.ZodNumber>;
  seasonId: z.ZodNumber;
  userName: z.ZodNullable<z.ZodString>;
  withMyFeedback: z.ZodBoolean;
  accessToken: z.ZodString;
}>;

export function getRatingsGetUsersCountTool(): RatingsGetUsersCountTool {
  const name: string = 'ratings-get-users-count';

  const config: RatingsGetUsersCountTool[1] = {
    title: "Retrieve total user count",
    description: "Returns the total number of users.",
    inputSchema: {
      offset: z.number().nullable(),
      limit: z.number().nullable(),
      seasonId: z.number(),
      userName: z.string().nullable(),
      withMyFeedback: z.boolean(),
      accessToken: z.string(),
    },
  };

  const cb: RatingsGetUsersCountTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/ratings/count`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
