import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type RatingsResumeUpdateTool = ToolDefinition<{
  body: z.ZodObject<{ resume: z.ZodArray<z.ZodObject<{ userId: z.ZodNumber; tagId: z.ZodNumber }>>; seasonId: z.ZodNumber }>;
  accessToken: z.ZodString;
}>;

export function getRatingsResumeUpdateTool(): RatingsResumeUpdateTool {
  const name: string = 'ratings-resume-update';

  const config: RatingsResumeUpdateTool[1] = {
    title: "Update resume details",
    description: "Updates resume information and returns affected count",
    inputSchema: {
      body: z.object({ resume: z.array(z.object({ userId: z.number(), tagId: z.number() })), seasonId: z.number() }),
      accessToken: z.string(),
    },
  };

  const cb: RatingsResumeUpdateTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.patch(`${process.env.APP_URL}/resume/update`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
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
