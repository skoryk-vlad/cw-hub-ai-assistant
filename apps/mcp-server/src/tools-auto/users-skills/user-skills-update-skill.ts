import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type UserSkillsUpdateSkillTool = ToolDefinition<{
  id: z.ZodNumber;
  skillId: z.ZodNumber;
  body: z.ZodObject<{ desirable: z.ZodBoolean; expert: z.ZodBoolean; skillId: z.ZodNumber; userId: z.ZodNumber }>;
  accessToken: z.ZodString;
}>;

export function getUserSkillsUpdateSkillTool(): UserSkillsUpdateSkillTool {
  const name: string = 'user-skills-update-skill';

  const config: UserSkillsUpdateSkillTool[1] = {
    title: "Update a user's skill",
    description: "Modifies an existing skill for a user",
    inputSchema: {
      id: z.number(),
      skillId: z.number(),
      body: z.object({ desirable: z.boolean(), expert: z.boolean(), skillId: z.number(), userId: z.number() }),
      accessToken: z.string(),
    },
  };

  const cb: UserSkillsUpdateSkillTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.patch(`${process.env.APP_URL}/users/${params.id}/skills/${params.skillId}`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
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
