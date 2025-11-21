import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type RatingsResumeCreateTool = ToolDefinition<{
  body: z.ZodObject<{ resume: z.ZodArray<z.ZodObject<{ userId: z.ZodNumber; tagId: z.ZodNumber }>>; seasonId: z.ZodNumber }>;
  accessToken: z.ZodString;
}>;

export function getRatingsResumeCreateTool(): RatingsResumeCreateTool {
  const name: string = 'ratings-resume-create';

  const config: RatingsResumeCreateTool[1] = {
    title: "Create new resume entry",
    description: "Creates a new resume and returns affected count.",
    inputSchema: {
      body: z.object({ resume: z.array(z.object({ userId: z.number(), tagId: z.number() })), seasonId: z.number() }),
      accessToken: z.string(),
    },
  };

  const cb: RatingsResumeCreateTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.post(`${process.env.APP_URL}/resume`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
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
