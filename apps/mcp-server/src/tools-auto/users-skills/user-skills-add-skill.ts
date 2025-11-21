import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type UserSkillsAddSkillTool = ToolDefinition<{
  id: z.ZodNumber;
  skillId: z.ZodNumber;
  body: z.ZodObject<{ desirable: z.ZodBoolean; expert: z.ZodBoolean; skillId: z.ZodNumber; userId: z.ZodNumber }>;
  accessToken: z.ZodString;
}>;

export function getUserSkillsAddSkillTool(): UserSkillsAddSkillTool {
  const name: string = 'user-skills-add-skill';

  const config: UserSkillsAddSkillTool[1] = {
    title: "Add a skill to user",
    description: "Associates a specified skill with a user.",
    inputSchema: {
      id: z.number(),
      skillId: z.number(),
      body: z.object({ desirable: z.boolean(), expert: z.boolean(), skillId: z.number(), userId: z.number() }),
      accessToken: z.string(),
    },
  };

  const cb: UserSkillsAddSkillTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.post(`${process.env.APP_URL}/users/${params.id}/skills/${params.skillId}`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
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
