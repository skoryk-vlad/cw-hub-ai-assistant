import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type UserSkillsRemoveSkillTool = ToolDefinition<{
  id: z.ZodNumber;
  skillId: z.ZodNumber;
  accessToken: z.ZodString;
}>;

export function getUserSkillsRemoveSkillTool(): UserSkillsRemoveSkillTool {
  const name: string = 'user-skills-remove-skill';

  const config: UserSkillsRemoveSkillTool[1] = {
    title: "Remove a user's skill",
    description: "Deletes a specific skill from a user's profile",
    inputSchema: {
      id: z.number(),
      skillId: z.number(),
      accessToken: z.string(),
    },
  };

  const cb: UserSkillsRemoveSkillTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.delete(`${process.env.APP_URL}/users/${params.id}/skills/${params.skillId}`, { headers: { Authorization: `Bearer ${accessToken}` } });
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
