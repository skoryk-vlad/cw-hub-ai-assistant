import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type SkillsFindAllTool = ToolDefinition<{
  offset: z.ZodNullable<z.ZodNumber>;
  limit: z.ZodNullable<z.ZodNumber>;
  name: z.ZodNullable<z.ZodString>;
  accessToken: z.ZodString;
}>;

export function getSkillsFindAllTool(): SkillsFindAllTool {
  const name: string = 'skills-find-all';

  const config: SkillsFindAllTool[1] = {
    title: "Retrieve all skills",
    description: "Returns a list of skills.",
    inputSchema: {
      offset: z.number().nullable(),
      limit: z.number().nullable(),
      name: z.string().nullable(),
      accessToken: z.string(),
    },
  };

  const cb: SkillsFindAllTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/skills`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
