import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type RatingsAllFeedbackTool = ToolDefinition<{
  offset: z.ZodNullable<z.ZodNumber>;
  limit: z.ZodNullable<z.ZodNumber>;
  seasonId: z.ZodNumber;
  userIds: z.ZodNullable<z.ZodArray<z.ZodNumber>>;
  sortDirection: z.ZodEnum<["DESC", "ASC"]>;
  sortField: z.ZodNullable<z.ZodEnum<["name", "tagCount"]>>;
  accessToken: z.ZodString;
}>;

export function getRatingsAllFeedbackTool(): RatingsAllFeedbackTool {
  const name: string = 'ratings-all-feedback';

  const config: RatingsAllFeedbackTool[1] = {
    title: "Retrieve all user feedbacks",
    description: "Returns a list of all user feedback entries.",
    inputSchema: {
      offset: z.number().nullable(),
      limit: z.number().nullable(),
      seasonId: z.number(),
      userIds: z.array(z.number()).nullable(),
      sortDirection: z.enum(["DESC", "ASC"]),
      sortField: z.enum(["name", "tagCount"]).nullable(),
      accessToken: z.string(),
    },
  };

  const cb: RatingsAllFeedbackTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/ratings/all-feedbacks`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
