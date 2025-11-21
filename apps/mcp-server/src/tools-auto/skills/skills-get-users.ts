import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type SkillsGetUsersTool = ToolDefinition<{
  offset: z.ZodNullable<z.ZodNumber>;
  limit: z.ZodNullable<z.ZodNumber>;
  skillIds: z.ZodNullable<z.ZodArray<z.ZodNumber>>;
  accessToken: z.ZodString;
}>;

export function getSkillsGetUsersTool(): SkillsGetUsersTool {
  const name: string = 'skills-get-users';

  const config: SkillsGetUsersTool[1] = {
    title: "Retrieve users with specific skills",
    description: "Returns a list of users with their associated skills.",
    inputSchema: {
      offset: z.number().nullable(),
      limit: z.number().nullable(),
      skillIds: z.array(z.number()).nullable(),
      accessToken: z.string(),
    },
  };

  const cb: SkillsGetUsersTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/skills/users`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
