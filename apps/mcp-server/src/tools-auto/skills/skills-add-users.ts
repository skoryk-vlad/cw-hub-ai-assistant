import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type SkillsAddUsersTool = ToolDefinition<{
  body: z.ZodObject<{ users: z.ZodArray<z.ZodNumber>; skillId: z.ZodNumber; desirable: z.ZodNullable<z.ZodBoolean>; expert: z.ZodNullable<z.ZodBoolean> }>;
  accessToken: z.ZodString;
}>;

export function getSkillsAddUsersTool(): SkillsAddUsersTool {
  const name: string = 'skills-add-users';

  const config: SkillsAddUsersTool[1] = {
    title: "Add users to skills",
    description: "Returns a list of user skills",
    inputSchema: {
      body: z.object({ users: z.array(z.number()), skillId: z.number(), desirable: z.boolean().nullable(), expert: z.boolean().nullable() }),
      accessToken: z.string(),
    },
  };

  const cb: SkillsAddUsersTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.post(`${process.env.APP_URL}/skills/users`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
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
