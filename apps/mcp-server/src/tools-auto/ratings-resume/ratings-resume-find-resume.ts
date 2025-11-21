import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type RatingsResumeFindResumeTool = ToolDefinition<{
  offset: z.ZodNullable<z.ZodNumber>;
  limit: z.ZodNullable<z.ZodNumber>;
  seasonId: z.ZodNullable<z.ZodNumber>;
  userIds: z.ZodNullable<z.ZodArray<z.ZodNumber>>;
  justCurrentResume: z.ZodBoolean;
  tagId: z.ZodNullable<z.ZodNumber>;
  accessToken: z.ZodString;
}>;

export function getRatingsResumeFindResumeTool(): RatingsResumeFindResumeTool {
  const name: string = 'ratings-resume-find-resume';

  const config: RatingsResumeFindResumeTool[1] = {
    title: "Retrieve ratings resume data",
    description: "Returns a list of ratings resume entries",
    inputSchema: {
      offset: z.number().nullable(),
      limit: z.number().nullable(),
      seasonId: z.number().nullable(),
      userIds: z.array(z.number()).nullable(),
      justCurrentResume: z.boolean(),
      tagId: z.number().nullable(),
      accessToken: z.string(),
    },
  };

  const cb: RatingsResumeFindResumeTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/resume`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
