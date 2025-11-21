import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type SkillsSearchSkillTool = ToolDefinition<{
  offset: z.ZodNullable<z.ZodNumber>;
  limit: z.ZodNullable<z.ZodNumber>;
  names: z.ZodNullable<z.ZodArray<z.ZodString>>;
  expert: z.ZodNullable<z.ZodBoolean>;
  desirable: z.ZodNullable<z.ZodBoolean>;
  accessToken: z.ZodString;
}>;

export function getSkillsSearchSkillTool(): SkillsSearchSkillTool {
  const name: string = 'skills-search-skill';

  const config: SkillsSearchSkillTool[1] = {
    title: "Search skills by name",
    description: "Returns skills with associated users.",
    inputSchema: {
      offset: z.number().nullable(),
      limit: z.number().nullable(),
      names: z.array(z.string()).nullable(),
      expert: z.boolean().nullable(),
      desirable: z.boolean().nullable(),
      accessToken: z.string(),
    },
  };

  const cb: SkillsSearchSkillTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/skills/search`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
